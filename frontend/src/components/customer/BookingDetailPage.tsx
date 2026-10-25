import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';

import { endpoints } from '../../api/endpoints';
import { useBookings } from '../../hooks/useBookings';
import { formatDateTime, formatINR, getBookingDisplayName } from '../../utils';
import { EmptyState, ErrorState, LoadingState } from '../common/feedback/FeedbackStates';
import { RatingStars } from '../common/ui/RatingStars';
import { StatusBadge } from '../common/ui/StatusBadge';

export function BookingDetailPage() {
  const { id = '' } = useParams();
  const bookingsQuery = useBookings();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const reviewSchema = z.object({
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().max(2000).optional(),
  });
  const { register, handleSubmit } = useForm<
    z.input<typeof reviewSchema>,
    unknown,
    z.output<typeof reviewSchema>
  >({ resolver: zodResolver(reviewSchema) });
  const reviewMutation = useMutation({
    mutationFn: (
      reviewPayload: z.infer<typeof reviewSchema> & { bookingId: number; caretakerId: number },
    ) => endpoints.reviews.create(reviewPayload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  });
  if (bookingsQuery.isPending) return <LoadingState label="Loading booking details…" />;
  if (bookingsQuery.isError)
    return (
      <ErrorState
        message={bookingsQuery.error.message}
        onRetry={() => void bookingsQuery.refetch()}
      />
    );
  const booking = bookingsQuery.data.find((entry) => entry.id === Number(id));
  if (!booking)
    return (
      <EmptyState
        title="Booking not found"
        message="This booking is not available in your account."
      />
    );
  return (
    <section className="profile-setup">
      <Link className="back-link" to="/app/bookings">
        ← Your bookings
      </Link>
      <p className="eyebrow">Booking #{booking.id}</p>
      <h1>{getBookingDisplayName(booking, 'service')}</h1>
      <StatusBadge status={booking.status} />
      <p>
        {formatDateTime(booking.startsAt)} – {new Date(booking.endsAt).toLocaleTimeString('en-IN')}
      </p>
      <p>
        Pet: {getBookingDisplayName(booking, 'pet')} · Caretaker:{' '}
        {getBookingDisplayName(booking, 'caretaker')}
      </p>
      <p>₹{formatINR(booking.hourlyRate)} per hour</p>
      {['CANCELLED', 'REJECTED', 'REFUNDED'].includes(booking.status) && (
        <div className="booking-card-cancellation">
          <span className="booking-card-popover-label">
            {booking.status === 'REJECTED' ? 'Decline reason' : 'Cancellation reason'}
          </span>
          <p>{booking.cancellationReason?.trim() || 'No cancellation reason recorded.'}</p>
        </div>
      )}
      <div className="status-timeline">
        <h2>Booking timeline</h2>
        <ol>
          <li>
            <strong>Booking status</strong>
            <span>{booking.status.replaceAll('_', ' ').toLowerCase()}</span>
          </li>
        </ol>
      </div>
      {booking.status === 'COMPLETED' && booking.rating != null && (
        <section className="booking-review-panel">
          <h2>Your review</h2>
          <RatingStars rating={booking.rating} />
          {booking.review?.trim() ? (
            <p>"{booking.review.trim()}"</p>
          ) : (
            <p className="admin-muted">No written review.</p>
          )}
        </section>
      )}
      {booking.status === 'COMPLETED' && booking.caretakerId && booking.rating == null && (
        <form
          className="profile-setup"
          onSubmit={handleSubmit((reviewValues) => {
            setError('');
            reviewMutation.mutate(
              { ...reviewValues, bookingId: booking.id, caretakerId: booking.caretakerId! },
              { onError: (cause) => setError(cause.message) },
            );
          })}
        >
          <h2>Share your experience</h2>
          <label htmlFor="review-rating">Rating</label>
          <select id="review-rating" {...register('rating', { valueAsNumber: true })}>
            <option value="5">5 — Excellent</option>
            <option value="4">4 — Good</option>
            <option value="3">3 — Okay</option>
            <option value="2">2 — Poor</option>
            <option value="1">1 — Very poor</option>
          </select>
          <label htmlFor="review-comment">Review</label>
          <textarea id="review-comment" rows={3} maxLength={2000} {...register('comment')} />
          <button className="button" disabled={reviewMutation.isPending}>
            Submit review
          </button>
          {reviewMutation.isSuccess && (
            <p role="status" className="success">
              Thank you for sharing your review.
            </p>
          )}
          {error && (
            <p role="alert" className="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
