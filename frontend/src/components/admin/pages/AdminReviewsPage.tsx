import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '../../../api/endpoints';
import { EmptyState, ErrorState, LoadingState } from '../../common/feedback/FeedbackStates';
import { StatusBadge } from '../../common/ui/StatusBadge';

export function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const reviewsQuery = useQuery({
    queryKey: ['admin', 'reviews'],
    queryFn: endpoints.admin.reviews,
  });
  const reviewModerationMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      endpoints.admin.moderateReview(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] }),
  });
  if (reviewsQuery.isPending) return <LoadingState label="Loading reviews…" />;
  if (reviewsQuery.isError)
    return (
      <ErrorState
        message={reviewsQuery.error.message}
        onRetry={() => void reviewsQuery.refetch()}
      />
    );
  return (
    <>
      <p className="eyebrow">Community trust</p>
      <h1>Review moderation</h1>
      {reviewsQuery.data.length === 0 ? (
        <EmptyState
          title="No reviews to moderate"
          message="Customer reviews will appear here after completed bookings."
        />
      ) : (
        <div className="booking-list">
          {reviewsQuery.data.map((review) => (
            <article className="booking-row" key={review.id}>
              <div className="booking-info">
                <b>{review.rating}/5</b>
                <span>{review.comment}</span>
              </div>
              <StatusBadge status={review.moderationStatus} />
              <div className="booking-actions">
                <button
                  disabled={reviewModerationMutation.isPending}
                  onClick={() =>
                    reviewModerationMutation.mutate({ id: review.id, status: 'APPROVED' })
                  }
                >
                  Approve
                </button>
                <button
                  disabled={reviewModerationMutation.isPending}
                  onClick={() =>
                    reviewModerationMutation.mutate({ id: review.id, status: 'REJECTED' })
                  }
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
