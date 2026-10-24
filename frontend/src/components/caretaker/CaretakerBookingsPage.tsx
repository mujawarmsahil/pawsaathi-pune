import { useQuery } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { endpoints } from '../../api/endpoints';
import { useBookingMutations, useBookings } from '../../hooks/useBookings';
import type { Booking } from '../../types/api';
import { formatDateTime, formatINR } from '../../utils';
import { EmptyState, ErrorState, LoadingState } from '../common/feedback/FeedbackStates';
import { StatusBadge } from '../common/ui/StatusBadge';

function CaretakerBookingCard({ booking }: { booking: Booking }) {
  const { updateStatus } = useBookingMutations();
  const [bookingStatusError, setBookingStatusError] = useState('');
  function changeBookingStatus(status: string) {
    updateStatus.mutate(
      { id: booking.id, status },
      { onError: (cause) => setBookingStatusError(cause.message) },
    );
  }
  return (
    <article className="booking-row">
      <div className="booking-date">
        <CalendarDays size={17} />
      </div>
      <div className="booking-info">
        <b>
          {booking.serviceName ?? booking.service_name ?? 'Pet care'} ·{' '}
          {booking.petName ?? booking.pet_name ?? 'Pet'}
        </b>
        <span>
          {booking.customerName ?? booking.customer_name ?? 'Customer'} ·{' '}
          {formatDateTime(booking.startsAt)} · ₹{formatINR(booking.hourlyRate)}/hr
        </span>
      </div>
      <StatusBadge status={booking.status} />
      {booking.status === 'CONFIRMED' && (
        <div className="booking-actions">
          <button disabled={updateStatus.isPending} onClick={() => changeBookingStatus('ACCEPTED')}>
            Accept
          </button>
          <button disabled={updateStatus.isPending} onClick={() => changeBookingStatus('REJECTED')}>
            Decline
          </button>
        </div>
      )}
      {booking.status === 'ACCEPTED' && (
        <button className="button button-small" onClick={() => changeBookingStatus('IN_PROGRESS')}>
          Start visit
        </button>
      )}
      {booking.status === 'IN_PROGRESS' && (
        <button className="button button-small" onClick={() => changeBookingStatus('COMPLETED')}>
          Complete
        </button>
      )}
      {bookingStatusError && <span className="form-error">{bookingStatusError}</span>}
    </article>
  );
}

export function CaretakerBookingsPage() {
  const bookingsQuery = useBookings();
  const caretakerProfileQuery = useQuery({
    queryKey: ['caretaker', 'profile'],
    queryFn: endpoints.caretakerSetup.profile,
  });
  if (bookingsQuery.isPending || caretakerProfileQuery.isPending)
    return <LoadingState label="Loading your caretaker dashboard…" />;
  if (bookingsQuery.isError)
    return (
      <ErrorState
        message={bookingsQuery.error.message}
        onRetry={() => void bookingsQuery.refetch()}
      />
    );
  if (caretakerProfileQuery.isError)
    return (
      <ErrorState
        message={caretakerProfileQuery.error.message}
        onRetry={() => void caretakerProfileQuery.refetch()}
      />
    );
  if (!caretakerProfileQuery.data.bio?.trim())
    return <Navigate to="/caretaker/onboarding" replace />;
  return (
    <>
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Caretaker space</p>
          <h1>Booking requests</h1>
          <p>Review new requests and manage your upcoming visits.</p>
        </div>
        <Link className="button button-small" to="/caretaker/onboarding">
          Profile & availability
        </Link>
      </div>
      {bookingsQuery.data.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          message="Complete your caretaker profile and set availability so local pet parents can find you."
          action={
            <Link className="button" to="/caretaker/onboarding">
              Complete onboarding
            </Link>
          }
        />
      ) : (
        <div className="booking-list">
          {bookingsQuery.data.map((booking) => (
            <CaretakerBookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </>
  );
}
