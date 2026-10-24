package in.pawsaathi.pune.service;

import in.pawsaathi.pune.entity.AppUser;
import in.pawsaathi.pune.entity.AuditLog;
import in.pawsaathi.pune.exception.BadRequestException;
import in.pawsaathi.pune.exception.ConflictException;
import in.pawsaathi.pune.exception.NotFoundException;
import in.pawsaathi.pune.model.AccountProfileResponse;
import in.pawsaathi.pune.model.UpdateAccountProfileRequest;
import in.pawsaathi.pune.repository.AuditLogRepository;
import in.pawsaathi.pune.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Base64;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AccountServiceImpl implements AccountService {
    private static final int MAX_PROFILE_PHOTO_BYTES = 2 * 1024 * 1024;
    private static final Pattern PROFILE_PHOTO =
            Pattern.compile(
                    "^data:image/(?:png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$",
                    Pattern.CASE_INSENSITIVE);

    private final UserRepository users;
    private final AuditLogRepository auditLogs;

    public AccountServiceImpl(UserRepository users, AuditLogRepository auditLogs) {
        this.users = users;
        this.auditLogs = auditLogs;
    }

    @Override
    @Transactional(readOnly = true)
    public AccountProfileResponse profile(long userId) {
        return response(findUser(userId));
    }

    @Override
    @Transactional
    public AccountProfileResponse updateProfile(
            long userId, UpdateAccountProfileRequest request) {
        AppUser user = findUser(userId);
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (!email.equals(user.getEmail()) && users.existsByEmail(email)) {
            throw new ConflictException("An account with this email already exists.");
        }
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPhone(phone(request.phone()));
        user.setPhotoUrl(photo(request.photoUrl()));
        AppUser saved = users.saveAndFlush(user);
        auditLogs.save(new AuditLog(saved, "ACCOUNT_PROFILE_UPDATED", "USER", saved.getId()));
        return response(saved);
    }

    private AppUser findUser(long userId) {
        return users.findById(userId)
                .orElseThrow(() -> new NotFoundException("Account not found."));
    }

    private String phone(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String photo(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String photo = value.trim();
        Matcher matcher = PROFILE_PHOTO.matcher(photo);
        if (!matcher.matches()) {
            throw new BadRequestException(
                    "Profile picture must be a JPG, PNG or WebP image.");
        }
        String encoded = photo.substring(photo.indexOf(',') + 1);
        if ((long) encoded.length() * 3 / 4 > MAX_PROFILE_PHOTO_BYTES + 3) {
            throw new BadRequestException("Profile picture must be 2 MB or smaller.");
        }
        try {
            if (Base64.getDecoder().decode(encoded).length > MAX_PROFILE_PHOTO_BYTES) {
                throw new BadRequestException("Profile picture must be 2 MB or smaller.");
            }
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Profile picture is not a valid image.");
        }
        return photo;
    }

    private AccountProfileResponse response(AppUser user) {
        return new AccountProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getPhotoUrl(),
                user.roleName(),
                user.getStatus(),
                user.isVerified(),
                user.isMustChangePassword(),
                user.getCreatedAt(),
                user.getUpdatedAt());
    }
}
