import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Mail, MapPin, PawPrint, Phone, ShieldCheck, Star } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { endpoints } from '../../../api/endpoints';
import { useToast } from '../../../hooks/useToast';
import {
  formatAdminDate,
  formatAdminTime,
  formatDuration,
  formatINR,
  getCaretakerDecisionMessage,
  getCaretakerDetailActions,
} from '../../../utils';
import { EmptyState, ErrorState } from '../../common/feedback/FeedbackStates';
import { ProfileImage } from '../../common/ui/ProfileImage';
import { StatusBadge } from '../../common/ui/StatusBadge';
import { AdminCaretakerDetailSkeleton } from '../components/AdminCaretakerDetailSkeleton';

export function AdminCaretakerDetailPage() {
  const { id } = useParams();
  const caretakerId = Number(id);
  const queryClient = useQueryClient();
  const toast = useToast();
  const caretakerProfileQuery = useQuery({
    queryKey: ['admin', 'caretaker', caretakerId],
    queryFn: () => endpoints.admin.caretakerDetail(caretakerId),
    enabled: Number.isFinite(caretakerId),
  });
  const showCaretakerBookings =
    caretakerProfileQuery.data?.approvalStatus === 'APPROVED' ||
    caretakerProfileQuery.data?.approvalStatus === 'SUSPENDED';
  const caretakerBookingsQuery = useQuery({
    queryKey: ['admin', 'caretaker', caretakerId, 'bookings'],
    queryFn: () => endpoints.admin.caretakerBookings(caretakerId),
    enabled: Number.isFinite(caretakerId) && showCaretakerBookings,
  });
  const caretakerStatusMutation = useMutation({
    mutationFn: (status: string) => endpoints.admin.updateCaretaker(caretakerId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'caretakers'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'caretaker', caretakerId],
      });
    },
  });
  if (!Number.isFinite(caretakerId))
    return (
      <EmptyState
        title="Caretaker not found"
        message="The requested caretaker profile does not exist."
        action={<Link to="/admin/caretakers">Back to caretakers</Link>}
      />
    );
  if (caretakerProfileQuery.isPending)
    return (
      <>
        <Link className="back-link" to="/admin/caretakers">
          ← Back to caretakers
        </Link>
        <AdminCaretakerDetailSkeleton />
      </>
    );
  if (caretakerProfileQuery.isError)
    return (
      <ErrorState
        message={caretakerProfileQuery.error.message}
        onRetry={() => void caretakerProfileQuery.refetch()}
      />
    );
  const caretaker = caretakerProfileQuery.data;
  const displayRating = caretaker.reviewCount ? Number(caretaker.rating).toFixed(1) : 'New';
  return (
    <>
      <Link className="back-link" to="/admin/caretakers">
        ← Back to caretakers
      </Link>
      <section className="admin-profile">
        <div className="admin-profile-banner">
          <div>
            <p className="eyebrow">Caretaker profile</p>
            <h1>{caretaker.name}</h1>
            <p>
              <MapPin size={14} />{' '}
              {caretaker.areas.length
                ? caretaker.areas.map((area) => area.name).join(', ')
                : caretaker.serviceAreas || 'Not provided'}
            </p>
          </div>
          <PawPrint className="admin-profile-banner-mark" aria-hidden="true" />
        </div>
        <div className="admin-profile-head">
          <ProfileImage
            className="admin-profile-photo"
            src={caretaker.photoUrl}
            name={caretaker.name}
            loading="eager"
          />
          <div className="admin-profile-identity">
            <div className="admin-profile-badges">
              <StatusBadge status={caretaker.approvalStatus} />
              {caretaker.verified && (
                <span className="verified inline">
                  <ShieldCheck size={14} /> Verified
                </span>
              )}
            </div>
            <div className="admin-profile-contact">
              <a href={`mailto:${caretaker.email}`}>
                <Mail size={15} /> {caretaker.email}
              </a>
              {caretaker.phone ? (
                <a href={`tel:${caretaker.phone}`}>
                  <Phone size={15} /> {caretaker.phone}
                </a>
              ) : (
                <span>
                  <Phone size={15} /> Contact number not provided
                </span>
              )}
            </div>
          </div>
          <div className="admin-profile-actions">
            {getCaretakerDetailActions(caretaker.approvalStatus).map((action) => (
              <button
                key={action.status}
                type="button"
                className={action.className}
                disabled={caretakerStatusMutation.isPending}
                onClick={() =>
                  caretakerStatusMutation.mutate(action.status, {
                    onSuccess: () => {
                      const decisionMessage = getCaretakerDecisionMessage(action.status);
                      toast.success(
                        decisionMessage.title,
                        `${caretaker.name} ${decisionMessage.message}`,
                      );
                    },
                    onError: (cause) => toast.error('Caretaker update failed', cause.message),
                  })
                }
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
        <div className="admin-profile-content">
          <div className="admin-profile-main">
            <section className="admin-profile-section">
              <h2>About</h2>
              <p>{caretaker.bio || 'This caretaker has not added a bio yet.'}</p>
            </section>
            {showCaretakerBookings && (
              <section className="admin-profile-section">
                <div className="admin-section-heading">
                  <h2>Bookings</h2>
                  {caretakerBookingsQuery.data && (
                    <span>
                      {caretakerBookingsQuery.data.length} total ·{' '}
                      {
                        caretakerBookingsQuery.data.filter(
                          (booking) => booking.status === 'COMPLETED',
                        ).length
                      }{' '}
                      completed
                    </span>
                  )}
                </div>
                {caretakerBookingsQuery.isPending ? (
                  <p className="admin-muted">Loading bookings…</p>
                ) : caretakerBookingsQuery.isError ? (
                  <p className="admin-muted">
                    Bookings could not be loaded.{' '}
                    <button
                      type="button"
                      className="admin-link-button"
                      onClick={() => void caretakerBookingsQuery.refetch()}
                    >
                      Try again
                    </button>
                  </p>
                ) : caretakerBookingsQuery.data.length === 0 ? (
                  <p className="admin-muted">No bookings for this caretaker yet.</p>
                ) : (
                  <div className="admin-booking-list">
                    {caretakerBookingsQuery.data.map((booking) => (
                      <article className="admin-booking-row" key={booking.id}>
                        <div className="admin-booking-row-date">
                          <b>{formatAdminDate(booking.startsAt)}</b>
                          <span>
                            {formatAdminTime(booking.startsAt)} ·{' '}
                            {formatDuration(booking.durationMinutes)}
                          </span>
                        </div>
                        <div className="admin-booking-row-main">
                          <b>
                            {booking.serviceName} · {booking.petName}
                          </b>
                          <span>{booking.customerName}</span>
                        </div>
                        <div className="admin-booking-row-actions">
                          <StatusBadge status={booking.status} />
                          <Link
                            className="text-link"
                            aria-label={`View booking ${booking.id} details`}
                            to={`/admin/bookings/${booking.id}`}
                          >
                            View details
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}
            <section className="admin-profile-section">
              <h2>Services</h2>
              {caretaker.services.length ? (
                <div className="admin-chip-list">
                  {caretaker.services.map((service) => (
                    <span className="admin-chip" key={service.id}>
                      {service.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="admin-muted">No services selected yet.</p>
              )}
            </section>
            <section className="admin-profile-section">
              <h2>Service areas</h2>
              {caretaker.areas.length ? (
                <div className="admin-chip-list">
                  {caretaker.areas.map((area) => (
                    <span className="admin-chip" key={area.id}>
                      {area.name} · {area.city}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="admin-muted">
                  {caretaker.serviceAreas || 'No service areas selected yet.'}
                </p>
              )}
            </section>
            <section className="admin-profile-section">
              <h2>Reviews</h2>
              <p className="admin-rating-line">
                <Star size={16} fill="currentColor" /> {displayRating}
                <span>
                  {caretaker.reviewCount} approved review{caretaker.reviewCount === 1 ? '' : 's'}
                </span>
              </p>
              {caretaker.reviews.length === 0 ? (
                <p className="admin-muted">No reviews yet.</p>
              ) : (
                <div className="admin-review-list">
                  {caretaker.reviews.map((review) => (
                    <article className="admin-review" key={review.id}>
                      <div className="admin-review-head">
                        <b>{review.author}</b>
                        <span>
                          {review.rating}/5 <Star size={13} fill="currentColor" />
                        </span>
                        <StatusBadge status={review.moderationStatus} />
                      </div>
                      <p>{review.comment || 'No comment provided.'}</p>
                      <small>{formatAdminDate(review.createdAt)}</small>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
          <aside className="admin-profile-side">
            <h2>Contact &amp; details</h2>
            <dl className="admin-facts">
              <div>
                <dt>Email</dt>
                <dd>{caretaker.email}</dd>
              </div>
              <div>
                <dt>Contact number</dt>
                <dd>{caretaker.phone || 'Not provided'}</dd>
              </div>
              <div>
                <dt>Hourly rate</dt>
                <dd>₹{formatINR(caretaker.hourlyRate)}</dd>
              </div>
              <div>
                <dt>Experience</dt>
                <dd>
                  {caretaker.experienceYears == null
                    ? 'Not provided'
                    : `${caretaker.experienceYears} years`}
                </dd>
              </div>
              <div>
                <dt>Languages</dt>
                <dd>{caretaker.languages || 'Not provided'}</dd>
              </div>
              <div>
                <dt>Approved rating</dt>
                <dd>{displayRating === 'New' ? 'No reviews yet' : `${displayRating} / 5`}</dd>
              </div>
              <div>
                <dt>Joined</dt>
                <dd>
                  <CalendarDays size={13} /> {formatAdminDate(caretaker.registeredAt)}
                </dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>{formatAdminDate(caretaker.updatedAt)}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>
    </>
  );
}
