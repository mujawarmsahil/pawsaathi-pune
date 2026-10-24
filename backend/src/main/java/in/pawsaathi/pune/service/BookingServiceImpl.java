package in.pawsaathi.pune.service;

import in.pawsaathi.pune.exception.ConflictException;
import in.pawsaathi.pune.exception.ForbiddenException;
import in.pawsaathi.pune.exception.InvalidStateTransitionException;
import in.pawsaathi.pune.exception.NotFoundException;
import in.pawsaathi.pune.mapper.ResponseMapper;
import in.pawsaathi.pune.model.BookingRequest;
import in.pawsaathi.pune.model.BookingResponse;
import in.pawsaathi.pune.entity.AppUser;
import in.pawsaathi.pune.entity.AuditLog;
import in.pawsaathi.pune.entity.Booking;
import in.pawsaathi.pune.entity.BookingStatus;
import in.pawsaathi.pune.entity.BookingStatusHistory;
import in.pawsaathi.pune.entity.Notification;
import in.pawsaathi.pune.entity.PaymentStatus;
import in.pawsaathi.pune.repository.AuditLogRepository;
import in.pawsaathi.pune.repository.BookingIdempotencyRepository;
import in.pawsaathi.pune.repository.BookingRepository;
import in.pawsaathi.pune.repository.BookingStatusHistoryRepository;
import in.pawsaathi.pune.repository.CaretakerAvailabilityRepository;
import in.pawsaathi.pune.repository.CaretakerProfileRepository;
import in.pawsaathi.pune.repository.NotificationRepository;
import in.pawsaathi.pune.repository.PaymentRepository;
import in.pawsaathi.pune.repository.PetRepository;
import in.pawsaathi.pune.repository.ServiceCatalogRepository;
import in.pawsaathi.pune.repository.UserRepository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@Service
public class BookingServiceImpl implements BookingService {
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Kolkata");
    private static final Duration PAYMENT_HOLD = Duration.ofMinutes(15);
    private static final List<BookingStatus> BLOCKING_STATUSES =
            List.of(
                    BookingStatus.PENDING_PAYMENT,
                    BookingStatus.REQUESTED,
                    BookingStatus.CONFIRMED,
                    BookingStatus.ACCEPTED,
                    BookingStatus.IN_PROGRESS,
                    BookingStatus.PENDING);

    private final BookingRepository bookings;
    private final BookingStatusHistoryRepository history;
    private final UserRepository users;
    private final PetRepository pets;
    private final ServiceCatalogRepository services;
    private final CaretakerProfileRepository caretakers;
    private final CaretakerAvailabilityRepository availability;
    private final PaymentRepository payments;
    private final NotificationRepository notifications;
    private final AuditLogRepository auditLogs;
    private final ResponseMapper responseMapper;
    private final BookingTransitionPolicy transitionPolicy;
    private final BookingIdempotencyRepository idempotency;
    private final ObjectMapper objectMapper;

