package in.pawsaathi.pune.entity;

public enum BookingStatus {
    REQUESTED,
    ACCEPTED,
    PENDING_PAYMENT,
    CONFIRMED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED,
    REJECTED,
    PAYMENT_FAILED,
    REFUNDED,
    PENDING;

    public boolean requiresPayment() {
        return this != CANCELLED && this != REJECTED && this != REFUNDED;
    }
}
