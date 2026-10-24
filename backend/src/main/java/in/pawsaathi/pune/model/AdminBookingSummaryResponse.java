package in.pawsaathi.pune.model;

import in.pawsaathi.pune.entity.BookingStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

public record AdminBookingSummaryResponse(
        long id,
        BookingStatus status,
        LocalDateTime startsAt,
        LocalDateTime endsAt,
        long durationMinutes,
        BigDecimal hourlyRate,
        BigDecimal totalAmount,
        String serviceName,
        String petName,
        String customerName,
        Instant createdAt) {}
