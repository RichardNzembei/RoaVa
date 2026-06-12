"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Locale } from "@/lib/i18n";

// EN / SW switch. Sets the locale cookie and refreshes so server components
// re-render in the chosen language.
export function LanguageToggle({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function set(next: Locale) {
    if (next === locale) return;
    document.cookie = `roava-locale=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div className="text-caption flex items-center gap-1" aria-label="Language">
      <button
        type="button"
        onClick={() => set("en")}
        aria-pressed={locale === "en"}
        className={locale === "en" ? "text-sunset" : "text-muted"}
      >
        EN
      </button>
      <span className="text-muted">/</span>
      <button
        type="button"
        onClick={() => set("sw")}
        aria-pressed={locale === "sw"}
        className={locale === "sw" ? "text-sunset" : "text-muted"}
      >
        SW
      </button>
    </div>
  );
}
