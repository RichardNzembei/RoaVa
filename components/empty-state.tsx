import type { ReactNode } from "react";

// A warm, on-brand empty state — a sunlit-hills vignette instead of bare text,
// so "nothing here" still feels considered (design spec §8 states + §7 imagery).
function HillsSun() {
  return (
    <svg
      width="132"
      height="104"
      viewBox="0 0 132 104"
      fill="none"
      aria-hidden
      className="mb-1"
    >
      {/* sun */}
      <circle cx="66" cy="44" r="15" fill="var(--color-accent-soft)" />
      <circle
        cx="66"
        cy="44"
        r="15"
        stroke="var(--color-sunset)"
        strokeWidth="2"
      />
      {[-1, -0.5, 0, 0.5, 1].map((a, i) => (
        <line
          key={i}
          x1={66 + Math.sin(a * 1.1) * 22}
          y1={44 - Math.cos(a * 1.1) * 22}
          x2={66 + Math.sin(a * 1.1) * 28}
          y2={44 - Math.cos(a * 1.1) * 28}
          stroke="var(--color-sunset)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
      {/* back hill */}
      <path
        d="M-4 72 C 24 56, 52 62, 80 58 S 124 52, 136 60 L136 104 L-4 104 Z"
        fill="var(--color-accent-soft)"
      />
      {/* front hill */}
      <path
        d="M-4 84 C 30 70, 62 80, 94 74 S 130 72, 136 78 L136 104 L-4 104 Z"
        fill="var(--color-savanna)"
        fillOpacity="0.9"
      />
    </svg>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-hairline rounded-card bg-surface flex flex-col items-center gap-2 border px-6 py-12 text-center">
      <HillsSun />
      <h2 className="text-h3 text-foreground">{title}</h2>
      {body ? <p className="text-small text-muted max-w-xs">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
