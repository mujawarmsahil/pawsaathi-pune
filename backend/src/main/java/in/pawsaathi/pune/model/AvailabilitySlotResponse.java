package in.pawsaathi.pune.model;

import java.time.LocalTime;

public record AvailabilitySlotResponse(
        long id, int weekday, LocalTime startsAt, LocalTime endsAt) {}
