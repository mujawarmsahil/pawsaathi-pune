import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Mail, MapPin, PawPrint, Phone } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

import { endpoints } from '../../../api/endpoints';
import {
  formatAdminDate,
  formatAdminTime,
  formatAge,
  formatDuration,
  formatINR,
} from '../../../utils';
import { EmptyState, ErrorState, LoadingState } from '../../common/feedback/FeedbackStates';
import { ProfileImage } from '../../common/ui/ProfileImage';
import { RatingStars } from '../../common/ui/RatingStars';
import { StatusBadge } from '../../common/ui/StatusBadge';

export function BookingDetailPage() {
  const { id } = useParams();
  const { hash } = useLocation();
  const bookingId = Number(id);
  const bookingDetailQuery = useQuery({
    queryKey: ['admin', 'booking', bookingId],
    queryFn: () => endpoints.admin.bookingDetail(bookingId),
    enabled: Number.isFinite(bookingId),
  });
  useEffect(() => {
    if (!hash || bookingDetailQuery.isPending) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [bookingDetailQuery.isPending, hash]);
  if (!Number.isFinite(bookingId))
    return (
      <EmptyState
        title="Booking not found"
        message="The requested booking does not exist."
        action={<Link to="/admin/caretakers">Back to caretakers</Link>}
      />
    );
  if (bookingDetailQuery.isPending) return <LoadingState label="Loading booking details…" />;
  if (bookingDetailQuery.isError)
    return (
      <ErrorState
        message={bookingDetailQuery.error.message}
        onRetry={() => void bookingDetailQuery.refetch()}
      />
    );
  const bookingDetail = bookingDetailQuery.data;
  const petSummary = [
    bookingDetail.pet.species,
    bookingDetail.pet.breed,
    formatAge(bookingDetail.pet.ageYears),
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <>
      <Link className="back-link" to={`/admin/caretakers/${bookingDetail.caretaker.id}`}>
        ← Back to {bookingDetail.caretaker.name}
      </Link>
      <section className="admin-booking-detail">
        <div className="admin-booking-detail-hero">
          <div>
            <p className="eyebrow">Booking #{bookingDetail.id}</p>
            <h1>{bookingDetail.serviceName}</h1>
            <p>
              <CalendarDays size={14} /> {formatAdminDate(bookingDetail.startsAt)} ·{' '}
              {formatAdminTime(bookingDetail.startsAt)}–{formatAdminTime(bookingDetail.endsAt)}
            </p>
          </div>
          <StatusBadge status={bookingDetail.status} />
        </div>
        <div className="admin-booking-detail-content">
          <div className="admin-booking-detail-main">
            <section className="admin-profile-section" id="customer">
              <h2>Customer</h2>
              <div className="admin-booking-person">
                <ProfileImage
                  className="admin-booking-person-photo"
                  name={bookingDetail.customer.name}
                />
                <div className="admin-booking-person-copy">
                  <b>{bookingDetail.customer.name}</b>
                  <a href={`mailto:${bookingDetail.customer.email}`}>
                    <Mail size={15} /> {bookingDetail.customer.email}
                  </a>
                  {bookingDetail.customer.phone ? (
                    <a href={`tel:${bookingDetail.customer.phone}`}>
                      <Phone size={15} /> {bookingDetail.customer.phone}
                    </a>
                  ) : (
                    <span>
                      <Phone size={15} /> Phone not provided
                    </span>
                  )}
                </div>
              </div>
              <Link className="text-link" to={`/admin/customers/${bookingDetail.customer.id}`}>
                View customer profile
              </Link>
            </section>
            <section className="admin-profile-section" id="pet">
              <h2>Pet</h2>
              <div className="admin-booking-person">
                {bookingDetail.pet.photoUrl ? (
                  <img
                    className="admin-booking-pet-photo"
                    src={bookingDetail.pet.photoUrl}
                    alt={`${bookingDetail.pet.name} pet photo`}
                  />
                ) : (
                  <span className="admin-booking-pet-photo admin-booking-pet-placeholder">
                    <PawPrint size={30} aria-hidden="true" />
                  </span>
                )}
                <div className="admin-booking-person-copy">
                  <b>{bookingDetail.pet.name}</b>
                  <p>{petSummary}</p>
                  <p>
                    {bookingDetail.pet.foodNotes
                      ? `Food: ${bookingDetail.pet.foodNotes}`
                      : 'No feeding notes provided.'}
                  </p>
                  <p>{bookingDetail.pet.notes || 'No pet care notes provided.'}</p>
                </div>
              </div>
            </section>
            <section className="admin-profile-section">
              <h2>Schedule</h2>
              <div className="admin-booking-schedule">
                <div>
                  <span>Date</span>
                  <b>{formatAdminDate(bookingDetail.startsAt)}</b>
                </div>
                <div>
                  <span>Starts</span>
                  <b>{formatAdminTime(bookingDetail.startsAt)}</b>
                </div>
                <div>
                  <span>Ends</span>
                  <b>{formatAdminTime(bookingDetail.endsAt)}</b>
                </div>
                <div>
                  <span>Duration</span>
                  <b>{formatDuration(bookingDetail.durationMinutes)}</b>
                </div>
              </div>
              <p className="admin-booking-location">
                <MapPin size={15} /> {bookingDetail.location || 'Service location not provided'}
              </p>
            </section>
            <section className="admin-profile-section">
              <h2>Instructions</h2>
              <p>{bookingDetail.notes || 'No notes were added to this booking.'}</p>
            </section>
            {bookingDetail.status === 'COMPLETED' && bookingDetail.rating != null && (
              <section className="admin-profile-section">
                <h2>Customer review</h2>
                <RatingStars rating={bookingDetail.rating} />
                {bookingDetail.review?.trim() ? (
                  <p>"{bookingDetail.review.trim()}"</p>
                ) : (
                  <p className="admin-muted">No written review.</p>
                )}
              </section>
            )}
            {['CANCELLED', 'REJECTED', 'REFUNDED'].includes(bookingDetail.status) && (
              <section className="admin-profile-section">
                <h2>
                  {bookingDetail.status === 'REJECTED' ? 'Decline reason' : 'Cancellation reason'}
                </h2>
                <p>{bookingDetail.cancellationReason || 'No cancellation reason recorded.'}</p>
              </section>
            )}
          </div>
          <aside className="admin-booking-detail-side">
            <section>
              <h2>Service</h2>
              <b>{bookingDetail.serviceName}</b>
              <p>{bookingDetail.serviceDescription || 'No service description available.'}</p>
              <dl className="admin-facts">
                <div>
                  <dt>Hourly rate</dt>
                  <dd>₹{formatINR(bookingDetail.hourlyRate)}</dd>
                </div>
                <div>
                  <dt>Booking total</dt>
                  <dd>₹{formatINR(bookingDetail.totalAmount)}</dd>
                </div>
                <div>
                  <dt>Booked on</dt>
                  <dd>{formatAdminDate(bookingDetail.createdAt)}</dd>
                </div>
              </dl>
            </section>
            <section>
              <h2>Payment</h2>
              {bookingDetail.payment ? (
                <div className="admin-booking-payment">
                  <StatusBadge status={bookingDetail.payment.status} />
                  <b>
                    ₹{formatINR(bookingDetail.payment.amount)} {bookingDetail.payment.currency}
                  </b>
                </div>
              ) : (
                <p className="admin-muted">No payment recorded for this booking.</p>
              )}
            </section>
            <section id="caretaker">
              <h2>Caretaker</h2>
              <div className="admin-booking-person-copy">
                <b>{bookingDetail.caretaker.name}</b>
                <a href={`mailto:${bookingDetail.caretaker.email}`}>
                  <Mail size={15} /> {bookingDetail.caretaker.email}
                </a>
                {bookingDetail.caretaker.phone ? (
                  <a href={`tel:${bookingDetail.caretaker.phone}`}>
                    <Phone size={15} /> {bookingDetail.caretaker.phone}
                  </a>
                ) : (
                  <span>
                    <Phone size={15} /> Phone not provided
                  </span>
                )}
              </div>
              <Link className="text-link" to={`/admin/caretakers/${bookingDetail.caretaker.id}`}>
                View caretaker profile
              </Link>
            </section>
          </aside>
        </div>
      </section>
    </>
  );
}
