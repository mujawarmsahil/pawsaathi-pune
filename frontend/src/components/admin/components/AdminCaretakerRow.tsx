import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import type { CaretakerCandidate } from '../../../types/api';
import { formatINR } from '../../../utils';
import { ProfileImage } from '../../common/ui/ProfileImage';

export function AdminCaretakerRow({
  caretaker,
  isStatusUpdatePending,
  children,
}: {
  caretaker: CaretakerCandidate;
  isStatusUpdatePending: boolean;
  children: ReactNode;
}) {
  return (
    <article className="booking-row caretaker-row" aria-busy={isStatusUpdatePending}>
      <ProfileImage className="caretaker-avatar" src={caretaker.photoUrl} name={caretaker.name} />
      <div className="booking-info">
        <b>{caretaker.name}</b>
        <span>
          {caretaker.email} · {caretaker.serviceAreas || 'Areas not set'} · ₹
          {formatINR(caretaker.hourlyRate)}/hr
        </span>
      </div>
      <Link className="text-link" to={`/admin/caretakers/${caretaker.id}`}>
        Details
      </Link>
      <div className="caretaker-actions">{children}</div>
    </article>
  );
}
