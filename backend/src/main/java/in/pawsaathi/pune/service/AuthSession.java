package in.pawsaathi.pune.service;

import in.pawsaathi.pune.model.AuthUserResponse;

public record AuthSession(
        String accessToken, String refreshToken, AuthUserResponse user) {}
