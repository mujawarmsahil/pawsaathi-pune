package in.pawsaathi.pune.model;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CaretakerProfileRequest(
        @Size(max = 2000) String bio,
        @DecimalMin("0") @DecimalMax("70") BigDecimal experienceYears,
        @NotNull @DecimalMin("100") @DecimalMax("10000") BigDecimal hourlyRate,
        @NotBlank @Size(max = 500) String serviceAreas,
        @Size(max = 250) String languages,
        @Size(max = 500) String serviceTypes) {}
