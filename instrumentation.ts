/*
  Next.js instrumentation. `onRequestError` captures uncaught errors from
  Server Components, Route Handlers, and Server Actions with request context.

  To enable Sentry: install @sentry/nextjs, add sentry.server.config, and
  replace the body below with `Sentry.captureRequestError(error, request, context)`
  (or re-export it). Kept dependency-free here so the app ships error capture
  out of the box (see DEPLOYMENT.md).
*/
export async function register() {
  // SDK init point (Sentry/OpenTelemetry) when configured.
}

type ErrorRequest = { path?: string; method?: string };
type ErrorContext = { routerKind?: string; routePath?: string; routeType?: string };

export async function onRequestError(
  error: unknown,
  request: ErrorRequest,
  context: ErrorContext,
): Promise<void> {
  const err = error as { message?: string; digest?: string } | undefined;
  console.error(
    "[roava:request-error]",
    JSON.stringify({
      message: err?.message ?? String(error),
      digest: err?.digest,
      method: request?.method,
      path: request?.path,
      routerKind: context?.routerKind,
      routePath: context?.routePath,
    }),
  );
}
