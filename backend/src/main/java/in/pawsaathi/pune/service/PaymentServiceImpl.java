package in.pawsaathi.pune.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import in.pawsaathi.pune.exception.ConflictException;
import in.pawsaathi.pune.exception.NotFoundException;
import in.pawsaathi.pune.exception.PaymentException;
import in.pawsaathi.pune.model.PaymentOrderResponse;
import in.pawsaathi.pune.model.VerifyPaymentRequest;
import in.pawsaathi.pune.entity.AuditLog;
import in.pawsaathi.pune.entity.Booking;
import in.pawsaathi.pune.entity.BookingStatus;
import in.pawsaathi.pune.entity.BookingStatusHistory;
import in.pawsaathi.pune.entity.Notification;
import in.pawsaathi.pune.entity.Payment;
import in.pawsaathi.pune.entity.PaymentStatus;
import in.pawsaathi.pune.repository.AuditLogRepository;
import in.pawsaathi.pune.repository.BookingRepository;
import in.pawsaathi.pune.repository.BookingStatusHistoryRepository;
import in.pawsaathi.pune.repository.NotificationRepository;
import in.pawsaathi.pune.repository.PaymentRepository;
import in.pawsaathi.pune.repository.PaymentWebhookEventRepository;
import in.pawsaathi.pune.repository.UserRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@Service
public class PaymentServiceImpl implements PaymentService {
    private final BookingRepository bookings;
    private final BookingStatusHistoryRepository history;
    private final PaymentRepository payments;
    private final PaymentWebhookEventRepository webhookEvents;
    private final UserRepository users;
    private final NotificationRepository notifications;
    private final AuditLogRepository auditLogs;
    private final ObjectMapper mapper;
    private final RestClient http;
    private final String keyId;
    private final String keySecret;
    private final String webhookSecret;

    public PaymentServiceImpl(
            BookingRepository bookings,
            BookingStatusHistoryRepository history,
            PaymentRepository payments,
            PaymentWebhookEventRepository webhookEvents,
            UserRepository users,
            NotificationRepository notifications,
            AuditLogRepository auditLogs,
            ObjectMapper mapper,
            @Value("${app.razorpay.key-id:}") String keyId,
            @Value("${app.razorpay.key-secret:}") String keySecret,
            @Value("${app.razorpay.webhook-secret:}") String webhookSecret) {
        this.bookings = bookings;
        this.history = history;
        this.payments = payments;
        this.webhookEvents = webhookEvents;
        this.users = users;
        this.notifications = notifications;
        this.auditLogs = auditLogs;
        this.mapper = mapper;
        this.keyId = keyId;
        this.keySecret = keySecret;
        this.webhookSecret = webhookSecret;
        this.http = RestClient.builder().baseUrl("https://api.razorpay.com/v1").build();
    }

    @Override
    @Transactional
    public PaymentOrderResponse createOrder(long customerId, long bookingId) {
        requireConfiguration(keyId, keySecret);
        Booking booking =
                bookings.findLockedById(bookingId)
                        .filter(candidate -> candidate.getCustomer().getId().equals(customerId))
                        .orElseThrow(() -> new NotFoundException("Booking not found."));
        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT
                && booking.getStatus() != BookingStatus.PAYMENT_FAILED) {
            throw new ConflictException("This booking is not awaiting payment.");
        }
        long minutes =
                java.time.Duration.between(booking.getStartsAt(), booking.getEndsAt()).toMinutes();
        BigDecimal amount =
                booking.getHourlyRate()
                        .multiply(BigDecimal.valueOf(minutes))
                        .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
        long amountPaise = amount.movePointRight(2).longValueExact();

        JsonNode order;
        try {
            order =
                    http.post()
                            .uri("/orders")
                            .headers(headers -> headers.setBasicAuth(keyId, keySecret))
                            .body(
                                    Map.of(
                                            "amount",
                                            amountPaise,
                                            "currency",
                                            "INR",
                                            "receipt",
                                            "pawsaathi-booking-" + bookingId,
                                            "notes",
                                            Map.of("booking_id", Long.toString(bookingId))))
                            .retrieve()
                            .body(JsonNode.class);
        } catch (Exception exception) {
            throw new PaymentException(
                    "Payment provider could not create an order. Please try again.", exception);
        }
        if (order == null
                || !order.path("id").isTextual()
                || order.path("amount").asLong(-1) != amountPaise
                || !"INR".equals(order.path("currency").asText())) {
            throw new PaymentException("Payment provider returned an invalid order.");
        }

