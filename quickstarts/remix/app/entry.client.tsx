// docs: platform-includes/getting-started-complete/javascript.remix.mdx:14-63, copied verbatim with the
// "performance" and "session-replay" options (the "user-feedback" block is left out, as a user who did not
// tick that option sees it). Repro-only additions are marked below: `tunnel` to the local sink, `debug`,
// and the window hooks the driver uses.
import { RemixBrowser, useLocation, useMatches } from "@remix-run/react";
import * as Sentry from "@sentry/remix";
import { startTransition, useEffect } from "react";
import { hydrateRoot } from "react-dom/client";

Sentry.init({
  dsn: "http://public@localhost:4758/1",

  integrations: [
    Sentry.browserTracingIntegration({
      useEffect,
      useLocation,
      useMatches,
    }),
    // Replay is only available in the client
    Sentry.replayIntegration(),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: 1.0,

  // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/session-replay/configuration/#general-integration-configuration
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // repro-only: envelopes go to the local sink, and the SDK prints its debug lines to the console
  tunnel: "http://localhost:4758/tunnel",
  debug: true,
});

// repro-only hooks for drive.mjs
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
  const sdk = client?.getSdkMetadata()?.sdk;
  return {
    initialized: !!client,
    sdk: sdk ? { name: sdk.name, version: sdk.version, packages: sdk.packages } : null,
    integrations: (client?.getOptions().integrations ?? []).map((i) => i.name),
    tracePropagationTargets: (client?.getOptions().tracePropagationTargets ?? []).map(String),
  };
};

startTransition(() => {
  hydrateRoot(document, <RemixBrowser />);
});
