package in.pawsaathi.pune.controller;

import in.pawsaathi.pune.model.AdminBookingSummaryResponse;
import in.pawsaathi.pune.model.AdminCaretakerDetailResponse;
import in.pawsaathi.pune.model.AdminCustomerResponse;
import in.pawsaathi.pune.model.AdminCustomerStatusRequest;
import in.pawsaathi.pune.model.AdminCustomerStatusResponse;
import in.pawsaathi.pune.model.AdminDecisionRequest;
import in.pawsaathi.pune.model.AdminDecisionResponse;
import in.pawsaathi.pune.model.AdminOverviewResponse;
import in.pawsaathi.pune.model.CaretakerCandidateResponse;
import in.pawsaathi.pune.security.CurrentUserProvider;
import in.pawsaathi.pune.service.AdminCustomerService;
import in.pawsaathi.pune.service.AdminService;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final AdminService admins;
    private final AdminCustomerService customers;
    private final CurrentUserProvider currentUser;

    public AdminController(
            AdminService admins,
            AdminCustomerService customers,
            CurrentUserProvider currentUser) {
        this.admins = admins;
        this.customers = customers;
        this.currentUser = currentUser;
    }

    @GetMapping("/overview")
    public AdminOverviewResponse overview() {
        return admins.overview();
    }

    @GetMapping("/customers")
    public List<AdminCustomerResponse> customers() {
        return customers.customers();
    }

    @GetMapping("/customers/{id}")
    public AdminCustomerResponse customer(@PathVariable long id) {
        return customers.customerDetail(id);
    }

    @PatchMapping("/customers/{id}")
    public AdminCustomerStatusResponse updateCustomerStatus(
            @PathVariable long id, @Valid @RequestBody AdminCustomerStatusRequest request) {
        return customers.updateStatus(currentUser.require().id(), id, request.status());
    }

    @GetMapping("/customers/{id}/bookings")
    public List<AdminBookingSummaryResponse> customerBookings(@PathVariable long id) {
        return admins.customerBookings(id);
    }

    @GetMapping("/caretakers")
    public List<CaretakerCandidateResponse> caretakers() {
        return admins.caretakers();
    }

    @GetMapping("/caretakers/{id}")
    public AdminCaretakerDetailResponse caretaker(@PathVariable long id) {
        return admins.caretakerDetail(id);
    }

    @PatchMapping("/caretakers/{id}")
    public AdminDecisionResponse reviewCaretaker(
            @PathVariable long id, @Valid @RequestBody AdminDecisionRequest request) {
        return admins.reviewCaretaker(currentUser.require().id(), id, request.status());
    }
}
