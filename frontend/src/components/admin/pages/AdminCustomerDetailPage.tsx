import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Mail, MapPin, PawPrint, Phone } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

import { endpoints } from '../../../api/endpoints';
import { useToast } from '../../../hooks/useToast';
import {
  formatAdminDate,
  formatAdminTime,
  formatAge,
  formatDuration,
  getCustomerStatusMessage,
} from '../../../utils';
import { EmptyState, ErrorState, LoadingState } from '../../common/feedback/FeedbackStates';
import { ProfileImage } from '../../common/ui/ProfileImage';
import { StatusBadge } from '../../common/ui/StatusBadge';

export function AdminCustomerDetailPage() {
  const { id } = useParams();
  const { hash } = useLocation();
  const customerId = Number(id);
  const queryClient = useQueryClient();
  const toast = useToast();
  const customerProfileQuery = useQuery({
    queryKey: ['admin', 'customer', customerId],
    queryFn: () => endpoints.admin.customerDetail(customerId),
    enabled: Number.isFinite(customerId),
  });
  const customerBookingsQuery = useQuery({
    queryKey: ['admin', 'customer', customerId, 'bookings'],
    queryFn: () => endpoints.admin.customerBookings(customerId),
    enabled: Number.isFinite(customerId),
  });
  const customerStatusMutation = useMutation({
    mutationFn: (status: string) => endpoints.admin.updateCustomer(customerId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'customer', customerId] });
    },
  });
  useEffect(() => {
    if (!hash || !customerProfileQuery.data) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [customerProfileQuery.data, hash]);
  if (!Number.isFinite(customerId))
    return (
      <EmptyState
        title="Customer not found"
        message="The requested customer profile does not exist."
        action={<Link to="/admin/customers">Back to customers</Link>}
      />
    );
  if (customerProfileQuery.isPending)
    return (
      <>
        <Link className="back-link" to="/admin/customers">
          ← Back to customers
        </Link>
        <LoadingState label="Loading customer profile…" />
      </>
    );
  if (customerProfileQuery.isError)
    return (
      <ErrorState
        message={customerProfileQuery.error.message}
        onRetry={() => void customerProfileQuery.refetch()}
      />
    );
  const customer = customerProfileQuery.data;
  const isDeactivated = customer.status === 'DEACTIVATED';
  const nextStatus = isDeactivated ? 'ACTIVE' : 'DEACTIVATED';
  return (
    <>
      <Link className="back-link" to="/admin/customers">
        ← Back to customers
      </Link>
      <section className="admin-profile">
        <div className="admin-profile-banner">
          <div>
            <p className="eyebrow">Customer profile</p>
            <h1>{customer.name}</h1>
            <p>
              <MapPin size={14} /> {customer.area || 'Area not set'}
            </p>
          </div>
          <PawPrint className="admin-profile-banner-mark" aria-hidden="true" />
        </div>
        <div className="admin-profile-head">
          <ProfileImage
            className="admin-profile-photo"
            src={customer.photoUrl}
            name={customer.name}
            loading="eager"
          />
          <div className="admin-profile-identity">
            <div className="admin-profile-badges">
              <StatusBadge status={customer.status} />
            </div>
            <div className="admin-profile-contact">
              <a href={`mailto:${customer.email}`}>
                <Mail size={15} /> {customer.email}
              </a>
              {customer.phone ? (
                <a href={`tel:${customer.phone}`}>
                  <Phone size={15} /> {customer.phone}
                </a>
              ) : (
                <span>
                  <Phone size={15} /> Contact number not provided
                </span>
              )}
              <span>
                <CalendarDays size={15} /> Joined {formatAdminDate(customer.registeredAt)}
              </span>
            </div>
          </div>
          <div className="admin-profile-actions">
            <button
              type="button"
              className={
                isDeactivated ? 'button button-small' : 'button button-outline button-small'
              }
              disabled={customerStatusMutation.isPending}
              onClick={() =>
                customerStatusMutation.mutate(nextStatus, {
                  onSuccess: () => {
                    const statusMessage = getCustomerStatusMessage(nextStatus);
                    toast.success(statusMessage.title, `${customer.name} ${statusMessage.message}`);
                  },
                  onError: (cause) => toast.error('Customer update failed', cause.message),
                })
              }
            >
              {isDeactivated ? 'Activate customer' : 'Deactivate customer'}
            </button>
          </div>
        </div>
        <div className="admin-profile-content">
          <div className="admin-profile-main">
            <section className="admin-profile-section">
              <div className="admin-section-heading">
                <h2>Bookings</h2>
                {customerBookingsQuery.data && (
                  <span>
                    {customerBookingsQuery.data.length} total ·{' '}
                    {
                      customerBookingsQuery.data.filter((booking) => booking.status === 'COMPLETED')
                        .length
                    }{' '}
                    completed
                  </span>
                )}
              </div>
              {customerBookingsQuery.isPending ? (
                <p className="admin-muted">Loading bookings…</p>
              ) : customerBookingsQuery.isError ? (
                <p className="admin-muted">
                  Bookings could not be loaded.{' '}
                  <button
                    type="button"
                    className="admin-link-button"
                    onClick={() => void customerBookingsQuery.refetch()}
                  >
                    Try again
                  </button>
                </p>
              ) : customerBookingsQuery.data.length === 0 ? (
                <p className="admin-muted">No bookings for this customer yet.</p>
              ) : (
                <div className="admin-booking-list">
                  {customerBookingsQuery.data.map((booking) => (
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
                        <span>{booking.caretakerName}</span>
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
            <section className="admin-profile-section">
              <div className="admin-section-heading">
                <h2>Pets</h2>
                <span>
                  {customer.pets.length} {customer.pets.length === 1 ? 'pet' : 'pets'}
                </span>
              </div>
              {customer.pets.length ? (
                <div className="admin-customer-pet-list">
                  {customer.pets.map((pet) => {
                    const petType = [pet.species, pet.breed].filter(Boolean).join(' · ');
                    const petAge = formatAge(pet.ageYears);
                    return (
                      <article
                        className="admin-customer-pet"
                        id={`pet-${pet.id}`}
                        key={pet.id}
                        tabIndex={-1}
                      >
                        <ProfileImage
                          className="admin-booking-pet-photo"
                          src={pet.photoUrl}
                          name={pet.name}
                        />
                        <div className="admin-customer-pet-copy">
                          <div className="admin-customer-pet-head">
                            <h3>{pet.name}</h3>
                            <span>{petType || 'Pet'}</span>
                          </div>
                          <div className="admin-review-meta">
                            <span className="admin-review-chip">
                              <PawPrint size={13} />
                              <b>{pet.species}</b>
                            </span>
                            {petAge && (
                              <span className="admin-review-chip">
                                <CalendarDays size={13} />
                                <b>{petAge}</b>
                              </span>
                            )}
                          </div>
                          <p>{pet.notes || 'No care notes added.'}</p>
                          <p>
                            <b>Food notes:</b> {pet.foodNotes || 'Not provided'}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="admin-muted">No pets have been added for this customer.</p>
              )}
            </section>
          </div>
          <aside className="admin-profile-side">
            <h2>Customer details</h2>
            <dl className="admin-facts">
              <div>
                <dt>Area</dt>
                <dd>
                  <MapPin size={13} /> {customer.area || 'Not set'}
                </dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{customer.email}</dd>
              </div>
              <div>
                <dt>Contact number</dt>
                <dd>{customer.phone || 'Not provided'}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusBadge status={customer.status} />
                </dd>
              </div>
              <div>
                <dt>Joined</dt>
                <dd>
                  <CalendarDays size={13} /> {formatAdminDate(customer.registeredAt)}
                </dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>{formatAdminDate(customer.updatedAt)}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>
    </>
  );
}
