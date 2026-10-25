import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { endpoints } from '../../api/endpoints';
import { useAuthContext } from '../../hooks/useAuthContext';
import { useBookingMutations, useBookings } from '../../hooks/useBookings';
import type { Booking } from '../../types/api';
import { getBookingDisplayName } from '../../utils';
import { BookingCard, type BookingCardModel } from '../booking/BookingCard';
import { EmptyState, ErrorState } from '../common/feedback/FeedbackStates';
import { ReasonDialog } from '../common/ui/ReasonDialog';

type RazorpayPaymentResult = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (result: RazorpayPaymentResult) => void;
  modal: { ondismiss: () => void };
  prefill: { name?: string; email?: string };
  theme: { color: string };
};

type RazorpayInstance = { open: () => void };

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

let razorpayCheckoutScriptPromise: Promise<void> | undefined;

function loadRazorpayCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  razorpayCheckoutScriptPromise ??= new Promise((resolve, reject) => {
    const checkoutScriptElement = document.createElement('script');
    checkoutScriptElement.src = 'https://checkout.razorpay.com/v1/checkout.js';
    checkoutScriptElement.async = true;
    checkoutScriptElement.onload = () => resolve();
    checkoutScriptElement.onerror = () => {
      razorpayCheckoutScriptPromise = undefined;
      reject(new Error('Payment checkout could not be loaded. Please try again.'));
    };
    document.head.append(checkoutScriptElement);
  });
  return razorpayCheckoutScriptPromise;
}

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
    serviceName: getBookingDisplayName(booking, 'service'),
    pet: {
      name: getBookingDisplayName(booking, 'pet'),
      photoUrl: booking.petPhotoUrl,
      species: booking.petSpecies,
      breed: booking.petBreed,
      ageYears: booking.petAgeYears,
      notes: booking.petNotes,
      foodNotes: booking.petFoodNotes,
    },
    owner: {
      label: 'Owner',
      name: booking.customerName ?? booking.customer_name ?? 'You',
      email: booking.customerEmail,
      phone: booking.customerPhone,
      photoUrl: booking.customerPhotoUrl,
    },
    caretaker: {
      label: 'Caretaker',
      name: getBookingDisplayName(booking, 'caretaker'),
      email: booking.caretakerEmail,
      phone: booking.caretakerPhone,
      photoUrl: booking.caretakerPhotoUrl,
      href: booking.caretakerId ? `/caretakers/${booking.caretakerId}` : undefined,
    },
    hourlyRate: booking.hourlyRate,
    detailsHref: `/app/bookings/${booking.id}`,
  };
}

function BookingPaymentButton({ booking }: { booking: Booking }) {
  const [error, setError] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const user = useAuthContext().user;
  const queryClient = useQueryClient();
  const paymentMutation = useMutation({
    mutationFn: async () => {
      const paymentOrder = await endpoints.payments.createOrder({ bookingId: booking.id });
      await loadRazorpayCheckout();
      if (!window.Razorpay) throw new Error('Payment checkout is unavailable.');
      setIsCheckoutOpen(true);
      let hasSubmittedPayment = false;
      new window.Razorpay({
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'PawSaathi Pune',
        description: `Booking #${booking.id}`,
        order_id: paymentOrder.orderId,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#176b64' },
        modal: {
          ondismiss: () => {
            if (!hasSubmittedPayment) {
              setIsCheckoutOpen(false);
              setError('Payment was not completed.');
            }
          },
        },
        handler: (paymentResult) => {
          hasSubmittedPayment = true;
          void endpoints.payments
            .verify({
              bookingId: booking.id,
              razorpayOrderId: paymentResult.razorpay_order_id,
              razorpayPaymentId: paymentResult.razorpay_payment_id,
              razorpaySignature: paymentResult.razorpay_signature,
            })
            .then(() => queryClient.invalidateQueries({ queryKey: ['bookings'] }))
            .then(() => setIsCheckoutOpen(false))
            .catch((cause: unknown) => {
              setIsCheckoutOpen(false);
              setError(cause instanceof Error ? cause.message : 'Payment verification failed.');
            });
        },
      }).open();
    },
  });
  return (
    <span>
      <button
        className="button button-small"
        disabled={paymentMutation.isPending || isCheckoutOpen}
        onClick={() => {
          setError('');
          paymentMutation.mutate(undefined, { onError: (cause) => setError(cause.message) });
        }}
      >
        {paymentMutation.isPending
          ? 'Starting…'
          : isCheckoutOpen
            ? 'Checkout open…'
            : 'Pay securely'}
      </button>
      {error && <span className="form-error">{error}</span>}
    </span>
  );
}

