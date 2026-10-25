package in.pawsaathi.pune.model;

import in.pawsaathi.pune.entity.BookingStatus;
import in.pawsaathi.pune.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BookingResponse(
        long id,
        long customerId,
        long caretakerId,
        long petId,
        long serviceId,
        LocalDateTime startsAt,
        LocalDateTime endsAt,
        BookingStatus status,
        PaymentStatus paymentStatus,
        String cancellationReason,
        Integer rating,
        String review,
        BigDecimal hourlyRate,
        String location,
        String notes,
        String service_name,
        String pet_name,
        String customer_name,
        String caretaker_name,
        String customerEmail,
        String customerPhone,
        String caretakerEmail,
        String caretakerPhone,
        String customerPhotoUrl,
        String caretakerPhotoUrl,
        String petPhotoUrl,
        String petSpecies,
        String petBreed,
        BigDecimal petAgeYears,
        String petNotes,
        String petFoodNotes) {}
