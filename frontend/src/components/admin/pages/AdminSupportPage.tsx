import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '../../../api/endpoints';
import { EmptyState, ErrorState, LoadingState } from '../../common/feedback/FeedbackStates';
import { StatusBadge } from '../../common/ui/StatusBadge';

export function AdminSupportPage() {
  const queryClient = useQueryClient();
  const supportTicketsQuery = useQuery({
    queryKey: ['admin', 'support'],
    queryFn: endpoints.admin.supportTickets,
  });
  const ticketStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      endpoints.support.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'support'] }),
  });
  if (supportTicketsQuery.isPending) return <LoadingState label="Loading support queue…" />;
  if (supportTicketsQuery.isError)
    return (
      <ErrorState
        message={supportTicketsQuery.error.message}
        onRetry={() => void supportTicketsQuery.refetch()}
      />
    );
  return (
    <>
      <p className="eyebrow">Customer care</p>
      <h1>Support tickets</h1>
      {supportTicketsQuery.data.length === 0 ? (
        <EmptyState title="Queue is clear" message="Open support tickets will be listed here." />
      ) : (
        <div className="booking-list">
          {supportTicketsQuery.data.map((ticket) => (
            <article className="booking-row" key={ticket.id}>
              <div className="booking-info">
                <b>{ticket.subject}</b>
                <span>{ticket.description}</span>
              </div>
              <StatusBadge status={ticket.status} />
              <button
                className="button button-small"
                onClick={() =>
                  ticketStatusMutation.mutate({ id: ticket.id, status: 'IN_PROGRESS' })
                }
              >
                Start
              </button>
              <button
                className="button button-outline button-small"
                onClick={() => ticketStatusMutation.mutate({ id: ticket.id, status: 'RESOLVED' })}
              >
                Resolve
              </button>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
