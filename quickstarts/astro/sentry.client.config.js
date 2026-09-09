// getting-started-complete/javascript.astro.mdx:214-251 verbatim (error-monitoring, performance,
// session-replay and user-feedback options), plus the repro-only lines at the end.
import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: "http://public@127.0.0.1:4756/1",

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
    Sentry.feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: "system",
    }),
  ],

  // Define how likely traces are sampled. Adjust this value in production,
  // or use tracesSampler for greater control.
  tracesSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // If the entire session is not sampled, use the below sample rate to sample
  // sessions when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // repro-only: getting-started-tunneling/javascript.mdx:14-17 shows `tunnel: "/tunnel"`; the sink is
  // a separate origin here, and `debug` prints the installed integrations to the browser console.
  tunnel: "http://127.0.0.1:4756/tunnel",
  debug: true,
});
