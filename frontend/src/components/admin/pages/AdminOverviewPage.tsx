import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { endpoints } from '../../../api/endpoints';
import { ErrorState, LoadingState } from '../../common/feedback/FeedbackStates';

export function AdminOverviewPage() {
  const overviewQuery = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: endpoints.admin.overview,
  });
  if (overviewQuery.isPending) return <LoadingState label="Loading operations overview…" />;
  if (overviewQuery.isError)
    return (
      <ErrorState
        message={overviewQuery.error.message}
        onRetry={() => void overviewQuery.refetch()}
      />
    );
  const overviewMetrics = [
    ['Customers', overviewQuery.data.customers],
    ['Approved caretakers', overviewQuery.data.caretakers],
    ['Awaiting review', overviewQuery.data.pendingCaretakers],
    ['Bookings', overviewQuery.data.bookings],
    ['Open support tickets', overviewQuery.data.openTickets],
  ];
  return (
    <>
      <p className="eyebrow">Operations</p>
      <h1>Admin overview</h1>
      <div className="metric-grid">
        {overviewMetrics.map(([metricLabel, metricValue]) => (
          <article className="metric-card" key={metricLabel}>
            <span>{metricLabel}</span>
            <b>{metricValue}</b>
          </article>
        ))}
      </div>
      <section className="admin-section">
        <h2>Manage the platform</h2>
        <div className="admin-shortcuts">
          {[
            ['Caretakers', '/admin/caretakers'],
            ['Reviews', '/admin/reviews'],
            ['Support', '/admin/support'],
          ].map(([shortcutLabel, shortcutPath]) => (
            <Link className="admin-shortcut" key={shortcutPath} to={shortcutPath}>
              {shortcutLabel} <span>→</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
