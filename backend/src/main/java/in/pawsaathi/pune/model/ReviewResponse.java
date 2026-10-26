package in.pawsaathi.pune.model;

import java.time.Instant;

public record ReviewResponse(
        long id,
        int rating,
        String comment,
        long bookingId,
        long caretakerId,
        long petId,
        String petName,
        String author,
        String caretaker,
        Instant createdAt) {}
