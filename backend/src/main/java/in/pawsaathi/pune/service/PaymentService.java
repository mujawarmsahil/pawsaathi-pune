package in.pawsaathi.pune.service;

import in.pawsaathi.pune.model.PaymentOrderResponse;
import in.pawsaathi.pune.model.VerifyPaymentRequest;

public interface PaymentService {
    PaymentOrderResponse createOrder(long customerId, long bookingId);

    long verify(long customerId, VerifyPaymentRequest request);

    boolean receiveWebhook(String eventId, String signature, String rawBody);
}
