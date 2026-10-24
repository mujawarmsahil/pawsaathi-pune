package in.pawsaathi.pune.controller;

import in.pawsaathi.pune.model.NotificationResponse;
import in.pawsaathi.pune.security.CurrentUserProvider;
import in.pawsaathi.pune.service.NotificationService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("isAuthenticated()")
public class NotificationController {
    private final NotificationService notifications;
    private final CurrentUserProvider currentUser;

    public NotificationController(
            NotificationService notifications, CurrentUserProvider currentUser) {
        this.notifications = notifications;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<NotificationResponse> list() {
        return notifications.list(currentUser.require().id());
    }

    @PatchMapping("/{id}/read")
    public void markRead(@PathVariable long id) {
        notifications.markRead(currentUser.require().id(), id);
    }
}
