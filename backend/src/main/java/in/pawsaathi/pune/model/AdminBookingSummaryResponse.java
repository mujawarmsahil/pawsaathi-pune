package in.pawsaathi.pune.model;

import in.pawsaathi.pune.entity.BookingStatus;
import in.pawsaathi.pune.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

public record AdminBookingSummaryResponse(
        long id,
        BookingStatus status,
        PaymentStatus paymentStatus,
        String cancellationReason,
        Integer rating,
        String review,
        LocalDateTime startsAt,
        LocalDateTime endsAt,
        long durationMinutes,
        BigDecimal hourlyRate,
        BigDecimal totalAmount,
        String serviceName,
        String petName,
        String customerName,
        String customerEmail,
        String customerPhone,
        String caretakerName,
        String caretakerEmail,
        String caretakerPhone,
        String customerPhotoUrl,
        String caretakerPhotoUrl,
        String petPhotoUrl,
        String petSpecies,
        String petBreed,
        BigDecimal petAgeYears,
        String petNotes,
        String petFoodNotes,
        Instant createdAt) {}
