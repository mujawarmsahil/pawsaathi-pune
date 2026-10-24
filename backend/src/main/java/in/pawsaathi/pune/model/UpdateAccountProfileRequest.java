package in.pawsaathi.pune.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateAccountProfileRequest(
        @NotBlank @Size(min = 2, max = 120) String name,
        @Email @NotBlank @Size(max = 180) String email,
        @Size(max = 30)
                @Pattern(
                        regexp = "^\\s*$|^[0-9+()\\-\\s]{7,30}$",
                        message = "Enter a valid phone number.")
                String phone,
        @Size(max = 3_000_000) String photoUrl) {}
