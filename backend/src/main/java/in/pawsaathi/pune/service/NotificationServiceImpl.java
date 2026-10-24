package in.pawsaathi.pune.service;

import in.pawsaathi.pune.exception.NotFoundException;
import in.pawsaathi.pune.model.NotificationResponse;
import in.pawsaathi.pune.repository.NotificationRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {
    private final NotificationRepository notifications;

    public NotificationServiceImpl(NotificationRepository notifications) {
        this.notifications = notifications;
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> list(long userId) {
        return notifications.findTop100ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(
                        item ->
                                new NotificationResponse(
                                        item.getId(),
                                        item.getTitle(),
                                        item.getBody(),
                                        item.getType(),
                                        item.getReadAt(),
                                        item.getCreatedAt()))
                .toList();
    }

    @Override
    @Transactional
    public void markRead(long userId, long notificationId) {
        var notification =
                notifications
                        .findByIdAndUserId(notificationId, userId)
                        .orElseThrow(() -> new NotFoundException("Notification not found."));
        if (notification.getReadAt() == null) notification.markRead(Instant.now());
    }
}
