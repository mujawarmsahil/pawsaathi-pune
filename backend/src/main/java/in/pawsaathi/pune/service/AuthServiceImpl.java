package in.pawsaathi.pune.service;

import in.pawsaathi.pune.config.AppProperties;
import in.pawsaathi.pune.entity.AppUser;
import in.pawsaathi.pune.entity.AuditLog;
import in.pawsaathi.pune.entity.CaretakerProfile;
import in.pawsaathi.pune.entity.RefreshToken;
import in.pawsaathi.pune.exception.BadRequestException;
import in.pawsaathi.pune.exception.ConflictException;
import in.pawsaathi.pune.exception.ForbiddenException;
import in.pawsaathi.pune.exception.NotFoundException;
import in.pawsaathi.pune.exception.UnauthorizedException;
import in.pawsaathi.pune.model.AuthUserResponse;
import in.pawsaathi.pune.model.LoginRequest;
import in.pawsaathi.pune.model.PasswordChangeRequest;
import in.pawsaathi.pune.model.RegisterRequest;
import in.pawsaathi.pune.repository.AuditLogRepository;
import in.pawsaathi.pune.repository.CaretakerProfileRepository;
import in.pawsaathi.pune.repository.RefreshTokenRepository;
import in.pawsaathi.pune.repository.RoleRepository;
import in.pawsaathi.pune.repository.UserRepository;
import in.pawsaathi.pune.security.JwtService;
import in.pawsaathi.pune.validation.PasswordPolicy;
import in.pawsaathi.pune.validation.PublicRegistrationRolePolicy;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;

@Service
public class AuthServiceImpl implements AuthService {
    private static final String INVALID_CREDENTIALS = "Email or password is incorrect.";
    private static final String SESSION_EXPIRED = "Your session expired. Please sign in again.";

    private final UserRepository users;
    private final RoleRepository roles;
    private final RefreshTokenRepository refreshTokens;
    private final CaretakerProfileRepository caretakers;
    private final AuditLogRepository auditLogs;
    private final JwtService jwt;
    private final PasswordEncoder passwords;
    private final PasswordPolicy passwordPolicy;
    private final PublicRegistrationRolePolicy registrationRoles;
    private final AppProperties properties;
    private final SecureRandom random = new SecureRandom();

    public AuthServiceImpl(
            UserRepository users,
            RoleRepository roles,
            RefreshTokenRepository refreshTokens,
            CaretakerProfileRepository caretakers,
            AuditLogRepository auditLogs,
            JwtService jwt,
            PasswordEncoder passwords,
            PasswordPolicy passwordPolicy,
            PublicRegistrationRolePolicy registrationRoles,
            AppProperties properties) {
        this.users = users;
        this.roles = roles;
        this.refreshTokens = refreshTokens;
        this.caretakers = caretakers;
        this.auditLogs = auditLogs;
        this.jwt = jwt;
        this.passwords = passwords;
        this.passwordPolicy = passwordPolicy;
        this.registrationRoles = registrationRoles;
        this.properties = properties;
    }

