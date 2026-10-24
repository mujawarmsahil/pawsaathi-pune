package in.pawsaathi.pune.controller;

import in.pawsaathi.pune.model.AvailabilitySlotRequest;
import in.pawsaathi.pune.model.AvailabilitySlotResponse;
import in.pawsaathi.pune.security.CurrentUserProvider;
import in.pawsaathi.pune.service.AvailabilityService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Validated
@RestController
@RequestMapping("/api/caretaker/availability")
@PreAuthorize("hasRole('CARETAKER')")
public class AvailabilityController {
    private final AvailabilityService availability;
    private final CurrentUserProvider currentUser;

    public AvailabilityController(
            AvailabilityService availability, CurrentUserProvider currentUser) {
        this.availability = availability;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<AvailabilitySlotResponse> list() {
        return availability.listRecurring(currentUser.require().id());
    }

    @PutMapping
    public Map<String, Integer> replace(
            @RequestBody @NotNull @Size(max = 42)
                    List<@NotNull @Valid AvailabilitySlotRequest> slots) {
        return Map.of("saved", availability.replaceRecurring(currentUser.require().id(), slots));
    }
}
