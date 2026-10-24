package in.pawsaathi.pune.model;

import java.math.BigDecimal;

public record PetResponse(
        Long id,
        String name,
        String species,
        String breed,
        BigDecimal ageYears,
        String notes,
        String photoUrl) {}
