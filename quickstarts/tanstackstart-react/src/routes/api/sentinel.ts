import * as Sentry from "@sentry/tanstackstart-react";
import { createFileRoute } from "@tanstack/react-router";

// Repro-only: the server-side sentinel and identity probe the driver polls for.
export const Route = createFileRoute("/api/sentinel")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const name = new URL(request.url).searchParams.get("name") ?? "sentinel";
        Sentry.captureMessage(name);
        Sentry.startSpan({ name: `${name}-span`, op: "test" }, () => {});
        const client = Sentry.getClient();
        const opts = client?.getOptions();
        return new Response(
          JSON.stringify({
            initialized: !!client,
            sdk: client?.getSdkMetadata()?.sdk,
            integrations: (opts?.integrations ?? []).map((i: { name: string }) => i.name),
            traceLifecycle: (opts as { traceLifecycle?: string } | undefined)?.traceLifecycle,
            node: process.version,
            exports: {
              wrapFetchWithSentry: typeof Sentry.wrapFetchWithSentry,
              sentryGlobalRequestMiddleware: typeof Sentry.sentryGlobalRequestMiddleware,
              sentryGlobalFunctionMiddleware: typeof Sentry.sentryGlobalFunctionMiddleware,
              replayIntegration: typeof Sentry.replayIntegration,
              tanstackRouterBrowserTracingIntegration: typeof Sentry.tanstackRouterBrowserTracingIntegration,
              withErrorBoundary: typeof Sentry.withErrorBoundary,
            },
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      },
    },
  },
});
