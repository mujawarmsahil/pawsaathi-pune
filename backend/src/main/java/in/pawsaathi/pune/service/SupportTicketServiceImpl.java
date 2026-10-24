package in.pawsaathi.pune.service;

import in.pawsaathi.pune.exception.ConflictException;
import in.pawsaathi.pune.exception.NotFoundException;
import in.pawsaathi.pune.model.CreateSupportTicketRequest;
import in.pawsaathi.pune.model.SupportTicketResponse;
import in.pawsaathi.pune.entity.AuditLog;
import in.pawsaathi.pune.entity.SupportTicket;
import in.pawsaathi.pune.entity.SupportTicketStatus;
import in.pawsaathi.pune.repository.AuditLogRepository;
import in.pawsaathi.pune.repository.BookingRepository;
import in.pawsaathi.pune.repository.SupportTicketRepository;
import in.pawsaathi.pune.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SupportTicketServiceImpl implements SupportTicketService {
    private final SupportTicketRepository tickets;
    private final BookingRepository bookings;
    private final UserRepository users;
    private final AuditLogRepository auditLogs;

    public SupportTicketServiceImpl(
            SupportTicketRepository tickets,
            BookingRepository bookings,
            UserRepository users,
            AuditLogRepository auditLogs) {
        this.tickets = tickets;
        this.bookings = bookings;
        this.users = users;
        this.auditLogs = auditLogs;
    }

    @Override
    @Transactional
    public SupportTicketResponse create(long customerId, CreateSupportTicketRequest request) {
        var customer =
                users.findById(customerId)
                        .orElseThrow(() -> new NotFoundException("Account not found."));
        var booking =
                request.bookingId() == null
                        ? null
                        : bookings.findById(request.bookingId())
                                .filter(
                                        item ->
                                                item.getCustomer().getId().equals(customerId)
                                                        || item.getCaretaker().getId().equals(customerId))
                                .orElseThrow(
                                        () ->
                                                new ConflictException(
                                                        "Choose one of your bookings."));
        SupportTicket ticket =
                tickets.save(
                        new SupportTicket(
                                customer,
                                booking,
                                request.subject().trim(),
                                request.description().trim()));
        auditLogs.save(
                new AuditLog(customer, "SUPPORT_TICKET_CREATED", "SUPPORT_TICKET", ticket.getId()));
        return toResponse(ticket);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupportTicketResponse> list(long userId, boolean admin) {
        var items =
                admin
                        ? tickets.findAllByOrderByCreatedAtDesc()
                        : tickets.findByUserIdOrderByCreatedAtDesc(userId);
        return items.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public SupportTicketResponse updateStatus(
            long adminId, long ticketId, SupportTicketStatus status) {
        SupportTicket ticket =
                tickets.findById(ticketId)
                        .orElseThrow(() -> new NotFoundException("Support ticket not found."));
        ticket.updateStatus(status);
        var admin =
                users.findById(adminId)
                        .orElseThrow(() -> new NotFoundException("Admin account not found."));
        auditLogs.save(
                new AuditLog(admin, "SUPPORT_TICKET_" + status.name(), "SUPPORT_TICKET", ticketId));
        return toResponse(ticket);
    }

    private SupportTicketResponse toResponse(SupportTicket ticket) {
        return new SupportTicketResponse(
                ticket.getId(),
                ticket.getSubject(),
                ticket.getDescription(),
                ticket.getStatus(),
                ticket.getPriority(),
                ticket.getBooking() == null ? null : ticket.getBooking().getId(),
                ticket.getUser().getName(),
                ticket.getCreatedAt());
    }
}
