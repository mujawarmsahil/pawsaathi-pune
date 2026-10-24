export function AdminCaretakerDetailSkeleton() {
  return (
    <div
      className="admin-profile admin-profile-skeleton"
      role="status"
      aria-label="Loading caretaker profile"
      aria-busy="true"
    >
      <span className="sr-only">Loading caretaker profile…</span>
      <div className="admin-profile-skeleton-banner" aria-hidden="true">
        <span className="admin-skeleton-kicker image-skeleton" />
        <span className="admin-skeleton-title image-skeleton" />
      </div>
      <div className="admin-profile-skeleton-head" aria-hidden="true">
        <span className="admin-profile-skeleton-avatar image-skeleton" />
        <div className="admin-profile-skeleton-copy">
          <span className="admin-skeleton-bar short image-skeleton" />
          <span className="admin-skeleton-bar medium image-skeleton" />
        </div>
      </div>
      <div className="admin-profile-skeleton-content" aria-hidden="true">
        <div className="admin-profile-skeleton-main">
          <span className="admin-skeleton-heading image-skeleton" />
          <span className="admin-skeleton-bar full image-skeleton" />
          <span className="admin-skeleton-bar wide image-skeleton" />
          <span className="admin-skeleton-heading image-skeleton" />
          <span className="admin-skeleton-card image-skeleton" />
          <span className="admin-skeleton-card image-skeleton" />
        </div>
        <aside className="admin-profile-skeleton-side image-skeleton" />
      </div>
    </div>
  );
}
