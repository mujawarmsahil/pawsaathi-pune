package in.pawsaathi.pune.service;

import in.pawsaathi.pune.exception.ConflictException;
import in.pawsaathi.pune.exception.NotFoundException;
import in.pawsaathi.pune.model.CreateReviewRequest;
import in.pawsaathi.pune.model.ReviewResponse;
import in.pawsaathi.pune.entity.AuditLog;
import in.pawsaathi.pune.entity.BookingStatus;
import in.pawsaathi.pune.entity.Review;
import in.pawsaathi.pune.repository.AuditLogRepository;
import in.pawsaathi.pune.repository.BookingRepository;
import in.pawsaathi.pune.repository.ReviewRepository;
import in.pawsaathi.pune.repository.UserRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReviewServiceImpl implements ReviewService {
    private final ReviewRepository reviews;
    private final BookingRepository bookings;
    private final UserRepository users;
    private final AuditLogRepository auditLogs;

    public ReviewServiceImpl(
            ReviewRepository reviews,
            BookingRepository bookings,
            UserRepository users,
            AuditLogRepository auditLogs) {
        this.reviews = reviews;
        this.bookings = bookings;
        this.users = users;
        this.auditLogs = auditLogs;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> publicReviews(long caretakerId) {
        return reviews
                .findByCaretakerIdAndModerationStatusOrderByCreatedAtDesc(caretakerId, "APPROVED")
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> allForModeration() {
        return reviews.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public ReviewResponse create(long customerId, CreateReviewRequest request) {
        var booking =
                bookings.findById(request.bookingId())
                        .filter(candidate -> candidate.getCustomer().getId().equals(customerId))
                        .filter(candidate -> candidate.getStatus() == BookingStatus.COMPLETED)
                        .orElseThrow(
                                () ->
                                        new ConflictException(
                                                "Reviews are available after your completed"
                                                    + " booking."));
        if (reviews.existsByBookingId(booking.getId())) {
            throw new ConflictException("You have already reviewed this booking.");
        }
        var customer =
                users.findById(customerId)
                        .orElseThrow(() -> new NotFoundException("Customer account not found."));
        Review review;
        try {
            review =
                    reviews.saveAndFlush(
                            new Review(
                                    booking,
                                    customer,
                                    booking.getCaretaker(),
                                    request.rating(),
                                    clean(request.comment())));
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("You have already reviewed this booking.");
        }
        auditLogs.save(new AuditLog(customer, "REVIEW_SUBMITTED", "REVIEW", review.getId()));
        return toResponse(review);
    }

    @Override
    @Transactional
    public ReviewResponse moderate(long reviewId, String status) {
        Review review =
                reviews.findById(reviewId)
                        .orElseThrow(() -> new NotFoundException("Review not found."));
        review.moderate(status);
        auditLogs.save(new AuditLog(null, "REVIEW_" + status, "REVIEW", reviewId));
        return toResponse(review);
    }

    private ReviewResponse toResponse(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getRating(),
                review.getComment(),
                review.getModerationStatus(),
                review.getBooking().getId(),
                review.getAuthor().getName(),
                review.getCaretaker().getName(),
                review.getCreatedAt());
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
