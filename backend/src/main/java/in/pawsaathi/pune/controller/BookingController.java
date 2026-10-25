package in.pawsaathi.pune.controller;

import in.pawsaathi.pune.model.AdminBookingDetailResponse;
import in.pawsaathi.pune.model.AdminBookingSummaryResponse;
import in.pawsaathi.pune.model.BookingRequest;
import in.pawsaathi.pune.model.BookingResponse;
import in.pawsaathi.pune.model.BookingStatusRequest;
import in.pawsaathi.pune.security.CurrentUserProvider;
import in.pawsaathi.pune.service.AdminService;
import in.pawsaathi.pune.service.BookingService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private final BookingService bookings;
    private final AdminService admins;
    private final CurrentUserProvider currentUser;

    public BookingController(BookingService bookings, AdminService admins, CurrentUserProvider currentUser) {
        this.bookings = bookings;
        this.admins = admins;
        this.currentUser = currentUser;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('CUSTOMER','CARETAKER','ADMIN')")
    public List<BookingResponse> list() {
        var user = currentUser.require();
        return bookings.list(user.id(), user.role());
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public BookingResponse create(
            @Valid @RequestBody BookingRequest request,
            @RequestHeader(name = "Idempotency-Key", required = false) @Size(max = 128)
                    String idempotencyKey) {
        return bookings.create(currentUser.require().id(), request, idempotencyKey);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('CUSTOMER','CARETAKER','ADMIN')")
    public BookingResponse updateStatus(
            @PathVariable long id, @Valid @RequestBody BookingStatusRequest request) {
        var user = currentUser.require();
        return bookings.changeStatus(user.id(), user.role(), id, request.status(), request.reason());
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AdminBookingSummaryResponse> adminList() {
        return admins.bookings();
    }

    @GetMapping("/admin/caretakers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AdminBookingSummaryResponse> caretakerBookings(@PathVariable long id) {
        return admins.caretakerBookings(id);
    }

    @GetMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public AdminBookingDetailResponse adminDetail(@PathVariable long id) {
        return admins.bookingDetail(id);
    }
}
