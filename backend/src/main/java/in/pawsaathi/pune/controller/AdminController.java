package in.pawsaathi.pune.controller;

import in.pawsaathi.pune.model.AdminCaretakerDetailResponse;
import in.pawsaathi.pune.model.AdminDecisionRequest;
import in.pawsaathi.pune.model.AdminDecisionResponse;
import in.pawsaathi.pune.model.AdminOverviewResponse;
import in.pawsaathi.pune.model.CaretakerCandidateResponse;
import in.pawsaathi.pune.security.CurrentUserProvider;
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
    private final CurrentUserProvider currentUser;

    public AdminController(AdminService admins, CurrentUserProvider currentUser) {
        this.admins = admins;
        this.currentUser = currentUser;
    }

    @GetMapping("/overview")
    public AdminOverviewResponse overview() {
        return admins.overview();
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
