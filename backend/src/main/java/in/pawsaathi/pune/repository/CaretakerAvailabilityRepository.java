package in.pawsaathi.pune.repository;

import in.pawsaathi.pune.entity.CaretakerAvailability;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

public interface CaretakerAvailabilityRepository
        extends JpaRepository<CaretakerAvailability, Long> {
    List<CaretakerAvailability>
            findByCaretakerIdAndWeekdayIsNotNullAndAvailableTrueOrderByWeekdayAscStartsAtAsc(
                    long caretakerId);

    @Modifying
    @Transactional
    void deleteByCaretakerIdAndWeekdayIsNotNull(long caretakerId);

    @Query(
            """
            SELECT COUNT(a) > 0 FROM CaretakerAvailability a
            WHERE a.caretaker.id=:caretakerId AND a.weekday=:weekday AND a.available=TRUE
              AND a.startsAt<=:startsAt AND a.endsAt>=:endsAt
              AND NOT EXISTS (
                  SELECT blocked.id FROM CaretakerAvailability blocked
                  WHERE blocked.caretaker.id=:caretakerId AND blocked.unavailableDate=:visitDate
                    AND blocked.available=FALSE
              )
            """)
    boolean hasAvailability(
            @Param("caretakerId") long caretakerId,
            @Param("weekday") int weekday,
            @Param("startsAt") LocalTime startsAt,
            @Param("endsAt") LocalTime endsAt,
            @Param("visitDate") java.time.LocalDate visitDate);
}
