package in.pawsaathi.pune.repository;

import in.pawsaathi.pune.entity.Payment;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByBookingId(long bookingId);

    List<Payment> findByBookingIdIn(Collection<Long> bookingIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.booking.id=:bookingId")
    Optional<Payment> findLockedByBookingId(@Param("bookingId") long bookingId);

    boolean existsByBookingIdAndStatus(
            long bookingId, in.pawsaathi.pune.entity.PaymentStatus status);

    Optional<Payment> findByProviderOrderId(String providerOrderId);
}
