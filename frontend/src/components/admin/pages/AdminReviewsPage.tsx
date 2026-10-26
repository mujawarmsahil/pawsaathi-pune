import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, CalendarDays, PawPrint, Star, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { endpoints } from '../../../api/endpoints';
import type { Review } from '../../../types/api';
import { formatAdminDate } from '../../../utils';
import { EmptyState, ErrorState } from '../../common/feedback/FeedbackStates';

const ratingTabs = [5, 4, 3, 2, 1] as const;

function AdminReviewsSkeleton() {
  return (
    <div className="admin-review-list" role="status" aria-label="Loading reviews" aria-busy="true">
      <span className="sr-only">Loading reviews…</span>
      {['first', 'second', 'third'].map((key) => (
        <div className="admin-review admin-review-skeleton" key={key} aria-hidden="true">
          <span className="admin-skeleton-bar medium image-skeleton" />
          <span className="admin-skeleton-bar full image-skeleton" />
          <span className="admin-skeleton-bar short image-skeleton" />
        </div>
      ))}
    </div>
  );
}

function ownerInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="admin-review">
      <div className="admin-review-head">
        <div className="admin-review-owner">
          <span className="admin-review-avatar" aria-hidden="true">
            {ownerInitials(review.author)}
          </span>
          <span className="admin-review-owner-copy">
            <small>Owner</small>
            <Link
              to={`/admin/bookings/${review.bookingId}#customer`}
              aria-label={`Owner ${review.author} on booking ${review.bookingId}`}
            >
              {review.author}
            </Link>
          </span>
        </div>
        <span className="admin-review-rating">
          <Star size={13} fill="currentColor" /> {review.rating}/5
        </span>
      </div>
      <p className="admin-review-comment">{review.comment || 'No comment provided.'}</p>
      <div className="admin-review-footer">
        <div className="admin-review-meta">
          <Link
            className="admin-review-chip"
            to={`/admin/caretakers/${review.caretakerId}`}
            aria-label={`Caretaker ${review.caretaker}`}
          >
            <UserRound size={13} />
            <span>Caretaker</span>
            <b>{review.caretaker}</b>
          </Link>
          <Link
            className="admin-review-chip"
            to={`/admin/bookings/${review.bookingId}#pet`}
            aria-label={`Pet ${review.petName} on booking ${review.bookingId}`}
          >
            <PawPrint size={13} />
            <span>Pet</span>
            <b>{review.petName}</b>
          </Link>
          <span className="admin-review-date">
            <CalendarDays size={13} /> {formatAdminDate(review.createdAt)}
          </span>
        </div>
        <Link className="admin-review-booking" to={`/admin/bookings/${review.bookingId}`}>
          Booking #{review.bookingId}
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export function AdminReviewsPage() {
  const [ownerFilter, setOwnerFilter] = useState('');
  const [caretakerFilter, setCaretakerFilter] = useState('');
  const [activeRating, setActiveRating] = useState<(typeof ratingTabs)[number]>(5);
  const reviewsQuery = useQuery({
    queryKey: ['admin', 'reviews'],
    queryFn: endpoints.admin.reviews,
  });
  const trimmedOwnerFilter = ownerFilter.trim().toLowerCase();
  const trimmedCaretakerFilter = caretakerFilter.trim().toLowerCase();
  const filteredReviews = useMemo(
    () =>
      (reviewsQuery.data ?? [])
        .filter((review) =>
          trimmedOwnerFilter ? review.author.toLowerCase().includes(trimmedOwnerFilter) : true,
        )
        .filter((review) =>
          trimmedCaretakerFilter
            ? review.caretaker.toLowerCase().includes(trimmedCaretakerFilter)
            : true,
        ),
    [reviewsQuery.data, trimmedCaretakerFilter, trimmedOwnerFilter],
  );
  const reviewsByRating = useMemo(
    () =>
      Object.fromEntries(
        ratingTabs.map((rating) => [
          rating,
          filteredReviews.filter((review) => review.rating === rating),
        ]),
      ) as Record<(typeof ratingTabs)[number], Review[]>,
    [filteredReviews],
  );

  if (reviewsQuery.isPending) return <AdminReviewsSkeleton />;
  if (reviewsQuery.isError)
    return (
      <ErrorState
        message={reviewsQuery.error.message}
        onRetry={() => void reviewsQuery.refetch()}
      />
    );

  const hasFilters = Boolean(trimmedOwnerFilter || trimmedCaretakerFilter);
  const visibleReviews = reviewsByRating[activeRating];
  const emptyTitle = hasFilters
    ? `No matching ${activeRating}-star reviews`
    : `No ${activeRating}-star reviews`;

  return (
    <>
      <p className="eyebrow">Community trust</p>
      <h1>Reviews</h1>
      <p className="admin-muted">
        Every review from a completed booking is published automatically. Use the filters to find
        feedback by owner or caretaker.
      </p>
      <div className="admin-filter">
        <label>
          Owner name
          <input
            type="search"
            value={ownerFilter}
            onChange={(event) => setOwnerFilter(event.target.value)}
            placeholder="Search by owner"
          />
        </label>
        <label>
          Caretaker name
          <input
            type="search"
            value={caretakerFilter}
            onChange={(event) => setCaretakerFilter(event.target.value)}
            placeholder="Search by caretaker"
          />
        </label>
      </div>
      <div className="admin-tabs" role="tablist" aria-label="Review rating">
        {ratingTabs.map((rating) => (
          <button
            key={rating}
            type="button"
            role="tab"
            id={`admin-review-rating-tab-${rating}`}
            aria-controls="admin-review-rating-panel"
            aria-selected={activeRating === rating}
            className={activeRating === rating ? 'active' : undefined}
            onClick={() => setActiveRating(rating)}
          >
            {rating} star
            <span className="admin-tab-count">{reviewsByRating[rating].length}</span>
          </button>
        ))}
      </div>
      <div
        className="admin-tab-panel"
        id="admin-review-rating-panel"
        role="tabpanel"
        aria-labelledby={`admin-review-rating-tab-${activeRating}`}
      >
        {visibleReviews.length === 0 ? (
          <EmptyState
            title={emptyTitle}
            message={
              hasFilters
                ? 'Try a different rating, owner, or caretaker name.'
                : 'Reviews will appear here after customers complete bookings.'
            }
          />
        ) : (
          <div className="admin-review-list">
            {visibleReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
