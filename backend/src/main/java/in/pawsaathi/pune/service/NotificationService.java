package in.pawsaathi.pune.service;

import in.pawsaathi.pune.model.NotificationResponse;

import java.util.List;

public interface NotificationService {
    List<NotificationResponse> list(long userId);

    void markRead(long userId, long notificationId);
}
