"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/*
  Mobile bottom tab bar (mobile-first nav, §8). Shown only below `sm`; the top
  header carries the same destinations on larger screens. Big thumb-reachable
  64px targets, icon + label (colour is never the only active cue), safe-area
  aware. Mirrors the header IA so there's no new navigation model to learn.
*/
type Tab = {
  href: string;
  label: string;
  match: string[]; // path prefixes that mark this tab active
  icon: ReactNode;
};

export type BottomNavLabels = {
  explore: string;
  tickets: string;
  operator: string;
  account: string;
  signIn: string;
};

const sw = 1.75;
const Icon = ({ children }: { children: ReactNode }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
);

const ExploreIcon = (
  <Icon>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Icon>
);
const TicketIcon = (
  <Icon>
    <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4Z" />
    <line x1="15" y1="7" x2="15" y2="17" strokeDasharray="2 2" />
  </Icon>
);
const OperatorIcon = (
  <Icon>
    <path d="M4 8h16l-1 4a3 3 0 0 1-6 0 3 3 0 0 1-6 0Z" />
    <path d="M5 12v7h14v-7" />
    <path d="M4 8l1.5-3h13L20 8" />
  </Icon>
);
const AccountIcon = (
  <Icon>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c0-3.5 3.1-5.5 7-5.5s7 2 7 5.5" />
  </Icon>
);

export function BottomNav({
  signedIn,
  isOperator,
  labels,
}: {
  signedIn: boolean;
  isOperator: boolean;
  labels: BottomNavLabels;
}) {
  const pathname = usePathname();

  const explore: Tab = {
    href: "/discover",
    label: labels.explore,
    match: ["/discover", "/experiences"],
    icon: ExploreIcon,
  };
  const tabs: Tab[] = signedIn
    ? [
        explore,
        { href: "/tickets", label: labels.tickets, match: ["/tickets", "/bookings"], icon: TicketIcon },
        { href: "/operator", label: labels.operator, match: ["/operator"], icon: OperatorIcon },
        { href: "/account", label: labels.account, match: ["/account"], icon: AccountIcon },
      ]
    : [
        explore,
        { href: "/sign-in", label: labels.signIn, match: ["/sign-in"], icon: AccountIcon },
      ];

  void isOperator; // operator vs "list with us" label is resolved by the caller

  return (
    <nav
      aria-label="Primary"
      className="glass border-hairline fixed inset-x-0 bottom-0 z-20 flex border-t pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      {tabs.map((t) => {
        const active = t.match.some(
          (m) => pathname === m || pathname.startsWith(`${m}/`),
        );
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className="text-caption ease-out-soft flex min-h-16 flex-1 flex-col items-center justify-center gap-1 transition-transform duration-200 active:scale-95"
          >
            {/* Active tab gets a frosted pill behind the icon — a second,
                non-colour cue (shape) alongside the Sunset tint. */}
            <span
              className={`ease-out-soft flex h-8 w-12 items-center justify-center rounded-full transition-colors duration-200 ${
                active ? "bg-accent-soft text-sunset" : "text-muted"
              }`}
            >
              {t.icon}
            </span>
            <span className={active ? "text-sunset" : "text-muted"}>
              {t.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
