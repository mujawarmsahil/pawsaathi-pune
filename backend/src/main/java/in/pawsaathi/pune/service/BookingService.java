package in.pawsaathi.pune.service;

import in.pawsaathi.pune.model.BookingRequest;
import in.pawsaathi.pune.model.BookingResponse;
import in.pawsaathi.pune.entity.BookingStatus;

import java.util.List;

public interface BookingService {
    List<BookingResponse> list(long currentUserId, String role);

    BookingResponse create(long customerId, BookingRequest request, String idempotencyKey);

    BookingResponse changeStatus(
            long currentUserId, String role, long bookingId, BookingStatus nextStatus);
}
