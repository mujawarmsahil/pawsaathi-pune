package in.pawsaathi.pune.model;

import java.math.BigDecimal;

public record CaretakerSummaryResponse(
        long id,
        String name,
        String bio,
        BigDecimal experienceYears,
        BigDecimal hourlyRate,
        String serviceAreas,
        String photoUrl,
        String languages,
        long reviewCount,
        BigDecimal rating) {}
