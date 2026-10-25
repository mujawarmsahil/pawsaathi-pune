import { ArrowRight, CalendarDays, ChevronDown, Mail, PawPrint, Phone } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  formatAdminDate,
  formatAdminTime,
  formatAge,
  formatDuration,
  formatINR,
} from '../../utils';
import { ProfileImage } from '../common/ui/ProfileImage';
import { RatingStars } from '../common/ui/RatingStars';
import { StatusBadge } from '../common/ui/StatusBadge';

export type BookingCardParty = {
  label: string;
  name: string;
  photoUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  href?: string;
};

export type BookingCardPet = {
  name: string;
  photoUrl?: string | null;
  species?: string | null;
  breed?: string | null;
  ageYears?: number | null;
  notes?: string | null;
  foodNotes?: string | null;
};

export type BookingCardPaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';

export type BookingCardModel = {
  id: number;
  status: string;
  paymentStatus?: BookingCardPaymentStatus | null;
  cancellationReason?: string | null;
  rating?: number | null;
  review?: string | null;
  startsAt: string;
  endsAt: string;
  durationMinutes?: number;
  serviceName: string;
  pet: BookingCardPet;
  owner: BookingCardParty;
  caretaker: BookingCardParty;
  hourlyRate?: number | null;
  totalAmount?: number | null;
  detailsHref?: string;
};

type BookingCardProps = {
  booking?: BookingCardModel;
  isLoading?: boolean;
  actions?: ReactNode;
  detailsLabel?: string;
};

const paymentStatusLabels: Record<BookingCardPaymentStatus, string> = {
  PENDING: 'Payment pending',
  SUCCEEDED: 'Paid',
  FAILED: 'Payment failed',
  REFUNDED: 'Refunded',
};

const cancellationStatuses = new Set(['CANCELLED', 'REJECTED', 'REFUNDED']);

function BookingPaymentStatus({ status }: { status: BookingCardPaymentStatus }) {
  return (
    <span className={`payment-pill payment-${status.toLowerCase()}`}>
      {paymentStatusLabels[status] ?? status.replaceAll('_', ' ')}
    </span>
  );
}

type BookingHoverDetailsProps = {
  label: string;
  className?: string;
  trigger: ReactNode;
  children: ReactNode;
};

function BookingHoverDetails({ label, className, trigger, children }: BookingHoverDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const detailsId = useId();

  return (
    <div
      className={`booking-card-party${className ? ` ${className}` : ''}${isOpen ? ' is-open' : ''}`}
    >
      <button
        className="booking-card-party-trigger"
        type="button"
        aria-expanded={isOpen}
        aria-controls={detailsId}
        aria-label={label}
        onClick={() => setIsOpen((open) => !open)}
      >
        {trigger}
      </button>
      <div className="booking-card-party-popover" id={detailsId} role="tooltip">
        {children}
      </div>
    </div>
  );
}

function BookingParty({ party }: { party: BookingCardParty }) {
  const hasContactDetails = Boolean(party.email || party.phone || party.href);

  return (
    <BookingHoverDetails
      label={`${party.label} details for ${party.name}`}
      trigger={
        <>
          <ProfileImage className="booking-card-avatar" src={party.photoUrl} name={party.name} />
          <span className="booking-card-party-copy">
            <small>
              {party.label}
              <ChevronDown size={12} aria-hidden="true" />
            </small>
            <b>{party.name}</b>
          </span>
        </>
      }
    >
      <span className="booking-card-popover-label">{party.label} details</span>
      {party.email && (
        <a href={`mailto:${party.email}`}>
          <Mail size={14} aria-hidden="true" />
          <span>{party.email}</span>
        </a>
      )}
      {party.phone && (
        <a href={`tel:${party.phone}`}>
          <Phone size={14} aria-hidden="true" />
          <span>{party.phone}</span>
        </a>
      )}
      {!hasContactDetails && <span className="booking-card-popover-empty">No contact details</span>}
      {party.href && (
        <Link className="booking-card-popover-link" to={party.href}>
          Open profile
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      )}
    </BookingHoverDetails>
  );
}

function PetAvatar({
  pet,
  className,
  preview = false,
}: {
  pet: BookingCardPet;
  className: string;
  preview?: boolean;
}) {
  if (pet.photoUrl) {
    return (
      <img
        className={className}
        src={pet.photoUrl}
        alt={`${pet.name} pet photo${preview ? ' preview' : ''}`}
        loading="lazy"
      />
    );
  }
  return (
    <span
      className={`${className} booking-card-pet-placeholder`}
      role="img"
      aria-label={`${pet.name} pet photo not uploaded`}
    >
      <PawPrint size={20} aria-hidden="true" />
    </span>
  );
}

function petType(pet: BookingCardPet) {
  return [pet.species, pet.breed].filter(Boolean).join(' · ');
}

function BookingPet({ pet }: { pet: BookingCardPet }) {
  const type = petType(pet);
  const age = formatAge(pet.ageYears ?? null);

  return (
    <BookingHoverDetails
      className="booking-card-pet"
      label={`Pet details for ${pet.name}`}
      trigger={
        <>
          <PetAvatar pet={pet} className="booking-card-pet-avatar" />
          <span className="booking-card-party-copy">
            <small>
              Pet
              <ChevronDown size={12} aria-hidden="true" />
            </small>
            <b>{pet.name}</b>
          </span>
        </>
      }
    >
      <div className="booking-card-pet-popover-head">
        <PetAvatar pet={pet} className="booking-card-pet-photo" preview />
        <div className="booking-card-pet-identity">
          <span className="booking-card-popover-label">Pet details</span>
          <strong>{pet.name}</strong>
          <span>{type || 'Companion pet'}</span>
        </div>
      </div>
      <dl className="booking-card-pet-facts">
        <div>
          <dt>Type</dt>
          <dd>{pet.species || 'Not provided'}</dd>
        </div>
        <div>
          <dt>Breed</dt>
          <dd>{pet.breed || 'Not provided'}</dd>
        </div>
        <div>
          <dt>Age</dt>
          <dd>{age || 'Not provided'}</dd>
        </div>
        <div className="booking-card-pet-fact-wide">
          <dt>Food &amp; feeding</dt>
          <dd>{pet.foodNotes || 'Not provided'}</dd>
        </div>
        <div className="booking-card-pet-fact-wide">
          <dt>Care notes</dt>
          <dd>{pet.notes || 'No care notes'}</dd>
        </div>
      </dl>
    </BookingHoverDetails>
  );
}

