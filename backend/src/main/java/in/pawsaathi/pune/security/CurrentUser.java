package in.pawsaathi.pune.security;

public record CurrentUser(long id, String email, String role, boolean mustChangePassword) {}
