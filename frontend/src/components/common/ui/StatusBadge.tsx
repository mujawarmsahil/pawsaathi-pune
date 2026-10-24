export function StatusBadge({ status }: { status: string }) {
  const label = status
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  return <span className={`status-pill status-${status.toLowerCase()}`}>{label}</span>;
}
