package in.pawsaathi.pune.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ModerateReviewRequest(
        @NotBlank @Pattern(regexp = "APPROVED|REJECTED") String status) {}
