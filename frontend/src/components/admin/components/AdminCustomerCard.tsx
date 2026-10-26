import { CalendarDays, MapPin, PawPrint, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { AdminCustomer } from '../../../types/api';
import { formatAdminDate } from '../../../utils';
import { ProfileImage } from '../../common/ui/ProfileImage';
import { StatusBadge } from '../../common/ui/StatusBadge';

export function AdminCustomerCard({
  customer,
  isStatusUpdatePending,
  onToggleStatus,
}: {
  customer: AdminCustomer;
  isStatusUpdatePending: boolean;
  onToggleStatus: (customer: AdminCustomer) => void;
}) {
  const isDeactivated = customer.status === 'DEACTIVATED';
  return (
    <article className="admin-review admin-customer-card" aria-busy={isStatusUpdatePending}>
      <div className="admin-review-head">
        <div className="admin-review-owner">
          <ProfileImage
            className="admin-review-avatar"
            src={customer.photoUrl}
            name={customer.name}
          />
          <span className="admin-review-owner-copy">
            <small>Customer</small>
            <Link to={`/admin/customers/${customer.id}`}>{customer.name}</Link>
            <span className="admin-customer-email">{customer.email}</span>
          </span>
        </div>
        <StatusBadge status={customer.status} />
      </div>
      <div className="admin-review-meta admin-customer-facts">
        <span className="admin-review-chip">
          <MapPin size={13} />
          <span>Area</span>
          <b>{customer.area || 'Not set'}</b>
        </span>
        <span className="admin-review-chip">
          <PawPrint size={13} />
          <b>
            {customer.pets.length} {customer.pets.length === 1 ? 'pet' : 'pets'}
          </b>
        </span>
        {customer.phone && (
          <span className="admin-review-chip">
            <Phone size={13} />
            <b>{customer.phone}</b>
          </span>
        )}
        <span className="admin-review-date">
          <CalendarDays size={13} /> Joined {formatAdminDate(customer.registeredAt)}
        </span>
      </div>
      <div className="admin-customer-pets">
        <span className="admin-customer-pets-label">Pets</span>
        {customer.pets.length ? (
          customer.pets.map((pet) => (
            <Link
              key={pet.id}
              className="admin-review-chip"
              aria-label={`View ${pet.name} for ${customer.name}`}
              to={`/admin/customers/${customer.id}#pet-${pet.id}`}
            >
              <PawPrint size={13} />
              <b>{pet.name}</b>
            </Link>
          ))
        ) : (
          <span className="admin-muted admin-customer-pets-empty">No pets added</span>
        )}
      </div>
      <div className="admin-review-footer admin-customer-card-footer">
        <div className="admin-customer-actions">
          <button
            type="button"
            className={isDeactivated ? 'button button-small' : 'button button-outline button-small'}
            disabled={isStatusUpdatePending}
            onClick={() => onToggleStatus(customer)}
          >
            {isDeactivated ? 'Activate' : 'Deactivate'}
          </button>
          <Link className="text-link" to={`/admin/customers/${customer.id}`}>
            View customer
          </Link>
        </div>
      </div>
    </article>
  );
}
