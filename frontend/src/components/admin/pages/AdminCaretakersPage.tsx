import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { endpoints } from '../../../api/endpoints';
import { useToast } from '../../../hooks/useToast';
import type { CaretakerCandidate } from '../../../types/api';
import { getCaretakerDecisionMessage } from '../../../utils';
import { ErrorState, LoadingState } from '../../common/feedback/FeedbackStates';
import { AdminCaretakerRow } from '../components/AdminCaretakerRow';

type CaretakerStatusTab = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';

const caretakerStatusTabOrder: CaretakerStatusTab[] = [
  'PENDING',
  'APPROVED',
  'SUSPENDED',
  'REJECTED',
];

function caretakerMatchesSearchQuery(caretaker: CaretakerCandidate, searchQuery: string) {
  const searchableText = [caretaker.name, caretaker.email, caretaker.serviceAreas]
    .join(' ')
    .toLowerCase();
  return searchQuery
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => searchableText.includes(term));
}

export function AdminCaretakersPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeStatusTab, setActiveStatusTab] = useState<CaretakerStatusTab>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const caretakerCandidatesQuery = useQuery({
    queryKey: ['admin', 'caretakers'],
    queryFn: endpoints.admin.caretakers,
  });
  const caretakerStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      endpoints.admin.updateCaretaker(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'caretakers'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
  });
  const trimmedSearchQuery = searchQuery.trim();
  const caretakersByStatus = useMemo(() => {
    const caretakerCandidates = caretakerCandidatesQuery.data ?? [];
    const filteredCaretakers = trimmedSearchQuery
      ? caretakerCandidates.filter((caretaker) =>
          caretakerMatchesSearchQuery(caretaker, trimmedSearchQuery),
        )
      : caretakerCandidates;
    return {
      PENDING: filteredCaretakers.filter((caretaker) => caretaker.approvalStatus === 'PENDING'),
      APPROVED: filteredCaretakers.filter((caretaker) => caretaker.approvalStatus === 'APPROVED'),
      SUSPENDED: filteredCaretakers.filter((caretaker) => caretaker.approvalStatus === 'SUSPENDED'),
      REJECTED: filteredCaretakers.filter((caretaker) => caretaker.approvalStatus === 'REJECTED'),
    };
  }, [caretakerCandidatesQuery.data, trimmedSearchQuery]);

  function updateCaretakerSearch(nextSearchQuery: string) {
    setSearchQuery(nextSearchQuery);
    const trimmedNextSearchQuery = nextSearchQuery.trim();
    if (!trimmedNextSearchQuery) return;
    const matchingCaretakers = (caretakerCandidatesQuery.data ?? []).filter((caretaker) =>
      caretakerMatchesSearchQuery(caretaker, trimmedNextSearchQuery),
    );
    if (matchingCaretakers.some((caretaker) => caretaker.approvalStatus === activeStatusTab)) {
      return;
    }
    const matchingStatusTab = caretakerStatusTabOrder.find((statusTab) =>
      matchingCaretakers.some((caretaker) => caretaker.approvalStatus === statusTab),
    );
    if (matchingStatusTab) setActiveStatusTab(matchingStatusTab);
  }

  if (caretakerCandidatesQuery.isPending)
    return <LoadingState label="Loading caretaker applications…" />;
  if (caretakerCandidatesQuery.isError)
    return (
      <ErrorState
        message={caretakerCandidatesQuery.error.message}
        onRetry={() => void caretakerCandidatesQuery.refetch()}
      />
    );

  const statusTabs: { key: CaretakerStatusTab; label: string; count: number }[] = [
    { key: 'PENDING', label: 'Pending', count: caretakersByStatus.PENDING.length },
    { key: 'APPROVED', label: 'Caretakers', count: caretakersByStatus.APPROVED.length },
    { key: 'SUSPENDED', label: 'Suspended', count: caretakersByStatus.SUSPENDED.length },
    { key: 'REJECTED', label: 'Rejected', count: caretakersByStatus.REJECTED.length },
  ];
  const emptyStateMessages: Record<CaretakerStatusTab, string> = {
    PENDING: 'No caretaker applications are awaiting review.',
    APPROVED: 'No approved caretakers yet.',
    SUSPENDED: 'No suspended caretakers.',
    REJECTED: 'No rejected applications.',
  };

  function changeCaretakerApprovalStatus(caretaker: CaretakerCandidate, status: string) {
    caretakerStatusMutation.mutate(
      { id: caretaker.id, status },
      {
        onSuccess: () => {
          const decisionMessage = getCaretakerDecisionMessage(status);
          toast.success(decisionMessage.title, `${caretaker.name} ${decisionMessage.message}`);
        },
        onError: (cause) => toast.error('Caretaker update failed', cause.message),
      },
    );
  }

  return (
    <>
      <p className="eyebrow">Trust &amp; safety</p>
      <h1>Caretaker's</h1>
      <div className="admin-filter">
        <label>
          Search caretakers
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => updateCaretakerSearch(event.target.value)}
            placeholder="Name, email, or area"
          />
        </label>
      </div>
      <div className="admin-tabs" role="tablist" aria-label="Caretaker status">
        {statusTabs.map((statusTab) => (
          <button
            key={statusTab.key}
            type="button"
            role="tab"
            id={`caretaker-tab-${statusTab.key.toLowerCase()}`}
            aria-controls="caretaker-tab-panel"
            aria-selected={activeStatusTab === statusTab.key}
            className={activeStatusTab === statusTab.key ? 'active' : undefined}
            onClick={() => setActiveStatusTab(statusTab.key)}
          >
            {statusTab.label}
            <span className="admin-tab-count">{statusTab.count}</span>
          </button>
        ))}
      </div>
      <div
        className="admin-tab-panel"
        id="caretaker-tab-panel"
        role="tabpanel"
        aria-labelledby={`caretaker-tab-${activeStatusTab.toLowerCase()}`}
      >
        {caretakersByStatus[activeStatusTab].length === 0 ? (
          <p className="admin-tab-empty">
            {trimmedSearchQuery
              ? `No ${activeStatusTab.toLowerCase()} caretakers match “${trimmedSearchQuery}”.`
              : emptyStateMessages[activeStatusTab]}
          </p>
        ) : (
          <div className="booking-list">
            {caretakersByStatus[activeStatusTab].map((caretaker) => (
              <AdminCaretakerRow
                key={caretaker.id}
                caretaker={caretaker}
                isStatusUpdatePending={caretakerStatusMutation.isPending}
              >
                {activeStatusTab === 'PENDING' && (
                  <>
                    <button
                      className="button button-small"
                      disabled={caretakerStatusMutation.isPending}
                      onClick={() => changeCaretakerApprovalStatus(caretaker, 'APPROVED')}
                    >
                      Approve
                    </button>
                    <button
                      className="review-reject"
                      disabled={caretakerStatusMutation.isPending}
                      onClick={() => changeCaretakerApprovalStatus(caretaker, 'REJECTED')}
                    >
                      Reject
                    </button>
                  </>
                )}
                {activeStatusTab === 'APPROVED' && (
                  <button
                    className="button button-outline button-small"
                    disabled={caretakerStatusMutation.isPending}
                    onClick={() => changeCaretakerApprovalStatus(caretaker, 'SUSPENDED')}
                  >
                    Suspend
                  </button>
                )}
                {activeStatusTab === 'SUSPENDED' && (
                  <button
                    className="button button-small"
                    disabled={caretakerStatusMutation.isPending}
                    onClick={() => changeCaretakerApprovalStatus(caretaker, 'APPROVED')}
                  >
                    Reinstate
                  </button>
                )}
                {activeStatusTab === 'REJECTED' && (
                  <button
                    className="button button-small"
                    disabled={caretakerStatusMutation.isPending}
                    onClick={() => changeCaretakerApprovalStatus(caretaker, 'APPROVED')}
                  >
                    Approve
                  </button>
                )}
              </AdminCaretakerRow>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
