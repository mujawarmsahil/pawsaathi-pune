package in.pawsaathi.pune.model;

import in.pawsaathi.pune.entity.SupportTicketStatus;

import java.time.Instant;

public record SupportTicketResponse(
        long id,
        String subject,
        String description,
        SupportTicketStatus status,
        String priority,
        Long bookingId,
        String customer,
        Instant createdAt) {}
