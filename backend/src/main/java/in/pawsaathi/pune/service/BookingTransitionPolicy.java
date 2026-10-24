package in.pawsaathi.pune.service;

import in.pawsaathi.pune.entity.BookingStatus;

import org.springframework.stereotype.Component;

@Component
public class BookingTransitionPolicy {
    public boolean allows(
            long actorId,
            long customerId,
            long caretakerId,
            String role,
            BookingStatus current,
            BookingStatus next) {
        if ("ADMIN".equals(role)) {
            return next == BookingStatus.CANCELLED
                    && current != BookingStatus.COMPLETED
                    && current != BookingStatus.CANCELLED
                    && current != BookingStatus.REJECTED
                    && current != BookingStatus.REFUNDED;
        }
        if ("CUSTOMER".equals(role) && actorId == customerId) {
            return next == BookingStatus.CANCELLED
                    && (current == BookingStatus.PENDING_PAYMENT
                            || current == BookingStatus.CONFIRMED);
        }
        if ("CARETAKER".equals(role) && actorId == caretakerId) {
            return current == BookingStatus.CONFIRMED
                            && (next == BookingStatus.ACCEPTED || next == BookingStatus.REJECTED)
                    || current == BookingStatus.ACCEPTED
                            && (next == BookingStatus.IN_PROGRESS
                                    || next == BookingStatus.CANCELLED)
                    || current == BookingStatus.IN_PROGRESS && next == BookingStatus.COMPLETED;
        }
        return false;
    }
}
