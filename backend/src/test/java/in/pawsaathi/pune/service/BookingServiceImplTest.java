package in.pawsaathi.pune.service;
import com.fasterxml.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import in.pawsaathi.pune.entity.AppUser;
import in.pawsaathi.pune.entity.Booking;
import in.pawsaathi.pune.entity.BookingStatus;
import in.pawsaathi.pune.entity.BookingStatusHistory;
import in.pawsaathi.pune.entity.Payment;
import in.pawsaathi.pune.entity.PaymentStatus;
import in.pawsaathi.pune.entity.Review;
import in.pawsaathi.pune.exception.BadRequestException;
import in.pawsaathi.pune.mapper.ResponseMapper;
import in.pawsaathi.pune.model.BookingResponse;
import in.pawsaathi.pune.repository.AuditLogRepository;
import in.pawsaathi.pune.repository.BookingIdempotencyRepository;
import in.pawsaathi.pune.repository.BookingRepository;
import in.pawsaathi.pune.repository.BookingStatusHistoryRepository;
import in.pawsaathi.pune.repository.CaretakerAvailabilityRepository;
import in.pawsaathi.pune.repository.CaretakerProfileRepository;
import in.pawsaathi.pune.repository.NotificationRepository;
import in.pawsaathi.pune.repository.PaymentRepository;
import in.pawsaathi.pune.repository.PetRepository;
import in.pawsaathi.pune.repository.ReviewRepository;
import in.pawsaathi.pune.repository.ServiceCatalogRepository;
import in.pawsaathi.pune.repository.UserRepository;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

class BookingServiceImplTest {

    @Test
    void customerBookingsIncludePaymentStatusAndOmitItForCancelledBookings() {
        BookingRepository bookings = mock(BookingRepository.class);
        PaymentRepository payments = mock(PaymentRepository.class);
        ReviewRepository reviews = mock(ReviewRepository.class);
        ResponseMapper responseMapper = mock(ResponseMapper.class);
        BookingServiceImpl service = service(bookings, payments, responseMapper, reviews);
        Booking paid = booking(11L, BookingStatus.CONFIRMED);
        Booking cancelled = booking(12L, BookingStatus.CANCELLED);
        Booking awaitingPayment = booking(13L, BookingStatus.PENDING_PAYMENT);
        Payment payment = mock(Payment.class);
        BookingResponse paidResponse = mock(BookingResponse.class);
        BookingResponse cancelledResponse = mock(BookingResponse.class);
        BookingResponse awaitingPaymentResponse = mock(BookingResponse.class);

        when(bookings.findByCustomerIdOrderByStartsAtDesc(3L))
                .thenReturn(List.of(paid, cancelled, awaitingPayment));
        when(payments.findByBookingIdIn(List.of(11L, 12L, 13L))).thenReturn(List.of(payment));
        when(payment.getBooking()).thenReturn(paid);
        when(payment.getStatus()).thenReturn(PaymentStatus.SUCCEEDED);
        when(reviews.findByBookingIdIn(List.of(11L, 12L, 13L))).thenReturn(List.of());
        when(responseMapper.toResponse(paid, PaymentStatus.SUCCEEDED, null)).thenReturn(paidResponse);
        when(responseMapper.toResponse(cancelled, null, null)).thenReturn(cancelledResponse);
        when(responseMapper.toResponse(awaitingPayment, PaymentStatus.PENDING, null))
                .thenReturn(awaitingPaymentResponse);

        var responses = service.list(3L, "CUSTOMER");

        assertEquals(
                List.of(paidResponse, cancelledResponse, awaitingPaymentResponse), responses);
        verify(payments).findByBookingIdIn(List.of(11L, 12L, 13L));
        verify(responseMapper).toResponse(paid, PaymentStatus.SUCCEEDED, null);
        verify(responseMapper).toResponse(cancelled, null, null);
        verify(responseMapper).toResponse(awaitingPayment, PaymentStatus.PENDING, null);
    }

    @Test
    void cancellationRequiresAReason() {
        BookingRepository bookings = mock(BookingRepository.class);
        UserRepository users = mock(UserRepository.class);
        BookingTransitionPolicy transitionPolicy = mock(BookingTransitionPolicy.class);
        PaymentRepository payments = mock(PaymentRepository.class);
        BookingServiceImpl service =
                service(bookings, payments, mock(ResponseMapper.class), users, transitionPolicy, mock(BookingStatusHistoryRepository.class), mock(ReviewRepository.class));
        AppUser actor = mock(AppUser.class);
        AppUser customer = mock(AppUser.class);
        AppUser caretaker = mock(AppUser.class);
        Booking booking = mock(Booking.class);
        cancellationContext(
                bookings, users, transitionPolicy, payments, actor, customer, caretaker, booking);

        assertThrows(
                BadRequestException.class,
                () -> service.changeStatus(10L, "CUSTOMER", 21L, BookingStatus.CANCELLED, " "));
        verify(booking, never()).transitionTo(any(BookingStatus.class), anyString());
    }