export function CustomerBookingsPage() {
  const bookingsQuery = useBookings();
  const { updateStatus } = useBookingMutations();
  const [cancellationTarget, setCancellationTarget] = useState<Booking | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellationError, setCancellationError] = useState('');
  if (bookingsQuery.isError)
    return (
      <ErrorState
        message={bookingsQuery.error.message}
        onRetry={() => void bookingsQuery.refetch()}
      />
    );
  return (
    <>
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Your PawSaathi space</p>
          <h1>Your bookings</h1>
          <p>Follow each visit from request through completion.</p>
        </div>
        <Link className="button button-small" to="/caretakers">
          Find care
        </Link>
      </div>
      {bookingsQuery.isPending ? (
        <div
          className="booking-card-grid"
          role="status"
          aria-label="Loading your bookings"
          aria-busy="true"
        >
          {['first', 'second', 'third'].map((key) => (
            <BookingCard isLoading key={key} />
          ))}
        </div>
      ) : bookingsQuery.data.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          message="Explore approved local caretakers and send your first request."
          action={
            <Link className="button" to="/caretakers">
              Find a caretaker
            </Link>
          }
        />
      ) : (
        <div className="booking-card-grid" role="list">
          {bookingsQuery.data.map((booking) => (
            <BookingCard
              actions={
                <>
                  {booking.status === 'PENDING_PAYMENT' && (
                    <BookingPaymentButton booking={booking} />
                  )}
                  {['REQUESTED', 'ACCEPTED', 'CONFIRMED'].includes(booking.status) && (
                    <span className="muted-label">Rescheduling is coming soon.</span>
                  )}
                  {['PENDING_PAYMENT', 'REQUESTED', 'CONFIRMED'].includes(booking.status) && (
                    <button
                      className="cancel-booking"
                      disabled={updateStatus.isPending}
                      onClick={() => {
                        setCancellationReason('');
                        setCancellationError('');
                        setCancellationTarget(booking);
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </>
              }
              booking={toBookingCardModel(booking)}
              key={booking.id}
            />
          ))}
        </div>
      )}
      <ReasonDialog
        open={cancellationTarget !== null}
        title="Cancel this booking?"
        description="Tell us why you are cancelling. The caretaker and support team will see this reason."
        fieldLabel="Reason for cancellation"
        placeholder="Plans changed, schedule conflict, or another reason"
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        reason={cancellationReason}
        onReasonChange={setCancellationReason}
        busy={updateStatus.isPending}
        error={cancellationError}
        onCancel={() => {
          if (updateStatus.isPending) return;
          setCancellationTarget(null);
          setCancellationError('');
        }}
        onConfirm={() => {
          if (!cancellationTarget) return;
          const reason = cancellationReason.trim();
          if (!reason) return;
          setCancellationError('');
          updateStatus.mutate(
            { id: cancellationTarget.id, status: 'CANCELLED', reason },
            {
              onSuccess: () => {
                setCancellationTarget(null);
                setCancellationReason('');
              },
              onError: (cause) => setCancellationError(cause.message),
            },
          );
        }}
      />
    </>
  );
}
