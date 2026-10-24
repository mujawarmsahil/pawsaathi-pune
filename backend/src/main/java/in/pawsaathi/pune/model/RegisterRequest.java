package in.pawsaathi.pune.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(min = 2, max = 120) String name,
        @Email @NotBlank @Size(max = 180) String email,
        @Size(max = 20) String phone,
        @NotBlank @Size(min = 12, max = 72) String password,
        @NotBlank String role) {}
