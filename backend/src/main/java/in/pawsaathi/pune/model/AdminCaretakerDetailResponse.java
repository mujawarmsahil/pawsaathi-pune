package in.pawsaathi.pune.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record AdminCaretakerDetailResponse(
        long id,
        String name,
        String email,
        String phone,
        String photoUrl,
        String bio,
        BigDecimal experienceYears,
        BigDecimal hourlyRate,
        String serviceAreas,
        String languages,
        String approvalStatus,
        boolean verified,
        Instant registeredAt,
        Instant updatedAt,
        BigDecimal rating,
        long reviewCount,
        List<CaretakerServiceResponse> services,
        List<CaretakerAreaResponse> areas,
        List<ReviewResponse> reviews) {}