    public BookingServiceImpl(
            BookingRepository bookings,
            BookingStatusHistoryRepository history,
            UserRepository users,
            PetRepository pets,
            ServiceCatalogRepository services,
            CaretakerProfileRepository caretakers,
            CaretakerAvailabilityRepository availability,
            PaymentRepository payments,
            NotificationRepository notifications,
            AuditLogRepository auditLogs,
            ResponseMapper responseMapper,
            BookingTransitionPolicy transitionPolicy,
            BookingIdempotencyRepository idempotency,
            ObjectMapper objectMapper) {
        this.bookings = bookings;
        this.history = history;
        this.users = users;
        this.pets = pets;
        this.services = services;
        this.caretakers = caretakers;
        this.availability = availability;
        this.payments = payments;
        this.notifications = notifications;
        this.auditLogs = auditLogs;
        this.responseMapper = responseMapper;
        this.transitionPolicy = transitionPolicy;
        this.idempotency = idempotency;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> list(long currentUserId, String role) {
        List<Booking> result =
                switch (role) {
                    case "ADMIN" -> bookings.findAllByOrderByCreatedAtDesc();
                    case "CUSTOMER" -> bookings.findByCustomerIdOrderByStartsAtDesc(currentUserId);
                    case "CARETAKER" ->
                            bookings.findByCaretakerIdOrderByStartsAtDesc(currentUserId);
                    default -> throw new ForbiddenException("Booking access is not available.");
                };
        return result.stream().map(responseMapper::toResponse).toList();
    }

    @Override
    @Transactional
    public BookingResponse create(long customerId, BookingRequest request, String idempotencyKey) {
        Optional<Long> existingId = Optional.empty();
        if (idempotencyKey != null) {
            existingId =
                    idempotency.claimOrReplay(customerId, idempotencyKey, requestHash(request));
        }

        // Acquire the caretaker lock before a normal database read establishes a repeatable-read
        // snapshot. Concurrent requests then observe bookings committed while waiting for the lock.
        AppUser caretaker =
                users.findLockedById(request.caretakerId())
                        .orElseThrow(() -> new NotFoundException("Caretaker not found."));
        AppUser customer =
                users.findById(customerId)
                        .filter(AppUser::isActive)
                        .orElseThrow(() -> new NotFoundException("Customer account not found."));
        if (existingId.isPresent()) {
            Booking existing =
                    bookings.findByIdAndCustomerId(existingId.get(), customerId)
                            .orElseThrow(
                                    () ->
                                            new IllegalStateException(
                                                    "Booking idempotency record references no owner booking."));
            return responseMapper.toResponse(existing);
        }

        LocalDateTime now = LocalDateTime.now(BUSINESS_ZONE);
        if (!request.startsAt().isAfter(now)
                || !request.endsAt().isAfter(request.startsAt())
                || !request.startsAt().toLocalDate().equals(request.endsAt().toLocalDate())) {
            throw new ConflictException("Choose a future visit that ends on the same day.");
        }
        long minutes = Duration.between(request.startsAt(), request.endsAt()).toMinutes();
        if (minutes < 60 || minutes > 480 || minutes % 30 != 0) {
            throw new ConflictException(
                    "Care duration must be 1 to 8 hours in 30-minute increments.");
        }

        if (!caretaker.isActive()) {
            throw new NotFoundException("Caretaker not found.");
        }
        var pet =
                pets.findByIdAndOwnerIdAndDeletedAtIsNull(request.petId(), customerId)
                        .orElseThrow(
                                () -> new ConflictException("Choose one of your active pets."));
        var service =
                services.findByIdAndActiveTrue(request.serviceId())
                        .orElseThrow(
                                () -> new ConflictException("Selected service is unavailable."));
        var rate =
                caretakers
                        .findApprovedHourlyRate(caretaker.getId(), service.getId())
                        .orElseThrow(
                                () ->
                                        new ConflictException(
                                                "This caretaker is not approved for that"
                                                    + " service."));

        if (caretakers.countSupportedAreasForLocation(caretaker.getId(), request.location().trim())
                == 0) {
            throw new ConflictException("Choose an area this caretaker serves.");
        }
        int weekday = request.startsAt().getDayOfWeek().getValue() - 1;
        if (!availability.hasAvailability(
                caretaker.getId(),
                weekday,
                request.startsAt().toLocalTime(),
                request.endsAt().toLocalTime(),
                request.startsAt().toLocalDate())) {
            throw new ConflictException("This caretaker has not marked that time as available.");
        }
        if (bookings.hasOverlappingBooking(
                caretaker.getId(),
                BLOCKING_STATUSES,
                request.startsAt(),
                request.endsAt(),
                java.time.Instant.now().minus(PAYMENT_HOLD))) {
            throw new ConflictException("This caretaker is already booked for that time.");
        }

        Booking booking =
                bookings.save(
                        new Booking(
                                customer,
                                caretaker,
                                pet,
                                service,
                                request.startsAt(),
                                request.endsAt(),
                                rate,
                                request.location().trim(),
                                clean(request.notes())));
        history.save(
                new BookingStatusHistory(
                        booking,
                        null,
                        BookingStatus.PENDING_PAYMENT,
                        customer,
                        "Booking request created; awaiting payment"));
        notifications.save(
                new Notification(
                        caretaker,
                        "New booking request",
                        "A pet parent has requested a booking. Review it from your dashboard.",
                        "BOOKING"));
        auditLogs.save(new AuditLog(customer, "BOOKING_CREATED", "BOOKING", booking.getId()));
        if (idempotencyKey != null) {
            idempotency.associateBooking(customerId, idempotencyKey, booking.getId());
        }
        return responseMapper.toResponse(booking);
    }

    private String requestHash(BookingRequest request) {
        try {
            byte[] canonicalRequest = objectMapper.writeValueAsBytes(request);
            return HexFormat.of()
                    .formatHex(MessageDigest.getInstance("SHA-256").digest(canonicalRequest));
        } catch (JsonProcessingException | NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "Could not calculate booking request fingerprint.", exception);
        }
    }

    @Override
    @Transactional
    public BookingResponse changeStatus(
            long currentUserId, String role, long bookingId, BookingStatus nextStatus) {
        AppUser actor =
                users.findById(currentUserId)
                        .orElseThrow(() -> new NotFoundException("Account not found."));
        Booking booking =
                bookings.findLockedById(bookingId)
                        .orElseThrow(() -> new NotFoundException("Booking not found."));
        BookingStatus current = booking.getStatus();
        if (!transitionPolicy.allows(
                actor.getId(),
                booking.getCustomer().getId(),
                booking.getCaretaker().getId(),
                role,
                current,
                nextStatus)) {
            throw new InvalidStateTransitionException("This booking status change is not allowed.");
        }
        if (nextStatus == BookingStatus.CANCELLED || nextStatus == BookingStatus.REJECTED) {
            if (payments.existsByBookingIdAndStatus(bookingId, PaymentStatus.SUCCEEDED)) {
                throw new ConflictException(
                        "This booking has been paid. Contact support to arrange cancellation and"
                            + " refund.");
            }
        }
        booking.transitionTo(nextStatus);
        history.save(new BookingStatusHistory(booking, current, nextStatus, actor, null));
        auditLogs.save(new AuditLog(actor, "BOOKING_" + nextStatus.name(), "BOOKING", bookingId));
        AppUser recipient =
                actor.getId().equals(booking.getCaretaker().getId())
                        ? booking.getCustomer()
                        : booking.getCaretaker();
        notifications.save(
                new Notification(
                        recipient,
                        "Booking updated",
                        "Booking #"
                                + bookingId
                                + " is now "
                                + nextStatus.name().toLowerCase().replace('_', ' ')
                                + ".",
                        "BOOKING"));
        return responseMapper.toResponse(booking);
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
