import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { endpoints } from '../../api/endpoints';
import { ErrorState, LoadingState } from '../common/feedback/FeedbackStates';

const blockedDatesQueryKey = ['caretaker', 'availability', 'blocked-dates'];

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function CaretakerUnavailableDates() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState('');
  const blockedDatesQuery = useQuery({
    queryKey: blockedDatesQueryKey,
    queryFn: endpoints.caretakerSetup.blockedDates,
  });
  const blockDateMutation = useMutation({
    mutationFn: endpoints.caretakerSetup.blockDate,
    onSuccess: async () => {
      setDate('');
      await queryClient.invalidateQueries({ queryKey: blockedDatesQueryKey });
    },
  });
  const unblockDateMutation = useMutation({
    mutationFn: endpoints.caretakerSetup.unblockDate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: blockedDatesQueryKey });
    },
  });

  const today = localDateString(new Date());
  const mutationError = blockDateMutation.error ?? unblockDateMutation.error;

  return (
    <section className="setup-card blocked-dates-card" aria-labelledby="blocked-dates-title">
      <h2 id="blocked-dates-title">One-off unavailable dates</h2>
      <p className="muted-label">
        Block a full date to stop new bookings. Existing bookings are not changed.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (date) blockDateMutation.mutate(date);
        }}
      >
        <label htmlFor="caretaker-blocked-date">Date to block</label>
        <div className="blocked-date-form">
          <input
            id="caretaker-blocked-date"
            type="date"
            min={today}
            required
            value={date}
            onInput={(event) => setDate(event.currentTarget.value)}
          />
          <button className="button" type="submit" disabled={!date || blockDateMutation.isPending}>
            Block date
          </button>
        </div>
      </form>

      {blockedDatesQuery.isPending && <LoadingState label="Loading unavailable dates…" />}
      {blockedDatesQuery.isError && (
        <ErrorState
          message={blockedDatesQuery.error.message}
          onRetry={() => void blockedDatesQuery.refetch()}
        />
      )}
      {blockedDatesQuery.isSuccess && (
        <ul className="blocked-date-list" aria-label="Blocked dates">
          {blockedDatesQuery.data.length === 0 ? (
            <li className="muted-label">No dates blocked.</li>
          ) : (
            blockedDatesQuery.data.map((blockedDate) => (
              <li key={blockedDate}>
                <time dateTime={blockedDate}>{blockedDate}</time>
                <button
                  type="button"
                  className="button button-secondary"
                  aria-label={`Remove block for ${blockedDate}`}
                  disabled={unblockDateMutation.isPending}
                  onClick={() => unblockDateMutation.mutate(blockedDate)}
                >
                  Remove
                </button>
              </li>
            ))
          )}
        </ul>
      )}
      {mutationError && (
        <p className="alert" role="alert">
          {mutationError.message}
        </p>
      )}
    </section>
  );
}
