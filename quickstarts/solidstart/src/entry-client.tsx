// index.mdx:93-140 verbatim (all four product options), with the DSN placeholder filled, the
// `tunnel` option from getting-started-tunneling/javascript.mdx:14-17 pointed at the local sink,
// and `debug: true` (a repro addition, the page has no debug step).
import * as Sentry from "@sentry/solidstart";
// import solidRouterBrowserTracingIntegration if you're using Solid Router
import { solidRouterBrowserTracingIntegration } from "@sentry/solidstart/solidrouter";
import { mount, StartClient } from "@solidjs/start/client";

Sentry.init({
  dsn: "https://public@dsn.ingest.sentry.io/1337",
  tunnel: "http://localhost:4764/tunnel",
  debug: true,
  integrations: [
    // add solidRouterBrowserTracingIntegration if you're using Solid Router
    solidRouterBrowserTracingIntegration(),
    // Replay may only be enabled for the client-side
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
  // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: 1.0,

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/session-replay/configuration/#general-integration-configuration
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

mount(() => <StartClient />, document.getElementById("app"));

// Repro hooks for drive.mjs, not from the docs.
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
  const options = client?.getOptions();
  return {
    initialized: !!client,
    sdk: options?._metadata?.sdk,
    integrations: options?.integrations?.map((i) => i.name),
    tracesSampleRate: options?.tracesSampleRate,
    traceMeta: {
      sentryTrace: document.querySelector('meta[name="sentry-trace"]')?.getAttribute("content") ?? null,
      baggage: document.querySelector('meta[name="baggage"]')?.getAttribute("content") ?? null,
    },
  };
};
