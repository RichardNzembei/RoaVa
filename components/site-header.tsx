import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { getT, getLocale } from "@/lib/i18n";
import { Logo } from "@/components/logo";
import { LanguageToggle } from "@/components/language-toggle";

// Auth-aware top bar. Server component — re-renders per request from the
// session cookie, so it reflects sign-in/out and role changes immediately.
export async function SiteHeader() {
  const profile = await getProfile();
  const isOperator = profile?.role === "operator" || profile?.role === "admin";
  const t = await getT();
  const locale = await getLocale();

  return (
    <header className="border-hairline bg-background/90 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-5">
        <Link href="/" aria-label="RoaVa home">
          <Logo />
        </Link>

        {/* Full-height links give ~56px-tall tap targets (≥48px min, §7). */}
        <nav className="-mr-2 flex h-full items-center gap-1">
          <Link
            href="/discover"
            className="text-small text-foreground flex h-full items-center px-2 active:opacity-80"
          >
            {t("nav_explore")}
          </Link>
          {profile ? (
            <>
              <Link
                href="/tickets"
                className="text-small text-foreground flex h-full items-center px-2 active:opacity-80"
              >
                {t("nav_tickets")}
              </Link>
              <Link
                href="/operator"
                className="text-small text-savanna flex h-full items-center px-2 active:opacity-80"
              >
                {isOperator ? t("nav_operator") : t("nav_list")}
              </Link>
              <Link
                href="/account"
                className="text-small text-foreground flex h-full items-center px-2 active:opacity-80"
              >
                {t("nav_account")}
              </Link>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="text-small text-sunset flex h-full items-center px-2 active:opacity-80"
            >
              {t("nav_signin")}
            </Link>
          )}
          <LanguageToggle locale={locale} />
        </nav>
      </div>
    </header>
  );
}
