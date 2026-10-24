package in.pawsaathi.pune.model;

import java.time.Instant;

public record AccountProfileResponse(
        long id,
        String name,
        String email,
        String phone,
        String photoUrl,
        String role,
        String status,
        boolean verified,
        boolean mustChangePassword,
        Instant createdAt,
        Instant updatedAt) {}
