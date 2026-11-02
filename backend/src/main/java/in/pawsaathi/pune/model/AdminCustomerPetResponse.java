package in.pawsaathi.pune.model;

import java.math.BigDecimal;
public record AdminCustomerPetResponse(
        long id,
        String name,
        String species,
        String breed,
        BigDecimal ageYears,
        String notes,
        String foodNotes,
        String photoUrl) {}
