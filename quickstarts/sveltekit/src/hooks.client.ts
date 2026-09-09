// getting-started-complete/javascript.sveltekit.mdx:126-171 verbatim (all four onboarding options),
// with the placeholder DSN pointed at the local sink. Repro additions are marked below.
import * as Sentry from "@sentry/sveltekit";

Sentry.init({
  dsn: "http://public@127.0.0.1:4754/1",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration(),
    Sentry.feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: "system",
    }),
  ],

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/session-replay/configuration/#general-integration-configuration
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Repro additions: the tunneling step (getting-started-tunneling/javascript.sveltekit.mdx:14-17
  // shows `tunnel: "/tunnel"`) pointed at the sink, and debug output for the write-up.
  tunnel: "http://127.0.0.1:4754/tunnel",
  debug: true,
});

const myErrorHandler = ({ error, event }) => {
  console.error("An error occurred on the client side:", error, event);
};

export const handleError = Sentry.handleErrorWithSentry(myErrorHandler);

// or alternatively, if you don't have a custom error handler:
// export const handleError = handleErrorWithSentry();

// Repro hooks for drive.mjs (not on the page).
const w = window as any;
w.Sentry = Sentry;
w.__qsSentinel = (name: string) => {
  Sentry.captureMessage(name);
  Sentry.startSpan({ name: `${name}-span`, op: "test" }, () => {});
};
w.__qsMeta = () => {
  const client = Sentry.getClient() as any;
  const options = client?.getOptions?.() ?? {};
  return {
    initialized: !!client,
    sdk: options._metadata?.sdk,
    integrations: Object.keys(client?._integrations ?? {}),
    tracesSampleRate: options.tracesSampleRate,
    replaysSessionSampleRate: options.replaysSessionSampleRate,
    replaysOnErrorSampleRate: options.replaysOnErrorSampleRate,
    tracePropagationTargets: (options.tracePropagationTargets ?? []).map(String),
  };
};
