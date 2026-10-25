package in.pawsaathi.pune.model;

import in.pawsaathi.pune.entity.BookingStatus;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record BookingStatusRequest(@NotNull BookingStatus status, @Size(max = 500) String reason) {}
