// Skeleton block — cheap to render, preferred over spinners (CLAUDE.md §8).
// Animation respects prefers-reduced-motion via the global rule in globals.css.
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-accent-soft animate-pulse rounded-base motion-reduce:animate-none ${className}`}
    />
  );
}
