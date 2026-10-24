package in.pawsaathi.pune.repository;

import in.pawsaathi.pune.entity.PaymentWebhookEvent;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface PaymentWebhookEventRepository extends JpaRepository<PaymentWebhookEvent, String> {
    @Modifying
    @Transactional
    @Query(
            value =
                    "INSERT IGNORE INTO payment_webhook_events(event_id,event_type)"
                        + " VALUES(:eventId,:eventType)",
            nativeQuery = true)
    int insertIfNew(@Param("eventId") String eventId, @Param("eventType") String eventType);
}
