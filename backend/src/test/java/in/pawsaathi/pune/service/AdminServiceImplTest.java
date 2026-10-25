package in.pawsaathi.pune.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import in.pawsaathi.pune.entity.AppUser;
import in.pawsaathi.pune.entity.Booking;
import in.pawsaathi.pune.entity.BookingStatus;
import in.pawsaathi.pune.entity.CaretakerProfile;
import in.pawsaathi.pune.entity.Payment;
import in.pawsaathi.pune.entity.PaymentStatus;
import in.pawsaathi.pune.entity.Pet;
import in.pawsaathi.pune.entity.Review;
import in.pawsaathi.pune.entity.ServiceCatalogItem;
import in.pawsaathi.pune.entity.SupportTicketStatus;
import in.pawsaathi.pune.exception.BadRequestException;
import in.pawsaathi.pune.repository.AdminActionRepository;
import in.pawsaathi.pune.repository.AuditLogRepository;
import in.pawsaathi.pune.repository.BookingRepository;
import in.pawsaathi.pune.repository.CaretakerProfileRepository;
import in.pawsaathi.pune.repository.CaretakerQueryRepository;
import in.pawsaathi.pune.repository.PaymentRepository;
import in.pawsaathi.pune.repository.RefreshTokenRepository;
import in.pawsaathi.pune.repository.ReviewRepository;
import in.pawsaathi.pune.repository.SupportTicketRepository;
import in.pawsaathi.pune.repository.UserRepository;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

class AdminServiceImplTest {

    @Test
    void overviewCountsOnlyApprovedCaretakers() {
        UserRepository users = mock(UserRepository.class);
        CaretakerProfileRepository profiles = mock(CaretakerProfileRepository.class);
        BookingRepository bookings = mock(BookingRepository.class);
        SupportTicketRepository tickets = mock(SupportTicketRepository.class);
        AdminServiceImpl service =
                new AdminServiceImpl(
                        users,
                        profiles,
                        mock(CaretakerQueryRepository.class),
                        bookings,
                        mock(PaymentRepository.class),
                        mock(ReviewRepository.class),
                        tickets,
                        mock(AdminActionRepository.class),
                        mock(AuditLogRepository.class),
                        mock(RefreshTokenRepository.class));

        when(users.countByRoleName("CUSTOMER")).thenReturn(5L);
        when(profiles.countByApprovalStatus("APPROVED")).thenReturn(3L);
        when(profiles.countByApprovalStatus("PENDING")).thenReturn(2L);
        when(bookings.count()).thenReturn(8L);
        when(tickets.countByStatus(SupportTicketStatus.OPEN)).thenReturn(1L);

        var overview = service.overview();

        assertEquals(3L, overview.caretakers());
        assertEquals(2L, overview.pendingCaretakers());
        verify(profiles).countByApprovalStatus("APPROVED");
        verify(profiles, never()).count();
    }

    @Test
    void caretakerBookingsIncludeDurationAndTotal() {
        CaretakerProfileRepository profiles = mock(CaretakerProfileRepository.class);
        BookingRepository bookings = mock(BookingRepository.class);
        AdminServiceImpl service = service(profiles, bookings, mock(PaymentRepository.class), mock(ReviewRepository.class));
        Booking booking = booking();
        CaretakerProfile profile = mock(CaretakerProfile.class);

        when(profile.getApprovalStatus()).thenReturn("APPROVED");
        when(profiles.findByUserId(5L)).thenReturn(Optional.of(profile));
        when(bookings.findByCaretakerIdOrderByStartsAtDesc(5L)).thenReturn(List.of(booking));

        var summaries = service.caretakerBookings(5L);

        assertEquals(1, summaries.size());
        assertEquals(120L, summaries.getFirst().durationMinutes());
        assertEquals(new BigDecimal("1000.00"), summaries.getFirst().totalAmount());
        assertEquals("Bruno", summaries.getFirst().petName());
        assertEquals("Riya Deshmukh", summaries.getFirst().customerName());
    }

