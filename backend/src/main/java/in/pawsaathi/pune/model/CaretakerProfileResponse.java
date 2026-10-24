package in.pawsaathi.pune.model;

import java.math.BigDecimal;

public record CaretakerProfileResponse(
        long id,
        long userId,
        String bio,
        BigDecimal experienceYears,
        BigDecimal hourlyRate,
        String serviceAreas,
        String photoUrl,
        String languages,
        String serviceTypes,
        String approvalStatus,
        boolean verified) {}
