package in.pawsaathi.pune.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSupportTicketRequest(
        @NotBlank @Size(max = 180) String subject,
        @NotBlank @Size(max = 5000) String description,
        Long bookingId) {}
