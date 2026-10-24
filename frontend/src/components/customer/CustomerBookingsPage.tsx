import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { endpoints } from '../../api/endpoints';
import { useAuthContext } from '../../hooks/useAuthContext';
import { useBookingMutations, useBookings } from '../../hooks/useBookings';
import type { Booking } from '../../types/api';
import { formatDateTime, formatINR, getBookingDisplayName } from '../../utils';
import { EmptyState, ErrorState, LoadingState } from '../common/feedback/FeedbackStates';
import { StatusBadge } from '../common/ui/StatusBadge';

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
  const [error, setError] = useState('');
  if (bookingsQuery.isPending) return <LoadingState label="Loading your bookings…" />;
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
      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}
      {bookingsQuery.data.length === 0 ? (
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
        <div className="booking-list">
          {bookingsQuery.data.map((booking) => (
            <article className="booking-row" key={booking.id}>
              <div className="booking-date">
                <CalendarDays size={17} />
                <span>
                  {new Date(booking.startsAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
              <div className="booking-info">
                <b>
                  {getBookingDisplayName(booking, 'service')} ·{' '}
                  {getBookingDisplayName(booking, 'pet')}
                </b>
                <span>
                  with {getBookingDisplayName(booking, 'caretaker')} ·{' '}
                  {formatDateTime(booking.startsAt)} · ₹
                  {formatINR(booking.hourlyRate)}/hr
                </span>
              </div>
              <StatusBadge status={booking.status} />
              <Link className="text-link" to={`/app/bookings/${booking.id}`}>
                Details
              </Link>
              {booking.status === 'PENDING_PAYMENT' && <BookingPaymentButton booking={booking} />}
              {['REQUESTED', 'ACCEPTED', 'CONFIRMED'].includes(booking.status) && (
                <span className="muted-label">Rescheduling is coming soon.</span>
              )}
              {['PENDING_PAYMENT', 'REQUESTED', 'CONFIRMED'].includes(booking.status) && (
                <button
                  className="cancel-booking"
                  disabled={updateStatus.isPending}
                  onClick={() => {
                    if (window.confirm('Cancel this booking request?'))
                      updateStatus.mutate(
                        { id: booking.id, status: 'CANCELLED' },
                        { onError: (cause) => setError(cause.message) },
                      );
                  }}
                >
                  Cancel
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
