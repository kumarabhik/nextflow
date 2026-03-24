export function formatDurationLabel(durationMs: number) {
  return `${(durationMs / 1000).toFixed(durationMs >= 1000 ? 1 : 2)}s`;
}

export function formatRunTimestampLabel(timestampMs: number) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(timestampMs));
}

export function formatSavedAtLabel(timestampMs: number) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestampMs));
}
