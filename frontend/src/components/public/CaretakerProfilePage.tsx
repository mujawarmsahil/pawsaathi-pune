import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, MapPin, ShieldCheck, Star } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { endpoints } from '../../api/endpoints';
import { useAuthContext } from '../../hooks/useAuthContext';
import { useBookings } from '../../hooks/useBookings';
import { useCaretaker, useServices } from '../../hooks/useCaretakerData';
import { usePets } from '../../hooks/usePets';
import { formatINR } from '../../utils';
import { EmptyState, ErrorState, LoadingState } from '../common/feedback/FeedbackStates';
import { ProfileImage } from '../common/ui/ProfileImage';

export function CaretakerProfilePage() {
  const { id = '' } = useParams();
  const { user } = useAuthContext();
  const caretakerId = Number(id);
  const caretakerProfileQuery = useCaretaker(caretakerId);
  const servicesQuery = useServices();
  const petsQuery = usePets(user?.role === 'CUSTOMER');
  const bookingsQuery = useBookings(user?.role === 'CUSTOMER');
  const queryClient = useQueryClient();
  const createBookingMutation = useMutation({
    mutationFn: endpoints.bookings.create,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  });
  if (caretakerProfileQuery.isPending)
    return (
      <main className="container profile-page">
        <LoadingState label="Loading caretaker profile…" />
      </main>
    );
  if (caretakerProfileQuery.isError)
    return (
      <main className="container profile-page">
        <ErrorState
          message={caretakerProfileQuery.error.message}
          onRetry={() => void caretakerProfileQuery.refetch()}
        />
      </main>
    );
  if (!caretakerProfileQuery.data)
    return (
      <main className="container profile-page">
        <EmptyState
          title="Caretaker not found"
          message="This profile may no longer be available."
          action={<Link to="/caretakers">Browse caretakers</Link>}
        />
      </main>
    );
  const completedBookings =
    bookingsQuery.data?.filter((booking) => booking.status === 'COMPLETED') ?? [];
  return (
    <main className="container profile-page">
      <Link className="back-link" to="/caretakers">
        ← All caretakers
      </Link>
      <section className="profile-layout">
        <article className="profile-summary">
          <ProfileImage
            className="profile-photo"
            src={caretakerProfileQuery.data.photoUrl}
            name={caretakerProfileQuery.data.name}
            loading="eager"
          />
          <div className="profile-copy">
            <span className="verified inline">
              <ShieldCheck size={14} /> Approved caretaker
            </span>
            <h1>{caretakerProfileQuery.data.name}</h1>
            <div className="rating">
              <Star size={15} fill="currentColor" />
              {caretakerProfileQuery.data.rating
                ? Number(caretakerProfileQuery.data.rating).toFixed(1)
                : 'New'}{' '}
              <small>· {caretakerProfileQuery.data.reviewCount} reviews</small>
            </div>
            <p>{caretakerProfileQuery.data.bio || 'A caring local companion for your pet.'}</p>
            <div className="profile-meta">
              <span>
                <MapPin size={15} />
                {caretakerProfileQuery.data.serviceAreas}
              </span>
              <span>{caretakerProfileQuery.data.experienceYears ?? 0} years experience</span>
            </div>
          </div>
          <div className="profile-reviews">
            <h2>Reviews</h2>
            <p>
              {caretakerProfileQuery.data.reviewCount
                ? `Rated ${caretakerProfileQuery.data.rating ?? '—'} by ${caretakerProfileQuery.data.reviewCount} pet parents.`
                : 'No reviews yet. Completed booking reviews will appear here.'}
            </p>
          </div>
        </article>
        <aside className="booking-panel">
          <p className="eyebrow">Request care</p>
          <h2>Plan a visit</h2>
          <p className="price">
            ₹{formatINR(caretakerProfileQuery.data.hourlyRate)} <small>/ hour</small>
          </p>
          {!user ? (
            <div className="alert">
              Please <Link to="/login">log in</Link> as a pet parent to request a booking.
            </div>
          ) : user.role !== 'CUSTOMER' ? (
            <div className="alert">Booking requests are available to customer accounts.</div>
          ) : petsQuery.isPending ? (
            <LoadingState label="Loading your pets…" />
          ) : petsQuery.isError ? (
            <ErrorState
              message={petsQuery.error.message}
              onRetry={() => void petsQuery.refetch()}
            />
          ) : (petsQuery.data?.length ?? 0) === 0 ? (
            <EmptyState
              title="Add a pet first"
              message="A pet profile is needed before you can request care."
              action={<Link to="/app/pets">Manage pets</Link>}
            />
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const bookingFormData = new FormData(event.currentTarget);
                const bookingStartsAt = `${String(bookingFormData.get('date'))}T${String(bookingFormData.get('time'))}`;
                const bookingDurationHours = Number(bookingFormData.get('duration'));
                const bookingStartDate = new Date(bookingStartsAt);
                const bookingEndDate = new Date(
                  bookingStartDate.getTime() + bookingDurationHours * 60 * 60 * 1000,
                );
                void createBookingMutation.mutate({
                  caretakerId: caretakerProfileQuery.data.id,
                  petId: Number(bookingFormData.get('petId')),
                  serviceId: Number(bookingFormData.get('serviceId')),
                  startsAt: bookingStartsAt,
                  endsAt: `${bookingEndDate.getFullYear()}-${String(bookingEndDate.getMonth() + 1).padStart(2, '0')}-${String(bookingEndDate.getDate()).padStart(2, '0')}T${String(bookingEndDate.getHours()).padStart(2, '0')}:${String(bookingEndDate.getMinutes()).padStart(2, '0')}`,
                  location: String(bookingFormData.get('location')),
                  notes: String(bookingFormData.get('notes') ?? ''),
                });
              }}
            >
              <label htmlFor="booking-pet">Your pet</label>
              <select id="booking-pet" name="petId" required>
                {petsQuery.data?.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name}
                  </option>
                ))}
              </select>
              <label htmlFor="booking-service">Service</label>
              <select id="booking-service" name="serviceId" required>
                {(caretakerProfileQuery.data.services ?? servicesQuery.data ?? []).map(
                  (service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ),
                )}
              </select>
              <div className="date-time">
                <div>
                  <label htmlFor="booking-date">Date</label>
                  <input
                    id="booking-date"
                    name="date"
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="booking-time">Start time</label>
                  <input id="booking-time" name="time" type="time" required />
                </div>
              </div>
              <label htmlFor="booking-duration">Duration</label>
              <select id="booking-duration" name="duration">
                <option value="1">1 hour</option>
                <option value="2">2 hours</option>
                <option value="4">4 hours</option>
              </select>
              <label htmlFor="booking-location">Pune address / area</label>
              <input id="booking-location" name="location" maxLength={250} required />
              <label htmlFor="booking-notes">Notes for caretaker</label>
              <textarea id="booking-notes" name="notes" rows={3} maxLength={2000} />
              <button className="button full-button" disabled={createBookingMutation.isPending}>
                {createBookingMutation.isPending ? 'Sending request…' : 'Send booking request'}{' '}
                <ArrowRight size={16} />
              </button>
              {createBookingMutation.isError && (
                <p className="form-error" role="alert">
                  {createBookingMutation.error.message}
                </p>
              )}
              {createBookingMutation.isSuccess && (
                <p className="success" role="status">
                  Booking request sent. Follow its status from your bookings.
                </p>
              )}
            </form>
          )}
        </aside>
      </section>
      <section className="profile-bookings">
        <h2>Your completed bookings with this caretaker</h2>
        {completedBookings.length === 0 ? (
          <p>Reviews can be added after a completed booking.</p>
        ) : (
          <p>You have {completedBookings.length} completed booking(s) eligible for review.</p>
        )}
      </section>
    </main>
  );
}
