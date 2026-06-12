// Rating shown with a star icon AND the number — never colour/shape alone.
export function StarRating({
  avg,
  count,
  showCount = true,
}: {
  avg: number;
  count: number;
  showCount?: boolean;
}) {
  return (
    <span className="text-small text-foreground inline-flex items-center gap-1">
      <span aria-hidden className="text-warning">
        ★
      </span>
      <span>{avg.toFixed(1)}</span>
      {showCount ? (
        <span className="text-muted">
          ({count} review{count === 1 ? "" : "s"})
        </span>
      ) : null}
    </span>
  );
}
