package in.pawsaathi.pune.controller;

import in.pawsaathi.pune.model.CreatePaymentOrderRequest;
import in.pawsaathi.pune.model.PaymentOrderResponse;
import in.pawsaathi.pune.model.VerifyPaymentRequest;
import in.pawsaathi.pune.security.CurrentUserProvider;
import in.pawsaathi.pune.service.PaymentService;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService payments;
    private final CurrentUserProvider currentUser;

    public PaymentController(PaymentService payments, CurrentUserProvider currentUser) {
        this.payments = payments;
        this.currentUser = currentUser;
    }

    @PostMapping("/orders")
    @PreAuthorize("hasRole('CUSTOMER')")
    public PaymentOrderResponse createOrder(@Valid @RequestBody CreatePaymentOrderRequest request) {
        return payments.createOrder(currentUser.require().id(), request.bookingId());
    }

    @PostMapping("/verify")
    @PreAuthorize("hasRole('CUSTOMER')")
    public Map<String, Object> verify(@Valid @RequestBody VerifyPaymentRequest request) {
        long bookingId = payments.verify(currentUser.require().id(), request);
        return Map.of("status", "SUCCEEDED", "bookingId", bookingId);
    }

    @PostMapping("/webhook")
    public Map<String, Boolean> webhook(
            @RequestHeader("X-Razorpay-Signature") String signature,
            @RequestHeader("X-Razorpay-Event-Id") String eventId,
            @RequestBody String rawBody) {
        boolean inserted = payments.receiveWebhook(eventId, signature, rawBody);
        return Map.of("received", true, "processed", inserted);
    }
}
