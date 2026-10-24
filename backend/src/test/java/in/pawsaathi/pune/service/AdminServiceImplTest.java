package in.pawsaathi.pune.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
import in.pawsaathi.pune.repository.SupportTicketRepository;
import in.pawsaathi.pune.repository.UserRepository;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
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
        AdminServiceImpl service = service(profiles, bookings, mock(PaymentRepository.class));
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
    void caretakerBookingsRejectPendingCaretakers() {
        CaretakerProfileRepository profiles = mock(CaretakerProfileRepository.class);
        BookingRepository bookings = mock(BookingRepository.class);
        AdminServiceImpl service = service(profiles, bookings, mock(PaymentRepository.class));
        CaretakerProfile profile = mock(CaretakerProfile.class);

        when(profile.getApprovalStatus()).thenReturn("PENDING");
        when(profiles.findByUserId(5L)).thenReturn(Optional.of(profile));

        assertThrows(BadRequestException.class, () -> service.caretakerBookings(5L));
    }

    @Test
    void bookingDetailIncludesContactAndPaymentDetails() {
        BookingRepository bookings = mock(BookingRepository.class);
        PaymentRepository payments = mock(PaymentRepository.class);
        AdminServiceImpl service =
                service(mock(CaretakerProfileRepository.class), bookings, payments);
        Booking booking = booking();
        Payment payment = mock(Payment.class);

        when(bookings.findById(11L)).thenReturn(Optional.of(booking));
        when(payments.findByBookingId(11L)).thenReturn(Optional.of(payment));
        when(payment.getStatus()).thenReturn(PaymentStatus.SUCCEEDED);
        when(payment.getAmount()).thenReturn(new BigDecimal("1000.00"));

        var detail = service.bookingDetail(11L);

        assertEquals("Riya Deshmukh", detail.customer().name());
        assertEquals("riya@example.test", detail.customer().email());
        assertEquals("9876543210", detail.customer().phone());
        assertEquals("Dog", detail.pet().species());
        assertEquals("SUCCEEDED", detail.payment().status());
        assertEquals(new BigDecimal("1000.00"), detail.totalAmount());
    }

    private AdminServiceImpl service(
            CaretakerProfileRepository profiles,
            BookingRepository bookings,
            PaymentRepository payments) {
        return new AdminServiceImpl(
                mock(UserRepository.class),
                profiles,
                mock(CaretakerQueryRepository.class),
                bookings,
                payments,
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
        when(caretaker.getId()).thenReturn(5L);
        when(caretaker.getName()).thenReturn("Priya Joshi");
        when(caretaker.getEmail()).thenReturn("priya@example.test");
        when(caretaker.getPhone()).thenReturn("9900112233");
        when(pet.getId()).thenReturn(7L);
        when(pet.getName()).thenReturn("Bruno");
        when(pet.getSpecies()).thenReturn("Dog");
        when(pet.getBreed()).thenReturn("Golden Retriever");
        when(pet.getAgeYears()).thenReturn(new BigDecimal("3.5"));
        when(pet.getNotes()).thenReturn("Friendly and energetic.");
        when(service.getName()).thenReturn("Pet sitting");
        when(service.getDescription()).thenReturn("In-home care.");
        when(booking.getId()).thenReturn(11L);
        when(booking.getStatus()).thenReturn(BookingStatus.COMPLETED);
        when(booking.getStartsAt()).thenReturn(LocalDateTime.of(2026, 11, 5, 10, 0));
        when(booking.getEndsAt()).thenReturn(LocalDateTime.of(2026, 11, 5, 12, 0));
        when(booking.getHourlyRate()).thenReturn(new BigDecimal("500.00"));
        when(booking.getLocation()).thenReturn("Baner, Pune");
        when(booking.getNotes()).thenReturn("Bruno needs a walk before lunch.");
        when(booking.getCreatedAt()).thenReturn(Instant.parse("2026-10-30T09:15:00Z"));
        when(booking.getCustomer()).thenReturn(customer);
        when(booking.getCaretaker()).thenReturn(caretaker);
        when(booking.getPet()).thenReturn(pet);
        when(booking.getService()).thenReturn(service);
        return booking;
    }
}
