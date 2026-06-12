import "server-only";

/*
  Lightweight, provider-agnostic error capture. Logs structured errors today and
  is the single place to forward to Sentry once a DSN is configured (see
  DEPLOYMENT.md). Used for errors we deliberately swallow (e.g. SMS) so they're
  still visible, and by the instrumentation onRequestError hook for uncaught
  route errors.
*/
export function reportError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const err = error as { message?: string; stack?: string } | undefined;
  console.error(
    "[roava:error]",
    JSON.stringify({
      message: err?.message ?? String(error),
      ...context,
    }),
  );
  // When Sentry is wired: Sentry.captureException(error, { extra: context })
}