    @Test
    void cancellationStoresTheTrimmedReason() {
        BookingRepository bookings = mock(BookingRepository.class);
        UserRepository users = mock(UserRepository.class);
        BookingTransitionPolicy transitionPolicy = mock(BookingTransitionPolicy.class);
        PaymentRepository payments = mock(PaymentRepository.class);
        BookingStatusHistoryRepository history = mock(BookingStatusHistoryRepository.class);
        ResponseMapper responseMapper = mock(ResponseMapper.class);
        BookingServiceImpl service =
                service(bookings, payments, responseMapper, users, transitionPolicy, history, mock(ReviewRepository.class));
        AppUser actor = mock(AppUser.class);
        AppUser customer = mock(AppUser.class);
        AppUser caretaker = mock(AppUser.class);
        Booking booking = mock(Booking.class);
        BookingResponse response = mock(BookingResponse.class);
        AtomicReference<BookingStatus> currentStatus = new AtomicReference<>();

        cancellationContext(
                bookings, users, transitionPolicy, payments, actor, customer, caretaker, booking);
        currentStatus.set(BookingStatus.PENDING_PAYMENT);
        when(booking.getStatus()).thenAnswer(invocation -> currentStatus.get());
        doAnswer(
                        invocation -> {
                            currentStatus.set(invocation.getArgument(0));
                            return null;
                        })
                .when(booking)
                .transitionTo(any(BookingStatus.class), anyString());
        when(responseMapper.toResponse(any(), any())).thenReturn(response);

        BookingResponse result =
                service.changeStatus(
                        10L, "CUSTOMER", 21L, BookingStatus.CANCELLED, "  Plans changed  ");

        assertSame(response, result);
        verify(booking).transitionTo(BookingStatus.CANCELLED, "Plans changed");
        verify(history).save(any(BookingStatusHistory.class));
    }

    @Test
    void completedBookingsIncludeRatingAndReview() {
        BookingRepository bookings = mock(BookingRepository.class);
        PaymentRepository payments = mock(PaymentRepository.class);
        ReviewRepository reviews = mock(ReviewRepository.class);
        ResponseMapper responseMapper = mock(ResponseMapper.class);
        BookingServiceImpl service = service(bookings, payments, responseMapper, reviews);
        Booking completed = mock(Booking.class);
        Review review = mock(Review.class);
        BookingResponse response = mock(BookingResponse.class);

        when(bookings.findByCustomerIdOrderByStartsAtDesc(3L)).thenReturn(List.of(completed));
        when(payments.findByBookingIdIn(List.of(14L))).thenReturn(List.of());
        when(completed.getId()).thenReturn(14L);
        when(completed.getStatus()).thenReturn(BookingStatus.COMPLETED);
        when(reviews.findByBookingIdIn(List.of(14L))).thenReturn(List.of(review));
        when(review.getBooking()).thenReturn(completed);
        when(review.getRating()).thenReturn(5);
        when(review.getComment()).thenReturn("Excellent care");
        when(responseMapper.toResponse(any(), any(), any())).thenReturn(response);

        var responses = service.list(3L, "CUSTOMER");

        assertEquals(List.of(response), responses);
        verify(reviews).findByBookingIdIn(List.of(14L));
        verify(responseMapper).toResponse(completed, PaymentStatus.PENDING, review);
    }

    private void cancellationContext(
            BookingRepository bookings,
            UserRepository users,
            BookingTransitionPolicy transitionPolicy,
            PaymentRepository payments,
            AppUser actor,
            AppUser customer,
            AppUser caretaker,
            Booking booking) {
        when(users.findById(10L)).thenReturn(java.util.Optional.of(actor));
        when(bookings.findLockedById(21L)).thenReturn(java.util.Optional.of(booking));
        when(booking.getStatus()).thenReturn(BookingStatus.PENDING_PAYMENT);
        when(booking.getCustomer()).thenReturn(customer);
        when(booking.getCaretaker()).thenReturn(caretaker);
        when(actor.getId()).thenReturn(10L);
        when(customer.getId()).thenReturn(10L);
        when(caretaker.getId()).thenReturn(20L);
        when(transitionPolicy.allows(
                        10L,
                        10L,
                        20L,
                        "CUSTOMER",
                        BookingStatus.PENDING_PAYMENT,
                        BookingStatus.CANCELLED))
                .thenReturn(true);
        when(payments.existsByBookingIdAndStatus(21L, PaymentStatus.SUCCEEDED)).thenReturn(false);
    }

    private BookingServiceImpl service(
            BookingRepository bookings,
            PaymentRepository payments,
            ResponseMapper responseMapper) {
        return service(
                bookings,
                payments,
                responseMapper,
                mock(UserRepository.class),
                mock(BookingTransitionPolicy.class),
                mock(BookingStatusHistoryRepository.class),
                mock(ReviewRepository.class));
    }

    private BookingServiceImpl service(
            BookingRepository bookings,
            PaymentRepository payments,
            ResponseMapper responseMapper,
            ReviewRepository reviews) {
        return service(
                bookings,
                payments,
                responseMapper,
                mock(UserRepository.class),
                mock(BookingTransitionPolicy.class),
                mock(BookingStatusHistoryRepository.class),
                reviews);
    }

    private BookingServiceImpl service(
            BookingRepository bookings,
            PaymentRepository payments,
            ResponseMapper responseMapper,
            UserRepository users,
            BookingTransitionPolicy transitionPolicy,
            BookingStatusHistoryRepository history,
            ReviewRepository reviews) {
        return new BookingServiceImpl(
                bookings,
                history,
                users,
                mock(PetRepository.class),
                mock(ServiceCatalogRepository.class),
                mock(CaretakerProfileRepository.class),
                mock(CaretakerAvailabilityRepository.class),
                payments,
                reviews,
                mock(NotificationRepository.class),
                mock(AuditLogRepository.class),
                responseMapper,
                transitionPolicy,
                mock(BookingIdempotencyRepository.class),
                mock(ObjectMapper.class));
    }

    private Booking booking(long id, BookingStatus status) {
        Booking booking = mock(Booking.class);
        when(booking.getId()).thenReturn(id);
        when(booking.getStatus()).thenReturn(status);
        return booking;
    }
}
