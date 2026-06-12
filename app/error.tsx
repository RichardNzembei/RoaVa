"use client";

import { Button } from "@/components/ui/button";

// Global error boundary — honest, friendly, with a way forward (CLAUDE.md §8).
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-h1 text-foreground">Something went wrong</h1>
      <p className="text-body text-muted">
        That&apos;s on us, not you. Try again — your bookings and payments are
        safe.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
