package in.pawsaathi.pune.service;

import in.pawsaathi.pune.model.CreateSupportTicketRequest;
import in.pawsaathi.pune.model.SupportTicketResponse;
import in.pawsaathi.pune.entity.SupportTicketStatus;

import java.util.List;

public interface SupportTicketService {
    SupportTicketResponse create(long customerId, CreateSupportTicketRequest request);

    List<SupportTicketResponse> list(long userId, boolean admin);

    SupportTicketResponse updateStatus(long adminId, long ticketId, SupportTicketStatus status);
}
