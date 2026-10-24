import { EmptyState } from '../common/feedback/FeedbackStates';

export function CaretakerEarningsPage() {
  return (
    <section>
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Payouts</p>
          <h1>Your earnings</h1>
          <p>Completed booking earnings and payout status.</p>
        </div>
      </div>
      <EmptyState
        title="Earnings are coming soon"
        message="Payout and earnings reporting will be available in a future release."
      />
    </section>
  );
}