    @Test
    void bookingsIncludeOwnerAndCaretakerContactDetails() {
        BookingRepository bookings = mock(BookingRepository.class);
        AdminServiceImpl service =
                service(mock(CaretakerProfileRepository.class), bookings, mock(PaymentRepository.class), mock(ReviewRepository.class));
        Booking booking = booking();
        when(bookings.findAllByOrderByStartsAtDesc()).thenReturn(List.of(booking));

        var summaries = service.bookings();

        assertEquals(1, summaries.size());
        assertEquals("Riya Deshmukh", summaries.getFirst().customerName());
        assertEquals("riya@example.test", summaries.getFirst().customerEmail());
        assertEquals("9876543210", summaries.getFirst().customerPhone());
        assertEquals("Priya Joshi", summaries.getFirst().caretakerName());
        assertEquals("priya@example.test", summaries.getFirst().caretakerEmail());
        assertEquals("9900112233", summaries.getFirst().caretakerPhone());
        assertEquals("https://example.test/riya.jpg", summaries.getFirst().customerPhotoUrl());
        assertEquals("https://example.test/priya.jpg", summaries.getFirst().caretakerPhotoUrl());
        assertEquals("https://example.test/bruno.jpg", summaries.getFirst().petPhotoUrl());
        assertEquals("Dog", summaries.getFirst().petSpecies());
        assertEquals("Golden Retriever", summaries.getFirst().petBreed());
        assertEquals("Chicken and rice twice a day.", summaries.getFirst().petFoodNotes());
        assertEquals(PaymentStatus.PENDING, summaries.getFirst().paymentStatus());
    }

    @Test
    void bookingsMapPaymentStatusAndOmitItForCancelledBookings() {
        BookingRepository bookings = mock(BookingRepository.class);
        PaymentRepository payments = mock(PaymentRepository.class);
        ReviewRepository reviews = mock(ReviewRepository.class);
        AdminServiceImpl service =
                service(mock(CaretakerProfileRepository.class), bookings, payments, reviews);
        Booking completed = booking();
        Booking cancelled = booking();
        Payment completedPayment = mock(Payment.class);
        Payment cancelledPayment = mock(Payment.class);

        when(cancelled.getId()).thenReturn(12L);
        when(cancelled.getStatus()).thenReturn(BookingStatus.CANCELLED);
        when(cancelled.getCancellationReason()).thenReturn("Owner travelling");
        when(bookings.findAllByOrderByStartsAtDesc())
                .thenReturn(List.of(completed, cancelled));
        when(payments.findByBookingIdIn(List.of(11L, 12L)))
                .thenReturn(List.of(completedPayment, cancelledPayment));
        when(completedPayment.getBooking()).thenReturn(completed);
        when(completedPayment.getStatus()).thenReturn(PaymentStatus.SUCCEEDED);
        when(cancelledPayment.getBooking()).thenReturn(cancelled);
        when(cancelledPayment.getStatus()).thenReturn(PaymentStatus.REFUNDED);
        when(reviews.findByBookingIdIn(List.of(11L, 12L))).thenReturn(List.of());

        var summaries = service.bookings();

        assertEquals(PaymentStatus.SUCCEEDED, summaries.getFirst().paymentStatus());
        assertNull(summaries.get(1).paymentStatus());
        assertEquals("Owner travelling", summaries.get(1).cancellationReason());
        verify(payments).findByBookingIdIn(List.of(11L, 12L));
    }

    @Test
    void caretakerBookingsRejectPendingCaretakers() {
        CaretakerProfileRepository profiles = mock(CaretakerProfileRepository.class);
        BookingRepository bookings = mock(BookingRepository.class);
        AdminServiceImpl service = service(profiles, bookings, mock(PaymentRepository.class), mock(ReviewRepository.class));
        CaretakerProfile profile = mock(CaretakerProfile.class);

        when(profile.getApprovalStatus()).thenReturn("PENDING");
        when(profiles.findByUserId(5L)).thenReturn(Optional.of(profile));

        assertThrows(BadRequestException.class, () -> service.caretakerBookings(5L));
    }

    @Test
    void bookingDetailIncludesContactAndPaymentDetails() {
        BookingRepository bookings = mock(BookingRepository.class);
        PaymentRepository payments = mock(PaymentRepository.class);
        ReviewRepository reviews = mock(ReviewRepository.class);
        AdminServiceImpl service =
                service(mock(CaretakerProfileRepository.class), bookings, payments, reviews);
        Booking booking = booking();
        Payment payment = mock(Payment.class);
        Review review = mock(Review.class);

        when(bookings.findById(11L)).thenReturn(Optional.of(booking));
        when(payments.findByBookingId(11L)).thenReturn(Optional.of(payment));
        when(payment.getStatus()).thenReturn(PaymentStatus.SUCCEEDED);
        when(payment.getAmount()).thenReturn(new BigDecimal("1000.00"));
        when(reviews.findByBookingId(11L)).thenReturn(java.util.Optional.of(review));
        when(review.getRating()).thenReturn(4);
        when(review.getComment()).thenReturn("Good service");

        var detail = service.bookingDetail(11L);

        assertEquals("Riya Deshmukh", detail.customer().name());
        assertEquals("riya@example.test", detail.customer().email());
        assertEquals("9876543210", detail.customer().phone());
        assertEquals("Dog", detail.pet().species());
        assertEquals("SUCCEEDED", detail.payment().status());
        assertEquals(new BigDecimal("1000.00"), detail.totalAmount());
        assertEquals(4, detail.rating());
        assertEquals("Good service", detail.review());
    }

