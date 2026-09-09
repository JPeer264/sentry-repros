// manual-setup.mdx:119-178 applied to the file `npx react-router reveal` (manual-setup.mdx:99) wrote,
// with the page's default onboarding options (error monitoring, tracing, session replay, user
// feedback; profiling off). Repro-only additions: `tunnel` to the local sink (manual-setup.mdx:527 ->
// getting-started-tunneling/javascript.mdx:14-17), `debug: true`, and the window hooks the driver reads.
import * as Sentry from "@sentry/react-router";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

Sentry.init({
  dsn: "https://public@o1.ingest.sentry.io/1",
  tunnel: "http://localhost:4760/tunnel",
  debug: true,

  integrations: [
    // Registers and configures the Tracing integration,
    // which automatically instruments your application to monitor its
    // performance, including custom React Router routing instrumentation
    Sentry.reactRouterTracingIntegration(),
    // Registers the Replay integration,
    // which automatically captures Session Replays
    Sentry.replayIntegration(),
    Sentry.feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: "system",
    }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/guides/react-router/configuration/options/#traces-sample-rate
  tracesSampleRate: 1.0,

  // Set `tracePropagationTargets` to declare which URL(s) should have trace propagation enabled
  tracePropagationTargets: [/^\//, /^https:\/\/yourserver\.io\/api/],

  // Capture Replay for 10% of all sessions,
  // plus 100% of sessions with an error
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/guides/react-router/session-replay/configuration/#general-integration-configuration
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

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
  Sentry.startSpan({ op: "test", name: `${name}-span` }, () => {});
};
window.__qsMeta = () => {
  const client = Sentry.getClient();
  const options = client?.getOptions() as { _metadata?: { sdk?: unknown } } | undefined;
  return {
    initialized: !!client,
    sdk: options?._metadata?.sdk,
    integrations: client ? Object.keys((client as unknown as { _integrations: object })._integrations) : [],
  };
};

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter onError={Sentry.sentryOnError} />
    </StrictMode>
  );
});
