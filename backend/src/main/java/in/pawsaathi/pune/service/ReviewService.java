package in.pawsaathi.pune.service;

import in.pawsaathi.pune.model.CreateReviewRequest;
import in.pawsaathi.pune.model.ReviewResponse;

import java.util.List;

public interface ReviewService {
    List<ReviewResponse> publicReviews(long caretakerId);

    List<ReviewResponse> allForModeration();

    ReviewResponse create(long customerId, CreateReviewRequest request);

    ReviewResponse moderate(long reviewId, String status);
}
