package in.pawsaathi.pune.repository;

import in.pawsaathi.pune.entity.Review;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsByBookingId(long bookingId);

    List<Review> findByCaretakerIdAndModerationStatusOrderByCreatedAtDesc(
            long caretakerId, String status);

    List<Review> findAllByOrderByCreatedAtDesc();
}
