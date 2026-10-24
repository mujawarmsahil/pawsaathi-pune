package in.pawsaathi.pune.model;

import java.math.BigDecimal;
import java.util.List;

public record CaretakerDetailResponse(
        long id,
        String name,
        String bio,
        BigDecimal experienceYears,
        BigDecimal hourlyRate,
        String serviceAreas,
        String photoUrl,
        String languages,
        List<CaretakerServiceResponse> services,
        List<CaretakerAreaResponse> areas,
        BigDecimal rating,
        long reviewCount) {}
