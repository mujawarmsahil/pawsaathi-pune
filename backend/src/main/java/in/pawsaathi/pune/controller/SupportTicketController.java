package in.pawsaathi.pune.controller;

import in.pawsaathi.pune.model.CreateSupportTicketRequest;
import in.pawsaathi.pune.model.SupportTicketResponse;
import in.pawsaathi.pune.model.UpdateSupportTicketRequest;
import in.pawsaathi.pune.security.CurrentUserProvider;
import in.pawsaathi.pune.service.SupportTicketService;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class SupportTicketController {
    private final SupportTicketService tickets;
    private final CurrentUserProvider currentUser;

    public SupportTicketController(SupportTicketService tickets, CurrentUserProvider currentUser) {
        this.tickets = tickets;
        this.currentUser = currentUser;
    }

    @PostMapping("/support/tickets")
    @PreAuthorize("hasAnyRole('CUSTOMER','CARETAKER')")
    public Map<String, Object> create(@Valid @RequestBody CreateSupportTicketRequest request) {
        var result = tickets.create(currentUser.require().id(), request);
        return Map.of("id", result.id(), "status", result.status());
    }

    @GetMapping("/support/tickets")
    @PreAuthorize("hasAnyRole('CUSTOMER','CARETAKER','ADMIN')")
    public List<SupportTicketResponse> list() {
        var user = currentUser.require();
        return tickets.list(user.id(), "ADMIN".equals(user.role()));
    }

    @PatchMapping("/admin/support/tickets/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> update(
            @PathVariable long id, @Valid @RequestBody UpdateSupportTicketRequest request) {
        var result = tickets.updateStatus(currentUser.require().id(), id, request.status());
        return Map.of("id", result.id(), "status", result.status());
    }
}
