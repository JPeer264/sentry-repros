// docs/platforms/javascript/guides/cloudflare/index.mdx:174-201, verbatim except for the
// two harness lines marked below (they route envelopes to the local sink on 127.0.0.1:4747).
import * as Sentry from "@sentry/cloudflare";

export const onRequest = [
  // Make sure Sentry is the first middleware
  Sentry.sentryPagesPlugin((context) => ({
    dsn: "https://1234567890abcdef1234567890abcdef@o1.ingest.sentry.io/1",

    dataCollection: {
      // Any dataCollection object (including {}) uses permissive defaults:
      // userInfo, cookies, HTTP bodies, genAI prompts/responses, and more.
      // Uncomment to tighten. Details:
      // https://docs.sentry.io/platforms/javascript/guides/cloudflare/configuration/options/#dataCollection
      // userInfo: false,
      // httpBodies: [],
      // genAI: { inputs: false, outputs: false },
    },

    // Set tracesSampleRate to 1.0 to capture 100% of spans for tracing.
    // Learn more at
    // https://docs.sentry.io/platforms/javascript/guides/cloudflare/configuration/options/#tracesSampleRate
    tracesSampleRate: 1.0,

    tunnel: "http://127.0.0.1:4747/", // harness: local sink instead of sentry.io
    debug: true, // harness: print SDK init and per-request debug lines
  })),
  // Add more middlewares here
];
