package in.pawsaathi.pune.repository;

import in.pawsaathi.pune.entity.Notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findTop100ByUserIdOrderByCreatedAtDesc(long userId);

    Optional<Notification> findByIdAndUserId(long id, long userId);
}
