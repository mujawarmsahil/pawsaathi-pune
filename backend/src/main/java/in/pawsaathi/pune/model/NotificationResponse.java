package in.pawsaathi.pune.model;

import java.time.Instant;

public record NotificationResponse(
        long id, String title, String body, String type, Instant readAt, Instant createdAt) {}
