"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";

// Theme control. Persists to localStorage ('roava-theme') which the no-flash
// script in the root layout reads on load. "system" follows the OS; light/dark
// force a mode via a class on <html>.
function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  if (theme === "system") {
    localStorage.removeItem("roava-theme");
  } else {
    localStorage.setItem("roava-theme", theme);
    root.classList.add(theme);
  }
}

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function ThemeToggle({ label }: { label: string }) {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    // Post-mount read of a client-only store (localStorage is unavailable during
    // SSR), so syncing state here is intentional and runs once.
    const stored = localStorage.getItem("roava-theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(stored === "dark" ? "dark" : stored === "light" ? "light" : "system");
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    apply(next);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-small text-foreground">{label}</span>
      <div className="border-hairline inline-flex w-fit rounded-base border p-0.5">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={theme === o.value}
            onClick={() => choose(o.value)}
            className={`text-small ease-out-soft min-h-10 rounded-[6px] px-4 transition-colors duration-200 ${
              theme === o.value
                ? "bg-sunset text-accent-contrast"
                : "text-muted"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
