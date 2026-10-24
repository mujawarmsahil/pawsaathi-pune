package in.pawsaathi.pune.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record BookingRequest(
        @NotNull Long caretakerId,
        @NotNull Long petId,
        @NotNull Long serviceId,
        @NotNull LocalDateTime startsAt,
        @NotNull LocalDateTime endsAt,
        @NotBlank @Size(max = 250) String location,
        @Size(max = 2000) String notes) {}
