import { useMarkNotificationRead, useNotifications } from '../../hooks/useNotifications';
import { formatDateTime } from '../../utils';
import { EmptyState, ErrorState, LoadingState } from '../common/feedback/FeedbackStates';
import { StatusBadge } from '../common/ui/StatusBadge';

export function NotificationsPage() {
  const notificationsQuery = useNotifications();
  const markNotificationReadMutation = useMarkNotificationRead();

  if (notificationsQuery.isPending) return <LoadingState label="Loading notifications…" />;
  if (notificationsQuery.isError)
    return (
      <ErrorState
        message={notificationsQuery.error.message}
        onRetry={() => void notificationsQuery.refetch()}
      />
    );

  return (
    <>
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Updates for you</p>
          <h1>Notifications</h1>
          <p>Booking, payment, and support updates in one place.</p>
        </div>
      </div>
      {notificationsQuery.data.length === 0 ? (
        <EmptyState title="You’re all caught up" message="New updates will appear here." />
      ) : (
        <div className="notification-list">
          {notificationsQuery.data.map((notification) => (
            <article className="notification-card" key={notification.id}>
              <div>
                <span className="eyebrow">
                  {notification.type.replaceAll('_', ' ').toLowerCase()} ·{' '}
                  {formatDateTime(notification.createdAt)}
                </span>
                <h2>{notification.title}</h2>
                <p>{notification.body}</p>
              </div>
              {notification.readAt ? (
                <StatusBadge status="READ" />
              ) : (
                <button
                  className="button button-small"
                  disabled={markNotificationReadMutation.isPending}
                  onClick={() => markNotificationReadMutation.mutate(notification.id)}
                >
                  Mark as read
                </button>
              )}
            </article>
          ))}
        </div>
      )}
      {markNotificationReadMutation.isError && (
        <ErrorState message={markNotificationReadMutation.error.message} />
      )}
    </>
  );
}
