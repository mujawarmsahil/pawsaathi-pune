import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { endpoints } from '../../../api/endpoints';
import type { AdminBookingSummary } from '../../../types/api';
import { BookingCard, type BookingCardModel } from '../../booking/BookingCard';
import { EmptyState, ErrorState } from '../../common/feedback/FeedbackStates';

type BookingTab = 'ongoing' | 'completed' | 'cancelled';

const bookingTabs: { key: BookingTab; label: string }[] = [
  { key: 'ongoing', label: 'Ongoing bookings' },
  { key: 'completed', label: 'Completed bookings' },
  { key: 'cancelled', label: 'Cancelled bookings' },
];

const completedBookingStatuses = new Set(['COMPLETED']);
const cancelledBookingStatuses = new Set(['CANCELLED', 'REJECTED', 'REFUNDED']);

function bookingTabForStatus(status: string): BookingTab {
  if (completedBookingStatuses.has(status)) return 'completed';
  if (cancelledBookingStatuses.has(status)) return 'cancelled';
  return 'ongoing';
}

function toBookingCardModel(booking: AdminBookingSummary): BookingCardModel {
  return {
    id: booking.id,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    cancellationReason: booking.cancellationReason,
    rating: booking.rating ?? null,
    review: booking.review ?? null,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    durationMinutes: booking.durationMinutes,
    serviceName: booking.serviceName,
    pet: {
      name: booking.petName,
      photoUrl: booking.petPhotoUrl,
      species: booking.petSpecies,
      breed: booking.petBreed,
      ageYears: booking.petAgeYears,
      notes: booking.petNotes,
      foodNotes: booking.petFoodNotes,
    },
    owner: {
      label: 'Owner',
      name: booking.customerName,
      email: booking.customerEmail,
      phone: booking.customerPhone,
      photoUrl: booking.customerPhotoUrl,
    },
    caretaker: {
      label: 'Caretaker',
      name: booking.caretakerName,
      email: booking.caretakerEmail,
      phone: booking.caretakerPhone,
      photoUrl: booking.caretakerPhotoUrl,
    },
    hourlyRate: booking.hourlyRate,
    totalAmount: booking.totalAmount,
    detailsHref: `/admin/bookings/${booking.id}`,
  };
}

function matchesSearch(booking: AdminBookingSummary, query: string) {
  const searchableText = [
    booking.customerName,
    booking.customerEmail,
    booking.customerPhone,
    booking.caretakerName,
    booking.caretakerEmail,
    booking.caretakerPhone,
    booking.petName,
    booking.serviceName,
  ]
    .join(' ')
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => searchableText.includes(term));
}

export function BookingsPage() {
  const [activeTab, setActiveTab] = useState<BookingTab>('ongoing');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const bookingsQuery = useQuery({
    queryKey: ['admin', 'bookings'],
    queryFn: endpoints.admin.bookings,
  });
  const trimmedSearchQuery = searchQuery.trim();

  const matchingBookings = useMemo(() => {
    const allBookings = bookingsQuery.data ?? [];
    return trimmedSearchQuery
      ? allBookings.filter((booking) => matchesSearch(booking, trimmedSearchQuery))
      : allBookings;
  }, [bookingsQuery.data, trimmedSearchQuery]);

  const bookingsByTab = useMemo(() => {
    const groupedBookings: Record<BookingTab, AdminBookingSummary[]> = {
      ongoing: [],
      completed: [],
      cancelled: [],
    };
    matchingBookings.forEach((booking) => {
      groupedBookings[bookingTabForStatus(booking.status)].push(booking);
    });
    return groupedBookings;
  }, [matchingBookings]);

  const visibleBookings = useMemo(
    () =>
      [...bookingsByTab[activeTab]].sort((first, second) => {
        const dateDifference =
          new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime();
        return (sortOrder === 'newest' ? -dateDifference : dateDifference) || second.id - first.id;
      }),
    [activeTab, bookingsByTab, sortOrder],
  );

  if (bookingsQuery.isError)
    return (
      <ErrorState
        message={bookingsQuery.error.message}
        onRetry={() => void bookingsQuery.refetch()}
      />
    );

  const totalBookings = bookingsQuery.data?.length ?? 0;
  const emptyTitle = trimmedSearchQuery
    ? matchingBookings.length === 0
      ? 'No matching bookings'
      : `No matching ${activeTab} bookings`
    : totalBookings === 0
      ? 'No bookings yet'
      : `No ${activeTab} bookings`;
  const emptyMessage = trimmedSearchQuery
    ? `No ${activeTab} bookings match “${trimmedSearchQuery}”.`
    : totalBookings === 0
      ? 'Bookings will appear here when customers make a request.'
      : {
          ongoing: 'No bookings are currently in progress or awaiting action.',
          completed: 'No bookings have been completed yet.',
          cancelled: 'No bookings have been cancelled.',
        }[activeTab];

  return (
    <>
      <p className="eyebrow">Administration</p>
      <h1>Bookings</h1>
      <div className="admin-filter admin-bookings-filters">
        <label htmlFor="admin-booking-search">
          Search bookings
          <input
            id="admin-booking-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Owner, caretaker, pet, or service"
          />
        </label>
        <label htmlFor="admin-booking-sort">
          Sort by time slot
          <select
            id="admin-booking-sort"
            value={sortOrder}
            onChange={(event) =>
              setSortOrder(event.target.value === 'oldest' ? 'oldest' : 'newest')
            }
          >
            <option value="newest">Latest first</option>
            <option value="oldest">Earliest first</option>
          </select>
        </label>
      </div>
      <div className="admin-tabs" role="tablist" aria-label="Booking status">
        {bookingTabs.map((bookingTab) => (
          <button
            key={bookingTab.key}
            type="button"
            role="tab"
            id={`admin-booking-tab-${bookingTab.key}`}
            aria-controls="admin-booking-tab-panel"
            aria-selected={activeTab === bookingTab.key}
            className={activeTab === bookingTab.key ? 'active' : undefined}
            onClick={() => setActiveTab(bookingTab.key)}
          >
            {bookingTab.label}
            <span className="admin-tab-count">{bookingsByTab[bookingTab.key].length}</span>
          </button>
        ))}
      </div>
      <div
        className="admin-tab-panel"
        id="admin-booking-tab-panel"
        role="tabpanel"
        aria-labelledby={`admin-booking-tab-${activeTab}`}
      >
        {!bookingsQuery.isPending && (
          <p className="admin-booking-result-count" aria-live="polite">
            {visibleBookings.length} booking{visibleBookings.length === 1 ? '' : 's'}
          </p>
        )}
        {bookingsQuery.isPending ? (
          <div
            className="booking-card-grid"
            role="status"
            aria-label="Loading bookings"
            aria-busy="true"
          >
            {['first', 'second', 'third'].map((key) => (
              <BookingCard isLoading key={key} />
            ))}
          </div>
        ) : visibleBookings.length === 0 ? (
          <EmptyState title={emptyTitle} message={emptyMessage} />
        ) : (
          <div className="booking-card-grid" role="list">
            {visibleBookings.map((booking) => (
              <BookingCard
                booking={toBookingCardModel(booking)}
                detailsLabel="View"
                key={booking.id}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
