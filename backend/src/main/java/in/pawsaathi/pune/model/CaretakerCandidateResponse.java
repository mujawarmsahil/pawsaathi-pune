package in.pawsaathi.pune.model;

import java.math.BigDecimal;

public record CaretakerCandidateResponse(
        long id,
        String name,
        String email,
        String photoUrl,
        BigDecimal hourlyRate,
        String serviceAreas,
        String approvalStatus,
        boolean verified) {}
