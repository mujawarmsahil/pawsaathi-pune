package in.pawsaathi.pune.service;

import static org.junit.jupiter.api.Assertions.*;

import in.pawsaathi.pune.entity.BookingStatus;

import org.junit.jupiter.api.Test;

class BookingTransitionPolicyTest {
    private final BookingTransitionPolicy policy = new BookingTransitionPolicy();

    @Test
    void onlyTheBookingCaretakerCanProgressTheBookingLifecycle() {
        assertTrue(
                policy.allows(
                        20, 10, 20, "CARETAKER", BookingStatus.CONFIRMED, BookingStatus.ACCEPTED));
        assertTrue(
                policy.allows(
                        20,
                        10,
                        20,
                        "CARETAKER",
                        BookingStatus.ACCEPTED,
                        BookingStatus.IN_PROGRESS));
        assertTrue(
                policy.allows(
                        20,
                        10,
                        20,
                        "CARETAKER",
                        BookingStatus.IN_PROGRESS,
                        BookingStatus.COMPLETED));
        assertFalse(
                policy.allows(
                        21, 10, 20, "CARETAKER", BookingStatus.CONFIRMED, BookingStatus.ACCEPTED));
    }

    @Test
    void customersCannotChangeCaretakerStateOrCancelCompletedBookings() {
        assertTrue(
                policy.allows(
                        10,
                        10,
                        20,
                        "CUSTOMER",
                        BookingStatus.PENDING_PAYMENT,
                        BookingStatus.CANCELLED));
        assertFalse(
                policy.allows(
                        10, 10, 20, "CUSTOMER", BookingStatus.COMPLETED, BookingStatus.CANCELLED));
        assertFalse(
                policy.allows(
                        10, 10, 20, "CUSTOMER", BookingStatus.CONFIRMED, BookingStatus.ACCEPTED));
    }
}
