package in.pawsaathi.pune.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record VerifyPaymentRequest(
        @NotNull @Positive Long bookingId,
        @NotBlank @Size(max = 160) String razorpayOrderId,
        @NotBlank @Size(max = 160) String razorpayPaymentId,
        @NotBlank @Size(max = 256) String razorpaySignature) {}
