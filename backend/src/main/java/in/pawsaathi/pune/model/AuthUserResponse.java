package in.pawsaathi.pune.model;

public record AuthUserResponse(
        long id, String name, String email, String role, boolean mustChangePassword) {}
