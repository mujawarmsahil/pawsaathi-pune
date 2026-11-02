package in.pawsaathi.pune.model;

import java.time.Instant;
import java.util.List;

public record AdminCustomerResponse(
        long id,
        String name,
        String email,
        String phone,
        String photoUrl,
        String status,
        String area,
        Instant registeredAt,
        Instant updatedAt,
        List<AdminCustomerPetResponse> pets) {}
