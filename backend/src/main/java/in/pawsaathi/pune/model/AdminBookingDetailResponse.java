package in.pawsaathi.pune.model;

import in.pawsaathi.pune.entity.BookingStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

public record AdminBookingDetailResponse(
        long id,
        BookingStatus status,
        LocalDateTime startsAt,
        LocalDateTime endsAt,
        long durationMinutes,
        BigDecimal hourlyRate,
        BigDecimal totalAmount,
        String location,
        String notes,
        Instant createdAt,
        String serviceName,
        String serviceDescription,
        CustomerDetails customer,
        CaretakerDetails caretaker,
        PetDetails pet,
        PaymentDetails payment) {

    public record CustomerDetails(long id, String name, String email, String phone) {}

    public record CaretakerDetails(long id, String name, String email, String phone) {}

    public record PetDetails(
            long id,
            String name,
            String species,
            String breed,
            BigDecimal ageYears,
            String notes,
            String photoUrl) {}

    public record PaymentDetails(String status, BigDecimal amount, String currency) {}
}
