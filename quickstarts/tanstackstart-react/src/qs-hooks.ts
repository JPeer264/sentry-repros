// Repro-only: exposes the client SDK and a sentinel to the driver. Not part of the docs.
import * as Sentry from "@sentry/tanstackstart-react";

declare global {
  interface Window {
    Sentry: typeof Sentry;
    __qsSentinel: (name: string) => void;
    __qsMeta: () => unknown;
  }
}

window.Sentry = Sentry;
window.__qsSentinel = (name: string) => {
  Sentry.captureMessage(name);
  Sentry.startSpan({ name: `${name}-span`, op: "test" }, () => {});
};
window.__qsMeta = () => {
  const client = Sentry.getClient();
  const opts = client?.getOptions();
  return {
    initialized: !!client,
    sdk: client?.getSdkMetadata()?.sdk,
    integrations: (opts?.integrations ?? []).map((i: { name: string }) => i.name),
    traceLifecycle: (opts as { traceLifecycle?: string } | undefined)?.traceLifecycle,
    exports: {
      replayIntegration: typeof Sentry.replayIntegration,
      feedbackIntegration: typeof Sentry.feedbackIntegration,
      addIntegration: typeof Sentry.addIntegration,
      tanstackRouterBrowserTracingIntegration: typeof Sentry.tanstackRouterBrowserTracingIntegration,
      withErrorBoundary: typeof Sentry.withErrorBoundary,
      captureException: typeof Sentry.captureException,
      startSpan: typeof Sentry.startSpan,
      wrapFetchWithSentry: typeof (Sentry as Record<string, unknown>).wrapFetchWithSentry,
      sentryGlobalRequestMiddleware: typeof Sentry.sentryGlobalRequestMiddleware,
      sentryGlobalFunctionMiddleware: typeof Sentry.sentryGlobalFunctionMiddleware,
    },
  };
};
