import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { endpoints } from '../../api/endpoints';
import { useBookingMutations, useBookings } from '../../hooks/useBookings';
import type { Booking } from '../../types/api';
import { BookingCard, type BookingCardModel } from '../booking/BookingCard';
import { EmptyState, ErrorState } from '../common/feedback/FeedbackStates';
import { ReasonDialog } from '../common/ui/ReasonDialog';

function toBookingCardModel(booking: Booking): BookingCardModel {
  return {
    id: booking.id,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    cancellationReason: booking.cancellationReason,
    rating: booking.rating ?? null,
    review: booking.review ?? null,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    serviceName: booking.serviceName ?? booking.service_name ?? 'Pet care',
    pet: {
      name: booking.petName ?? booking.pet_name ?? 'Pet',
      photoUrl: booking.petPhotoUrl,
      species: booking.petSpecies,
      breed: booking.petBreed,
      ageYears: booking.petAgeYears,
      notes: booking.petNotes,
      foodNotes: booking.petFoodNotes,
    },
    owner: {
      label: 'Owner',
      name: booking.customerName ?? booking.customer_name ?? 'Customer',
      email: booking.customerEmail,
      phone: booking.customerPhone,
      photoUrl: booking.customerPhotoUrl,
    },
    caretaker: {
      label: 'Caretaker',
      name: booking.caretakerName ?? booking.caretaker_name ?? 'Caretaker',
      email: booking.caretakerEmail,
      phone: booking.caretakerPhone,
      photoUrl: booking.caretakerPhotoUrl,
    },
    hourlyRate: booking.hourlyRate,
  };
}

function CaretakerBookingCard({ booking }: { booking: Booking }) {
  const { updateStatus } = useBookingMutations();
  const [bookingStatusError, setBookingStatusError] = useState('');
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  function changeBookingStatus(status: string) {
    updateStatus.mutate(
      { id: booking.id, status },
      { onError: (cause) => setBookingStatusError(cause.message) },
    );
  }
  return (
    <>
      <BookingCard
        actions={
          <>
            {booking.status === 'CONFIRMED' && (
              <div className="booking-actions">
                <button
                  disabled={updateStatus.isPending}
                  onClick={() => changeBookingStatus('ACCEPTED')}
                >
                  Accept
                </button>
                <button
                  disabled={updateStatus.isPending}
                  onClick={() => {
                    setBookingStatusError('');
                    setDeclineReason('');
                    setDeclineDialogOpen(true);
                  }}
                >
                  Decline
                </button>
              </div>
            )}
            {booking.status === 'ACCEPTED' && (
              <button
                className="button button-small"
                disabled={updateStatus.isPending}
                onClick={() => changeBookingStatus('IN_PROGRESS')}
              >
                Start visit
              </button>
            )}
            {booking.status === 'IN_PROGRESS' && (
              <button
                className="button button-small"
                disabled={updateStatus.isPending}
                onClick={() => changeBookingStatus('COMPLETED')}
              >
                Complete
              </button>
            )}
            {bookingStatusError && !declineDialogOpen && (
              <span className="form-error" role="alert">
                {bookingStatusError}
              </span>
            )}
          </>
        }
        booking={toBookingCardModel(booking)}
      />
      <ReasonDialog
        open={declineDialogOpen}
        title="Decline this booking?"
        description="Tell the customer why you cannot take this booking. Your reason will be shared with them and the support team."
        fieldLabel="Reason for declining"
        placeholder="Schedule conflict, outside my service area, or another reason"
        confirmLabel="Decline booking"
        cancelLabel="Keep booking"
        reason={declineReason}
        onReasonChange={setDeclineReason}
        busy={updateStatus.isPending}
        error={bookingStatusError}
        onCancel={() => {
          if (updateStatus.isPending) return;
          setDeclineDialogOpen(false);
          setDeclineReason('');
          setBookingStatusError('');
        }}
        onConfirm={() => {
          const reason = declineReason.trim();
          if (!reason) return;
          setBookingStatusError('');
          updateStatus.mutate(
            { id: booking.id, status: 'REJECTED', reason },
            {
              onSuccess: () => {
                setDeclineDialogOpen(false);
                setDeclineReason('');
              },
              onError: (cause) => setBookingStatusError(cause.message),
            },
          );
        }}
      />
    </>
  );
}

export function CaretakerBookingsPage() {
  const bookingsQuery = useBookings();
  const caretakerProfileQuery = useQuery({
    queryKey: ['caretaker', 'profile'],
    queryFn: endpoints.caretakerSetup.profile,
  });
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
  if (!caretakerProfileQuery.isPending && !caretakerProfileQuery.data.bio?.trim())
    return <Navigate to="/caretaker/onboarding" replace />;
  const bookings = bookingsQuery.data ?? [];
  const isLoading = bookingsQuery.isPending || caretakerProfileQuery.isPending;
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
      {isLoading ? (
        <div
          className="booking-card-grid"
          role="status"
          aria-label="Loading your caretaker dashboard"
          aria-busy="true"
        >
          {['first', 'second', 'third'].map((key) => (
            <BookingCard isLoading key={key} />
          ))}
        </div>
      ) : bookings.length === 0 ? (
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
        <div className="booking-card-grid" role="list">
          {bookings.map((booking) => (
            <CaretakerBookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </>
  );
}
