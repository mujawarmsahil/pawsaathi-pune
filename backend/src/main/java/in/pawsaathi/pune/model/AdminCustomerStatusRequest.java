package in.pawsaathi.pune.model;

import jakarta.validation.constraints.NotBlank;

public record AdminCustomerStatusRequest(@NotBlank String status) {}
