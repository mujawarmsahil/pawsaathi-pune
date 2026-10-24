package in.pawsaathi.pune.controller;

import in.pawsaathi.pune.model.CaretakerDetailResponse;
import in.pawsaathi.pune.model.CaretakerProfileRequest;
import in.pawsaathi.pune.model.CaretakerProfileResponse;
import in.pawsaathi.pune.model.CaretakerSummaryResponse;
import in.pawsaathi.pune.security.CurrentUserProvider;
import in.pawsaathi.pune.service.CaretakerService;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class CaretakerController {
    private final CaretakerService caretakers;
    private final CurrentUserProvider currentUser;

    public CaretakerController(CaretakerService caretakers, CurrentUserProvider currentUser) {
        this.caretakers = caretakers;
        this.currentUser = currentUser;
    }

    @GetMapping("/caretakers")
    public List<CaretakerSummaryResponse> caretakers(
            @RequestParam(required = false) Long serviceId,
            @RequestParam(required = false) String area) {
        return caretakers.searchApproved(serviceId, area);
    }

    @GetMapping("/caretakers/{id}")
    public CaretakerDetailResponse caretaker(@PathVariable long id) {
        return caretakers.getApproved(id);
    }

    @GetMapping("/caretaker/profile")
    @PreAuthorize("hasRole('CARETAKER')")
    public CaretakerProfileResponse profile() {
        return caretakers.profile(currentUser.require().id());
    }

    @PutMapping("/caretaker/profile")
    @PreAuthorize("hasRole('CARETAKER')")
    public CaretakerProfileResponse saveProfile(
            @Valid @RequestBody CaretakerProfileRequest request) {
        return caretakers.saveProfile(currentUser.require().id(), request);
    }

    @PutMapping("/caretaker/services")
    @PreAuthorize("hasRole('CARETAKER')")
    public Map<String, Object> saveServices(@RequestBody List<Long> serviceIds) {
        return Map.of("saved", caretakers.saveServices(currentUser.require().id(), serviceIds));
    }
}
