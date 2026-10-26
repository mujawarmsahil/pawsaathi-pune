package in.pawsaathi.pune.repository;

import in.pawsaathi.pune.entity.Review;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsByBookingId(long bookingId);

    Optional<Review> findByBookingId(long bookingId);

    List<Review> findByBookingIdIn(Collection<Long> bookingIds);

    List<Review> findByCaretakerIdOrderByCreatedAtDesc(long caretakerId);

    List<Review> findAllByOrderByCreatedAtDesc();
}
