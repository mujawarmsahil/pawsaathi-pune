import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { endpoints } from '../../api/endpoints';
import { EmptyState, ErrorState, LoadingState } from '../common/feedback/FeedbackStates';
import { StatusBadge } from '../common/ui/StatusBadge';

export function SupportPage() {
  const supportTicketsQuery = useQuery({
    queryKey: ['support', 'tickets'],
    queryFn: endpoints.support.list,
  });
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const supportTicketSchema = z.object({
    subject: z.string().trim().min(3).max(180),
    description: z.string().trim().min(10).max(5000),
    bookingId: z.string().optional(),
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof supportTicketSchema>>({
    resolver: zodResolver(supportTicketSchema),
  });
  if (supportTicketsQuery.isPending) return <LoadingState label="Loading support tickets…" />;
  if (supportTicketsQuery.isError)
    return (
      <ErrorState
        message={supportTicketsQuery.error.message}
        onRetry={() => void supportTicketsQuery.refetch()}
      />
    );
  return (
    <>
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">We’re here to help</p>
          <h1>Support</h1>
          <p>Contact our team and follow ticket updates.</p>
        </div>
      </div>
      <div className="support-grid">
        {supportTicketsQuery.data.map((ticket) => (
          <article className="support-card" key={ticket.id}>
            <h2>{ticket.subject}</h2>
            <p>{ticket.description}</p>
            <StatusBadge status={ticket.status} />
            <small>{new Date(ticket.createdAt).toLocaleDateString('en-IN')}</small>
          </article>
        ))}
      </div>
      {supportTicketsQuery.data.length === 0 && (
        <EmptyState
          title="No support tickets"
          message="If something needs attention, send our team a note."
        />
      )}
      <form
        className="profile-setup"
        onSubmit={handleSubmit(async (supportTicketValues) => {
          setError('');
          try {
            await endpoints.support.create({
              ...supportTicketValues,
              bookingId: supportTicketValues.bookingId
                ? Number(supportTicketValues.bookingId)
                : null,
            });
            reset();
            await queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] });
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Could not create ticket.');
          }
        })}
      >
        <h2>Open a support ticket</h2>
        <label htmlFor="ticket-subject">Subject</label>
        <input id="ticket-subject" {...register('subject')} />
        {errors.subject && <span className="form-error">{errors.subject.message}</span>}
        <label htmlFor="ticket-description">How can we help?</label>
        <textarea id="ticket-description" rows={4} {...register('description')} />
        {errors.description && <span className="form-error">{errors.description.message}</span>}
        <button className="button">Send to support</button>
        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}
      </form>
    </>
  );
}
