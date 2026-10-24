package in.pawsaathi.pune.model;

import java.time.Instant;

public record ReviewResponse(
        long id,
        int rating,
        String comment,
        String moderationStatus,
        long bookingId,
        String author,
        String caretaker,
        Instant createdAt) {}
