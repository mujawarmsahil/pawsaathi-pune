package in.pawsaathi.pune.model;

import in.pawsaathi.pune.entity.BookingStatus;

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
        BigDecimal hourlyRate,
        String location,
        String notes,
        String service_name,
        String pet_name,
        String customer_name,
        String caretaker_name) {}
