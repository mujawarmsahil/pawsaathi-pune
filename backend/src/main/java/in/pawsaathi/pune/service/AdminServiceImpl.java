package in.pawsaathi.pune.service;

import in.pawsaathi.pune.entity.AdminAction;
import in.pawsaathi.pune.entity.AppUser;
import in.pawsaathi.pune.entity.AuditLog;
import in.pawsaathi.pune.entity.Booking;
import in.pawsaathi.pune.entity.CaretakerProfile;
import in.pawsaathi.pune.entity.Payment;
import in.pawsaathi.pune.entity.Pet;
import in.pawsaathi.pune.entity.ServiceCatalogItem;
import in.pawsaathi.pune.entity.SupportTicketStatus;
import in.pawsaathi.pune.exception.BadRequestException;
import in.pawsaathi.pune.exception.NotFoundException;
import in.pawsaathi.pune.model.AdminBookingDetailResponse;
import in.pawsaathi.pune.model.AdminBookingSummaryResponse;
import in.pawsaathi.pune.model.AdminCaretakerDetailResponse;
import in.pawsaathi.pune.model.AdminDecisionResponse;
import in.pawsaathi.pune.model.AdminOverviewResponse;
import in.pawsaathi.pune.model.CaretakerCandidateResponse;
import in.pawsaathi.pune.repository.AdminActionRepository;
import in.pawsaathi.pune.repository.AuditLogRepository;
import in.pawsaathi.pune.repository.BookingRepository;
import in.pawsaathi.pune.repository.CaretakerProfileRepository;
import in.pawsaathi.pune.repository.CaretakerQueryRepository;
import in.pawsaathi.pune.repository.PaymentRepository;
import in.pawsaathi.pune.repository.RefreshTokenRepository;
import in.pawsaathi.pune.repository.SupportTicketRepository;
import in.pawsaathi.pune.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;

@Service
public class AdminServiceImpl implements AdminService {
    private static final Set<String> DECISIONS =
            Set.of("APPROVED", "REJECTED", "SUSPENDED");
    private static final Set<String> BOOKING_HISTORY_STATUSES =
            Set.of("APPROVED", "SUSPENDED");

    private final UserRepository users;
    private final CaretakerProfileRepository profiles;
    private final CaretakerQueryRepository caretakerQueries;
    private final BookingRepository bookings;
    private final PaymentRepository payments;
    private final SupportTicketRepository tickets;
    private final AdminActionRepository adminActions;
    private final AuditLogRepository auditLogs;
    private final RefreshTokenRepository refreshTokens;

