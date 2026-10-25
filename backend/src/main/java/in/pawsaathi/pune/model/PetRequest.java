package in.pawsaathi.pune.model;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record PetRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 40) String species,
        @Size(max = 80) String breed,
        @DecimalMin("0.0") @DecimalMax("40.0") BigDecimal ageYears,
        @Size(max = 2000) String notes,
        @Size(max = 1000) String foodNotes,
        @Size(max = 3_000_000) String photoUrl) {}
