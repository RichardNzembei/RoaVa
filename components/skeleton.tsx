// Skeleton block — cheap to render, preferred over spinners (CLAUDE.md §8).
// A light shimmer sweeps across the soft fill; respects prefers-reduced-motion
// (the shimmer stills, leaving a calm tinted block) via the global rule.
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-accent-soft animate-shimmer rounded-base motion-reduce:animate-none ${className}`}
    />
  );
}
