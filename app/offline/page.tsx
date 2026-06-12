// Honest offline state (Section 8) — shown by the service worker when a
// navigation fails with no cached copy. No hanging spinner.
export default function Offline() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-h1 text-foreground">You&apos;re offline</h1>
      <p className="text-body text-muted">
        We can&apos;t reach RoaVa right now. Your saved tickets still work
        without a connection — open them from your tickets.
      </p>
    </main>
  );
}
