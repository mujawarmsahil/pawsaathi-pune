package in.pawsaathi.pune.model;

import jakarta.validation.constraints.NotBlank;

public record AdminDecisionRequest(@NotBlank String status) {}
