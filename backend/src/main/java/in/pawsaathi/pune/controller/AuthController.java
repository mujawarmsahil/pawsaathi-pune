package in.pawsaathi.pune.controller;

import in.pawsaathi.pune.config.AppProperties;
import in.pawsaathi.pune.model.AuthSessionResponse;
import in.pawsaathi.pune.model.AuthUserResponse;
import in.pawsaathi.pune.model.LoginRequest;
import in.pawsaathi.pune.model.PasswordChangeRequest;
import in.pawsaathi.pune.model.RefreshRequest;
import in.pawsaathi.pune.model.RegisterRequest;
import in.pawsaathi.pune.security.CurrentUserProvider;
import in.pawsaathi.pune.service.AuthRegistrationResult;
import in.pawsaathi.pune.service.AuthService;
import in.pawsaathi.pune.service.AuthSession;

import jakarta.validation.Valid;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletResponse;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final String REFRESH_COOKIE = "pawsaathi_refresh";

    private final AuthService auth;
    private final CurrentUserProvider currentUser;
    private final AppProperties properties;

    public AuthController(
            AuthService auth, CurrentUserProvider currentUser, AppProperties properties) {
        this.auth = auth;
        this.currentUser = currentUser;
        this.properties = properties;
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public AuthUserResponse me() {
        return auth.me(currentUser.require().id());
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        AuthRegistrationResult result = auth.register(request);
        if (result.requiresApproval()) {
            return ResponseEntity.status(HttpStatus.ACCEPTED)
                    .body(
                            Map.of(
                                    "status",
                                    "PENDING_APPROVAL",
                                    "message",
                                    result.pendingApprovalMessage()));
        }
        return ResponseEntity.ok(session(result.session(), response));
    }

    @PostMapping("/login")
    public AuthSessionResponse login(
            @Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        return session(auth.login(request), response);
    }

    @PostMapping("/refresh")
    public AuthSessionResponse refresh(
            @CookieValue(name = REFRESH_COOKIE, required = false) String cookieToken,
            @RequestBody(required = false) RefreshRequest request,
            HttpServletResponse response) {
        String bodyToken = request == null ? null : request.refreshToken();
        return session(auth.refresh(cookieToken, bodyToken), response);
    }

    @PostMapping("/logout")
    public void logout(
            @CookieValue(name = REFRESH_COOKIE, required = false) String cookieToken,
            @RequestBody(required = false) RefreshRequest request,
            HttpServletResponse response) {
        auth.logout(cookieToken, request == null ? null : request.refreshToken());
        clearRefreshCookie(response);
    }

    @PostMapping("/logout-all")
    @PreAuthorize("isAuthenticated()")
    public void logoutAll(HttpServletResponse response) {
        auth.logoutAll(currentUser.require().id());
        clearRefreshCookie(response);
    }

    @PostMapping("/password/change")
    @PreAuthorize("isAuthenticated()")
    public Map<String, String> changePassword(
            @Valid @RequestBody PasswordChangeRequest request, HttpServletResponse response) {
        auth.changePassword(currentUser.require().id(), request);
        clearRefreshCookie(response);
        return Map.of(
                "status", "PASSWORD_CHANGED", "message", "Password changed. Please sign in again.");
    }

    private AuthSessionResponse session(AuthSession session, HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie(session.refreshToken()).toString());
        return new AuthSessionResponse(session.accessToken(), session.user());
    }

    private ResponseCookie refreshCookie(String token) {
        return ResponseCookie.from(REFRESH_COOKIE, token)
                .httpOnly(true)
                .secure(properties.security().secureCookies())
                .sameSite("Strict")
                .path("/api/auth")
                .maxAge(Duration.ofDays(properties.jwt().refreshTokenDays()))
                .build();
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        response.addHeader(
                HttpHeaders.SET_COOKIE,
                ResponseCookie.from(REFRESH_COOKIE, "")
                        .httpOnly(true)
                        .secure(properties.security().secureCookies())
                        .sameSite("Strict")
                        .path("/api/auth")
                        .maxAge(Duration.ZERO)
                        .build()
                        .toString());
    }
}
