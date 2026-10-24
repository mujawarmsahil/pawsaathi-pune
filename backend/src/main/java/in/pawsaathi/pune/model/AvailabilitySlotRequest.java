package in.pawsaathi.pune.model;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public record AvailabilitySlotRequest(
        @Min(0) @Max(6) int weekday, @NotNull LocalTime startsAt, @NotNull LocalTime endsAt) {}