        Payment payment =
                payments.findLockedByBookingId(bookingId)
                        .orElseGet(() -> new Payment(booking, amount));
        if (payment.getStatus() == PaymentStatus.SUCCEEDED) {
            throw new ConflictException("This booking has already been paid.");
        }
        payment.attachOrder(order.path("id").asText());
        payments.save(payment);
        if (booking.getStatus() == BookingStatus.PAYMENT_FAILED) {
            booking.transitionTo(BookingStatus.PENDING_PAYMENT);
            history.save(
                    new BookingStatusHistory(
                            booking,
                            BookingStatus.PAYMENT_FAILED,
                            BookingStatus.PENDING_PAYMENT,
                            booking.getCustomer(),
                            "Payment retry started"));
        }
        return new PaymentOrderResponse(keyId, payment.getProviderOrderId(), amountPaise, "INR");
    }

    @Override
    @Transactional
    public long verify(long customerId, VerifyPaymentRequest request) {
        requireConfiguration(keySecret);
        Booking booking =
                bookings.findLockedById(request.bookingId())
                        .filter(candidate -> candidate.getCustomer().getId().equals(customerId))
                        .orElseThrow(() -> new NotFoundException("Booking not found."));
        Payment payment =
                payments.findLockedByBookingId(request.bookingId())
                        .orElseThrow(() -> new NotFoundException("Payment order not found."));
        if (!request.razorpayOrderId().equals(payment.getProviderOrderId())) {
            throw new PaymentException("Payment order does not match this booking.");
        }
        String expected =
                hmac(keySecret, request.razorpayOrderId() + "|" + request.razorpayPaymentId());
        if (!constantTime(expected, request.razorpaySignature())) {
            throw new PaymentException("Payment signature could not be verified.");
        }
        if (payment.getStatus() == PaymentStatus.SUCCEEDED) {
            if (!request.razorpayPaymentId().equals(payment.getProviderPaymentId())) {
                throw new ConflictException(
                        "A different payment has already completed for this booking.");
            }
            return booking.getId();
        }
        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new ConflictException("This booking is no longer awaiting payment.");
        }
        confirmPayment(booking, payment, request.razorpayPaymentId());
        return booking.getId();
    }

    @Override
    @Transactional
    public boolean receiveWebhook(String eventId, String signature, String rawBody) {
        requireConfiguration(webhookSecret);
        if (eventId == null || eventId.isBlank() || eventId.length() > 160) {
            throw new PaymentException("Webhook event ID is missing or invalid.");
        }
        if (signature == null || !constantTime(hmac(webhookSecret, rawBody), signature)) {
            throw new PaymentException("Webhook signature is invalid.", HttpStatus.UNAUTHORIZED);
        }
        JsonNode event;
        try {
            event = mapper.readTree(rawBody);
        } catch (Exception exception) {
            throw new PaymentException("Webhook body is invalid.", exception);
        }
        String eventType = event.path("event").asText("");
        int inserted = webhookEvents.insertIfNew(eventId, eventType);
        if (inserted == 0) return false;
        if (!"payment.captured".equals(eventType)) return true;

        JsonNode entity = event.path("payload").path("payment").path("entity");
        String orderId = entity.path("order_id").asText("");
        String paymentId = entity.path("id").asText("");
        long paidPaise = entity.path("amount").asLong(-1);
        if (orderId.isBlank() || paymentId.isBlank() || paidPaise < 0) {
            throw new PaymentException("Captured payment details are incomplete.");
        }
        Payment payment =
                payments.findByProviderOrderId(orderId)
                        .map(
                                found ->
                                        payments.findLockedByBookingId(found.getBooking().getId())
                                                .orElse(found))
                        .orElse(null);
        if (payment == null) return true;
        long expectedPaise = payment.getAmount().movePointRight(2).longValueExact();
        if (paidPaise != expectedPaise) {
            throw new PaymentException("Captured payment amount does not match the booking.");
        }
        Booking booking =
                bookings.findLockedById(payment.getBooking().getId())
                        .orElseThrow(() -> new NotFoundException("Booking not found."));
        if (payment.getStatus() == PaymentStatus.SUCCEEDED) {
            if (!paymentId.equals(payment.getProviderPaymentId())) {
                throw new ConflictException(
                        "A different payment has already completed for this booking.");
            }
            return true;
        }
        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new ConflictException("Booking is not awaiting payment.");
        }
        confirmPayment(booking, payment, paymentId);
        return true;
    }

    private void confirmPayment(Booking booking, Payment payment, String paymentId) {
        payment.markSucceeded(paymentId);
        booking.transitionTo(BookingStatus.CONFIRMED);
        history.save(
                new BookingStatusHistory(
                        booking,
                        BookingStatus.PENDING_PAYMENT,
                        BookingStatus.CONFIRMED,
                        booking.getCustomer(),
                        "Payment verified"));
        notifications.save(
                new Notification(
                        booking.getCustomer(),
                        "Payment confirmed",
                        "Your booking #" + booking.getId() + " is confirmed.",
                        "PAYMENT"));
        notifications.save(
                new Notification(
                        booking.getCaretaker(),
                        "Booking confirmed",
                        "Booking #" + booking.getId() + " is ready for your response.",
                        "BOOKING"));
        auditLogs.save(
                new AuditLog(
                        booking.getCustomer(), "PAYMENT_CONFIRMED", "BOOKING", booking.getId()));
    }

    private void requireConfiguration(String... values) {
        for (String value : values) {
            if (value == null || value.isBlank()) {
                throw new PaymentException("Online payment service is not configured.");
            }
        }
    }

    private static String hmac(String secret, String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to verify payment signature.", exception);
        }
    }

    private static boolean constantTime(String expected, String actual) {
        return actual != null
                && MessageDigest.isEqual(
                        expected.getBytes(StandardCharsets.UTF_8),
                        actual.getBytes(StandardCharsets.UTF_8));
    }
}