    @Override
    @Transactional
    public AuthRegistrationResult register(RegisterRequest request) {
        validatePassword(request.password());
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmail(email)) {
            throw new ConflictException("An account with this email already exists.");
        }
        String roleName = registrationRoles.normalize(request.role());
        AppUser user = new AppUser();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPhone(request.phone() == null ? null : request.phone().trim());
        user.setPasswordHash(passwords.encode(request.password()));
        user.setRole(
                roles.findByName(roleName)
                        .orElseThrow(
                                () -> new IllegalStateException("Configured role is missing.")));
        boolean caretaker = "CARETAKER".equals(roleName);
        if (caretaker) {
            user.setStatus("PENDING");
        }
        AppUser saved = users.save(user);
        if (caretaker) {
            caretakers.save(CaretakerProfile.pending(saved));
        }
        auditLogs.save(new AuditLog(saved, "ACCOUNT_REGISTERED", "USER", saved.getId()));
        if (caretaker) {
            return AuthRegistrationResult.pendingApproval(
                    "Your caretaker application has been submitted. An administrator must approve"
                            + " it before you can sign in.");
        }
        return AuthRegistrationResult.signedIn(issueSession(saved));
    }

    @Override
    @Transactional
    public AuthSession login(LoginRequest request) {
        AppUser user =
                users.findByEmail(request.email().trim().toLowerCase(Locale.ROOT))
                        .orElseThrow(() -> new UnauthorizedException(INVALID_CREDENTIALS));
        if (!passwords.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException(INVALID_CREDENTIALS);
        }
        if ("CARETAKER".equals(user.roleName())) {
            CaretakerProfile profile = caretakers.findByUserId(user.getId()).orElse(null);
            String approval = profile == null ? "PENDING" : profile.getApprovalStatus();
            if (!"APPROVED".equals(approval)) {
                throw new ForbiddenException(approvalMessage(approval));
            }
            if (!user.isActive()) {
                throw new ForbiddenException(
                        "Your caretaker account is not active. Contact support for help.");
            }
        } else if (!user.isActive()) {
            throw new UnauthorizedException(INVALID_CREDENTIALS);
        }
        return issueSession(user);
    }

    @Override
    @Transactional
    public AuthSession refresh(String cookieToken, String bodyToken) {
        String token = firstNonBlank(cookieToken, bodyToken);
        if (token == null) {
            throw new UnauthorizedException(SESSION_EXPIRED);
        }
        Instant now = Instant.now();
        RefreshToken stored =
                refreshTokens
                        .findLockedByTokenHash(hash(token))
                        .orElseThrow(() -> new UnauthorizedException(SESSION_EXPIRED));
        if (!stored.isUsableAt(now) || !canUseAccount(stored.getUser())) {
            throw new UnauthorizedException(SESSION_EXPIRED);
        }
        stored.revoke(now);
        return issueSession(stored.getUser());
    }

    @Override
    @Transactional
    public void logout(String cookieToken, String bodyToken) {
        String token = firstNonBlank(cookieToken, bodyToken);
        if (token != null) {
            refreshTokens.revokeByTokenHash(hash(token), Instant.now());
        }
    }

    @Override
    @Transactional
    public void logoutAll(long userId) {
        refreshTokens.revokeAllForUser(userId, Instant.now());
    }

    @Override
    @Transactional(readOnly = true)
    public AuthUserResponse me(long userId) {
        AppUser user =
                users.findById(userId)
                        .orElseThrow(() -> new NotFoundException("Account not found."));
        return toResponse(user);
    }

    @Override
    @Transactional
    public void changePassword(long userId, PasswordChangeRequest request) {
        validatePassword(request.newPassword());
        AppUser user =
                users.findById(userId)
                        .orElseThrow(() -> new NotFoundException("Account not found."));
        if (!passwords.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect.");
        }
        if (passwords.matches(request.newPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Choose a password you have not used before.");
        }
        user.setPasswordHash(passwords.encode(request.newPassword()));
        user.setMustChangePassword(false);
        users.save(user);
        refreshTokens.revokeAllForUser(userId, Instant.now());
    }

    private AuthSession issueSession(AppUser user) {
        byte[] bytes = new byte[48];
        random.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant expiresAt =
                Instant.now().plus(Duration.ofDays(properties.jwt().refreshTokenDays()));
        refreshTokens.save(new RefreshToken(user, hash(rawToken), expiresAt));
        return new AuthSession(jwt.create(user), rawToken, toResponse(user));
    }

    private AuthUserResponse toResponse(AppUser user) {
        return new AuthUserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.roleName(),
                user.isMustChangePassword());
    }

    private boolean canUseAccount(AppUser user) {
        if (!user.isActive()) {
            return false;
        }
        if (!"CARETAKER".equals(user.roleName())) {
            return true;
        }
        return caretakers
                .findByUserId(user.getId())
                .map(profile -> "APPROVED".equals(profile.getApprovalStatus()))
                .orElse(false);
    }

    private static String approvalMessage(String approvalStatus) {
        return switch (approvalStatus) {
            case "PENDING" ->
                    "Your caretaker application is awaiting approval. You can sign in once an"
                            + " administrator approves it.";
            case "REJECTED" ->
                    "Your caretaker application was rejected. Contact support if you believe this"
                            + " was a mistake.";
            case "SUSPENDED" ->
                    "Your caretaker account is suspended. Contact support for help.";
            default -> "Your caretaker account is not approved for sign-in yet.";
        };
    }

    private void validatePassword(String password) {
        if (!passwordPolicy.isStrong(password)) {
            throw new BadRequestException(
                    "Password must be 12-72 characters and include uppercase, lowercase, a number,"
                            + " and a symbol.");
        }
    }

    private static String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        return second != null && !second.isBlank() ? second : null;
    }

    private static String hash(String token) {
        try {
            return HexFormat.of()
                    .formatHex(
                            MessageDigest.getInstance("SHA-256")
                                    .digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Token hashing is unavailable.", exception);
        }
    }
}