    @Test
    void completedBookingsIncludeRatingAndReview() {
        BookingRepository bookings = mock(BookingRepository.class);
        PaymentRepository payments = mock(PaymentRepository.class);
        ReviewRepository reviews = mock(ReviewRepository.class);
        AdminServiceImpl service = service(mock(CaretakerProfileRepository.class), bookings, payments, reviews);
        Booking completed = booking();
        Review review = mock(Review.class);

        when(completed.getStatus()).thenReturn(BookingStatus.COMPLETED);
        when(completed.getId()).thenReturn(11L);
        when(bookings.findAllByOrderByStartsAtDesc()).thenReturn(List.of(completed));
        when(payments.findByBookingIdIn(List.of(11L))).thenReturn(List.of());
        when(reviews.findByBookingIdIn(List.of(11L))).thenReturn(List.of(review));
        when(review.getBooking()).thenReturn(completed);
        when(review.getRating()).thenReturn(5);
        when(review.getComment()).thenReturn("Excellent care");

        var summaries = service.bookings();

        assertEquals(5, summaries.getFirst().rating());
        assertEquals("Excellent care", summaries.getFirst().review());
    }

    private AdminServiceImpl service(
            CaretakerProfileRepository profiles,
            BookingRepository bookings,
            PaymentRepository payments,
            ReviewRepository reviews) {
        return new AdminServiceImpl(
                mock(UserRepository.class),
                profiles,
                mock(CaretakerQueryRepository.class),
                bookings,
                payments,
                reviews,
                mock(SupportTicketRepository.class),
                mock(AdminActionRepository.class),
                mock(AuditLogRepository.class),
                mock(RefreshTokenRepository.class));
    }

    private Booking booking() {
        AppUser customer = mock(AppUser.class);
        AppUser caretaker = mock(AppUser.class);
        Pet pet = mock(Pet.class);
        ServiceCatalogItem service = mock(ServiceCatalogItem.class);
        Booking booking = mock(Booking.class);

        when(customer.getId()).thenReturn(3L);
        when(customer.getName()).thenReturn("Riya Deshmukh");
        when(customer.getEmail()).thenReturn("riya@example.test");
        when(customer.getPhone()).thenReturn("9876543210");
        when(customer.getPhotoUrl()).thenReturn("https://example.test/riya.jpg");
        when(caretaker.getId()).thenReturn(5L);
        when(caretaker.getName()).thenReturn("Priya Joshi");
        when(caretaker.getEmail()).thenReturn("priya@example.test");
        when(caretaker.getPhone()).thenReturn("9900112233");
        when(caretaker.getPhotoUrl()).thenReturn("https://example.test/priya.jpg");
        when(pet.getId()).thenReturn(7L);
        when(pet.getName()).thenReturn("Bruno");
        when(pet.getSpecies()).thenReturn("Dog");
        when(pet.getBreed()).thenReturn("Golden Retriever");
        when(pet.getAgeYears()).thenReturn(new BigDecimal("3.5"));
        when(pet.getNotes()).thenReturn("Friendly and energetic.");
        when(pet.getFoodNotes()).thenReturn("Chicken and rice twice a day.");
        when(pet.getPhotoUrl()).thenReturn("https://example.test/bruno.jpg");
        when(service.getName()).thenReturn("Pet sitting");
        when(service.getDescription()).thenReturn("In-home care.");
        when(booking.getId()).thenReturn(11L);
        when(booking.getStatus()).thenReturn(BookingStatus.CONFIRMED);
        when(booking.getStartsAt()).thenReturn(java.time.LocalDateTime.of(2026, 11, 5, 10, 0));
        when(booking.getEndsAt()).thenReturn(java.time.LocalDateTime.of(2026, 11, 5, 12, 0));
        when(booking.getHourlyRate()).thenReturn(new BigDecimal("500.00"));
        when(booking.getLocation()).thenReturn("Baner, Pune");
        when(booking.getNotes()).thenReturn("Bruno needs a walk before lunch.");
        when(booking.getCancellationReason()).thenReturn(null);
        when(booking.getCreatedAt()).thenReturn(Instant.parse("2026-10-30T09:15:00Z"));
        when(booking.getCustomer()).thenReturn(customer);
        when(booking.getCaretaker()).thenReturn(caretaker);
        when(booking.getPet()).thenReturn(pet);
        when(booking.getService()).thenReturn(service);
        return booking;
    }
}
