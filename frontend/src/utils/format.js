/**
 * Console display formatting — dates, times and byte sizes, in the platform's
 * en-IN voice. Prices stay with the Price component / its formatter.
 */

/** "17 Sep 2026, 2:55 pm" */
export function formatDateTime(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/** "17 Sep 2026" */
export function formatDate(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** "182 KB" / "1.4 MB" */
export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** "1,600 × 1,067" */
export function formatDimensions(dimensions) {
  if (!dimensions?.width || !dimensions?.height) return "—";
  return `${dimensions.width.toLocaleString("en-IN")} × ${dimensions.height.toLocaleString("en-IN")} px`;
}
