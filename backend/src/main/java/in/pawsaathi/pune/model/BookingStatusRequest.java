package in.pawsaathi.pune.model;

import in.pawsaathi.pune.entity.BookingStatus;

import jakarta.validation.constraints.NotNull;

public record BookingStatusRequest(@NotNull BookingStatus status) {}
