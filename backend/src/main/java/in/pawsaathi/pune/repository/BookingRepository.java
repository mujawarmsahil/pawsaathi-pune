package in.pawsaathi.pune.repository;

import in.pawsaathi.pune.entity.Booking;
import in.pawsaathi.pune.entity.BookingStatus;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByCustomerIdOrderByStartsAtDesc(long customerId);

    Optional<Booking> findByIdAndCustomerId(long id, long customerId);

    List<Booking> findByCaretakerIdOrderByStartsAtDesc(long caretakerId);

    List<Booking> findAllByOrderByStartsAtDesc();

    List<Booking> findAllByOrderByCreatedAtDesc();

    @Query(
            """
            SELECT b FROM Booking b
            WHERE b.customer.id IN :customerIds
              AND b.location IS NOT NULL AND TRIM(b.location) <> ''
            ORDER BY b.startsAt DESC
            """)
    List<Booking> findCustomerLocations(
            @Param("customerIds") List<Long> customerIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Booking b WHERE b.id=:id")
    Optional<Booking> findLockedById(@Param("id") long id);

    @Query(
            """
            SELECT COUNT(b) > 0 FROM Booking b
            WHERE b.caretaker.id=:caretakerId
              AND b.status IN :activeStatuses
              AND b.startsAt < :endsAt AND b.endsAt > :startsAt
              AND (b.status<>in.pawsaathi.pune.entity.BookingStatus.PENDING_PAYMENT
                   OR b.createdAt >= :pendingCutoff)
            """)
    boolean hasOverlappingBooking(
            @Param("caretakerId") long caretakerId,
            @Param("activeStatuses") List<BookingStatus> activeStatuses,
            @Param("startsAt") LocalDateTime startsAt,
            @Param("endsAt") LocalDateTime endsAt,
            @Param("pendingCutoff") java.time.Instant pendingCutoff);

    @Query(
            """
            SELECT b FROM Booking b
            WHERE (:customerId IS NULL OR b.customer.id=:customerId)
              AND (:caretakerId IS NULL OR b.caretaker.id=:caretakerId)
            ORDER BY b.startsAt DESC
            """)
    List<Booking> findVisibleBookings(
            @Param("customerId") Long customerId, @Param("caretakerId") Long caretakerId);
}