    public AdminServiceImpl(
            UserRepository users,
            CaretakerProfileRepository profiles,
            CaretakerQueryRepository caretakerQueries,
            BookingRepository bookings,
            PaymentRepository payments,
            SupportTicketRepository tickets,
            AdminActionRepository adminActions,
            AuditLogRepository auditLogs,
            RefreshTokenRepository refreshTokens) {
        this.users = users;
        this.profiles = profiles;
        this.caretakerQueries = caretakerQueries;
        this.bookings = bookings;
        this.payments = payments;
        this.tickets = tickets;
        this.adminActions = adminActions;
        this.auditLogs = auditLogs;
        this.refreshTokens = refreshTokens;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminOverviewResponse overview() {
        return new AdminOverviewResponse(
                users.countByRoleName("CUSTOMER"),
                profiles.countByApprovalStatus("APPROVED"),
                profiles.countByApprovalStatus("PENDING"),
                bookings.count(),
                tickets.countByStatus(SupportTicketStatus.OPEN));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CaretakerCandidateResponse> caretakers() {
        return caretakerQueries.adminCandidates();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminCaretakerDetailResponse caretakerDetail(long caretakerId) {
        return caretakerQueries
                .findAdminDetail(caretakerId)
                .orElseThrow(() -> new NotFoundException("Caretaker profile not found."));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminBookingSummaryResponse> caretakerBookings(long caretakerId) {
        CaretakerProfile profile =
                profiles
                        .findByUserId(caretakerId)
                        .orElseThrow(() -> new NotFoundException("Caretaker profile not found."));
        if (!BOOKING_HISTORY_STATUSES.contains(profile.getApprovalStatus())) {
            throw new BadRequestException(
                    "Booking history is only available for approved or suspended caretakers.");
        }
        return bookings.findByCaretakerIdOrderByStartsAtDesc(caretakerId).stream()
                .map(this::bookingSummary)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminBookingDetailResponse bookingDetail(long bookingId) {
        Booking booking =
                bookings.findById(bookingId)
                        .orElseThrow(() -> new NotFoundException("Booking not found."));
        Payment payment = payments.findByBookingId(bookingId).orElse(null);
        AppUser customer = booking.getCustomer();
        AppUser caretaker = booking.getCaretaker();
        Pet pet = booking.getPet();
        ServiceCatalogItem service = booking.getService();
        long durationMinutes = durationMinutes(booking);
        return new AdminBookingDetailResponse(
                booking.getId(),
                booking.getStatus(),
                booking.getStartsAt(),
                booking.getEndsAt(),
                durationMinutes,
                booking.getHourlyRate(),
                bookingTotal(booking, durationMinutes),
                booking.getLocation(),
                booking.getNotes(),
                booking.getCreatedAt(),
                service.getName(),
                service.getDescription(),
                new AdminBookingDetailResponse.CustomerDetails(
                        customer.getId(), customer.getName(), customer.getEmail(), customer.getPhone()),
                new AdminBookingDetailResponse.CaretakerDetails(
                        caretaker.getId(),
                        caretaker.getName(),
                        caretaker.getEmail(),
                        caretaker.getPhone()),
                new AdminBookingDetailResponse.PetDetails(
                        pet.getId(),
                        pet.getName(),
                        pet.getSpecies(),
                        pet.getBreed(),
                        pet.getAgeYears(),
                        pet.getNotes(),
                        pet.getPhotoUrl()),
                payment == null
                        ? null
                        : new AdminBookingDetailResponse.PaymentDetails(
                                payment.getStatus().name(), payment.getAmount(), "INR"));
    }

    @Override
    @Transactional
    public AdminDecisionResponse reviewCaretaker(long adminId, long caretakerId, String status) {
        String decision = status == null ? "" : status.trim().toUpperCase(java.util.Locale.ROOT);
        if (!DECISIONS.contains(decision)) {
            throw new BadRequestException("Choose APPROVED, REJECTED, or SUSPENDED.");
        }
        AppUser admin =
                users.findById(adminId)
                        .orElseThrow(() -> new NotFoundException("Admin account not found."));
        CaretakerProfile profile =
                profiles.findByUserId(caretakerId)
                        .orElseThrow(() -> new NotFoundException("Caretaker profile not found."));
        profile.review(decision);
        profiles.save(profile);
        AppUser caretaker = profile.getUser();
        caretaker.setStatus(
                switch (decision) {
                    case "APPROVED" -> "ACTIVE";
                    case "REJECTED" -> "REJECTED";
                    case "SUSPENDED" -> "SUSPENDED";
                    default -> throw new IllegalStateException("Unsupported caretaker decision.");
                });
        users.save(caretaker);
        if (!"APPROVED".equals(decision)) {
            refreshTokens.revokeAllForUser(caretakerId, Instant.now());
        }
        adminActions.save(
                new AdminAction(admin, "CARETAKER_" + decision, "CARETAKER", caretakerId, null));
        auditLogs.save(new AuditLog(admin, "CARETAKER_" + decision, "CARETAKER", caretakerId));
        return new AdminDecisionResponse(caretakerId, decision);
    }

    private AdminBookingSummaryResponse bookingSummary(Booking booking) {
        long durationMinutes = durationMinutes(booking);
        return new AdminBookingSummaryResponse(
                booking.getId(),
                booking.getStatus(),
                booking.getStartsAt(),
                booking.getEndsAt(),
                durationMinutes,
                booking.getHourlyRate(),
                bookingTotal(booking, durationMinutes),
                booking.getService().getName(),
                booking.getPet().getName(),
                booking.getCustomer().getName(),
                booking.getCreatedAt());
    }

    private long durationMinutes(Booking booking) {
        return Duration.between(booking.getStartsAt(), booking.getEndsAt()).toMinutes();
    }

    private BigDecimal bookingTotal(Booking booking, long durationMinutes) {
        return booking.getHourlyRate()
                .multiply(BigDecimal.valueOf(durationMinutes))
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
    }
}
