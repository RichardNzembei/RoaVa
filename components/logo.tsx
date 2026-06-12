// RoaVa wordmark. The capital V is the brand mark (Savanna) — it echoes the
// app icon's peak/route symbol — set against the Sunset name.
export function Logo({ className = "text-h2" }: { className?: string }) {
  return (
    <span className={`${className} tracking-tight whitespace-nowrap`} aria-label="RoaVa">
      <span className="text-sunset">Roa</span>
      <span className="text-savanna">V</span>
      <span className="text-sunset">a</span>
    </span>
  );
}