function bookingDuration(booking: BookingCardModel) {
  if (booking.durationMinutes != null) return booking.durationMinutes;
  const startsAt = new Date(booking.startsAt).getTime();
  const endsAt = new Date(booking.endsAt).getTime();
  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || endsAt <= startsAt) return null;
  return Math.round((endsAt - startsAt) / 60000);
}

export function BookingCardSkeleton() {
  return (
    <article className="booking-card booking-card-skeleton" aria-hidden="true">
      <div className="booking-card-skeleton-top">
        <div className="booking-card-skeleton-stack">
          <span className="booking-card-skeleton-block booking-card-skeleton-date" />
          <span className="booking-card-skeleton-block booking-card-skeleton-time" />
        </div>
        <span className="booking-card-skeleton-block booking-card-skeleton-badge" />
      </div>
      <div className="booking-card-skeleton-stack">
        <span className="booking-card-skeleton-block booking-card-skeleton-kicker" />
        <span className="booking-card-skeleton-block booking-card-skeleton-title" />
      </div>
      <div className="booking-card-skeleton-people">
        {['owner', 'pet', 'caretaker'].map((role) => (
          <div className="booking-card-skeleton-person" key={role}>
            <span className="booking-card-skeleton-block booking-card-skeleton-avatar" />
            <span className="booking-card-skeleton-block booking-card-skeleton-name" />
            <span className="booking-card-skeleton-block booking-card-skeleton-role" />
          </div>
        ))}
      </div>
      <div className="booking-card-skeleton-footer">
        <span className="booking-card-skeleton-block booking-card-skeleton-button" />
        <span className="booking-card-skeleton-block booking-card-skeleton-link" />
      </div>
    </article>
  );
}

export function BookingCard({
  booking,
  isLoading = false,
  actions,
  detailsLabel = 'Details',
}: BookingCardProps) {
  const titleId = useId();
  if (isLoading || !booking) return <BookingCardSkeleton />;

  const durationMinutes = bookingDuration(booking);
  const displayAmount = booking.totalAmount ?? booking.hourlyRate;
  const showHourlyRate = booking.totalAmount == null && booking.hourlyRate != null;

  return (
    <article className="booking-card" role="listitem" aria-labelledby={titleId}>
      <header className="booking-card-top">
        <div className="booking-card-when">
          <span className="booking-card-date">
            <CalendarDays size={16} aria-hidden="true" />
            <time dateTime={booking.startsAt}>{formatAdminDate(booking.startsAt)}</time>
          </span>
          <span className="booking-card-time">
            {formatAdminTime(booking.startsAt)}–{formatAdminTime(booking.endsAt)}
            {durationMinutes != null && <span> · {formatDuration(durationMinutes)}</span>}
          </span>
        </div>
        <div className="booking-card-badges">
          <StatusBadge status={booking.status} />
          {booking.paymentStatus && !cancellationStatuses.has(booking.status) && (
            <BookingPaymentStatus status={booking.paymentStatus} />
          )}
        </div>
      </header>
      <div className="booking-card-summary">
        <div className="booking-card-service">
          <span className="booking-card-kicker">Service</span>
          <h2 id={titleId}>{booking.serviceName}</h2>
        </div>
        {displayAmount != null && (
          <div className="booking-card-price">
            <span>{showHourlyRate ? 'Rate' : 'Total'}</span>
            <b>
              ₹{formatINR(displayAmount)}
              {showHourlyRate && <small>/hr</small>}
            </b>
          </div>
        )}
      </div>
      <div className="booking-card-people">
        <BookingParty party={booking.owner} />
        <BookingPet pet={booking.pet} />
        <BookingParty party={booking.caretaker} />
      </div>
      {cancellationStatuses.has(booking.status) && (
        <div className="booking-card-cancellation">
          <span className="booking-card-popover-label">
            {booking.status === 'REJECTED' ? 'Decline reason' : 'Cancellation reason'}
          </span>
          <p>{booking.cancellationReason?.trim() || 'No cancellation reason recorded.'}</p>
        </div>
      )}
      {booking.status === 'COMPLETED' && booking.rating != null && (
        <div className="booking-card-review">
          <div className="booking-card-review-head">
            <span className="booking-card-popover-label">Customer review</span>
            <RatingStars rating={booking.rating} />
          </div>
          {booking.review?.trim() ? (
            <p className="booking-card-review-text">"{booking.review.trim()}"</p>
          ) : (
            <p className="booking-card-review-empty">No written review.</p>
          )}
        </div>
      )}
      {(actions || booking.detailsHref) && (
        <footer className="booking-card-footer">
          {actions && <div className="booking-card-actions">{actions}</div>}
          {booking.detailsHref && (
            <Link className="booking-card-details-link" to={booking.detailsHref}>
              {detailsLabel}
            </Link>
          )}
        </footer>
      )}
    </article>
  );
}
