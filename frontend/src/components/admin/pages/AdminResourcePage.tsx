import { useLocation } from 'react-router-dom';

import { EmptyState } from '../../common/feedback/FeedbackStates';

const resourceTitlesByKey: Record<string, string> = {
  users: 'Customer and caretaker accounts',
  services: 'Services and areas',
  payments: 'Payments and refunds',
  audit: 'Audit log',
};

export function AdminResourcePage() {
  const { pathname } = useLocation();
  const resourceKey = pathname.split('/')[2] ?? 'bookings';
  const resourceTitle = resourceTitlesByKey[resourceKey] ?? 'Administration';
  return (
    <>
      <p className="eyebrow">Administration</p>
      <h1>{resourceTitle}</h1>
      <EmptyState
        title={`${resourceTitle} is coming soon`}
        message="This administration area is not enabled until its backend API is available."
      />
    </>
  );
}
