package in.pawsaathi.pune.controller;

import in.pawsaathi.pune.model.CreateReviewRequest;
import in.pawsaathi.pune.model.ModerateReviewRequest;
import in.pawsaathi.pune.model.ReviewResponse;
import in.pawsaathi.pune.security.CurrentUserProvider;
import in.pawsaathi.pune.service.ReviewService;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ReviewController {
    private final ReviewService reviews;
    private final CurrentUserProvider currentUser;

    public ReviewController(ReviewService reviews, CurrentUserProvider currentUser) {
        this.reviews = reviews;
        this.currentUser = currentUser;
    }

    @GetMapping("/caretakers/{id}/reviews")
    public List<ReviewResponse> publicReviews(@PathVariable long id) {
        return reviews.publicReviews(id);
    }

    @PostMapping("/reviews")
    @PreAuthorize("hasRole('CUSTOMER')")
    public Map<String, String> create(@Valid @RequestBody CreateReviewRequest request) {
        ReviewResponse review = reviews.create(currentUser.require().id(), request);
        return Map.of("submitted", "true", "moderationStatus", review.moderationStatus());
    }

    @GetMapping("/admin/reviews")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ReviewResponse> moderationQueue() {
        return reviews.allForModeration();
    }

    @PatchMapping("/admin/reviews/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> moderate(
            @PathVariable long id, @Valid @RequestBody ModerateReviewRequest request) {
        ReviewResponse review = reviews.moderate(id, request.status());
        return Map.of("id", review.id(), "status", review.moderationStatus());
    }
}
