package in.pawsaathi.pune.service;

import in.pawsaathi.pune.model.AuthUserResponse;
import in.pawsaathi.pune.model.LoginRequest;
import in.pawsaathi.pune.model.PasswordChangeRequest;
import in.pawsaathi.pune.model.RegisterRequest;

public interface AuthService {
    AuthRegistrationResult register(RegisterRequest request);

    AuthSession login(LoginRequest request);

    AuthSession refresh(String cookieToken, String bodyToken);

    void logout(String cookieToken, String bodyToken);

    void logoutAll(long userId);

    AuthUserResponse me(long userId);

    void changePassword(long userId, PasswordChangeRequest request);
}
