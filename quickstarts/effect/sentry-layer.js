// docs/platforms/javascript/guides/effect/index.mdx:88-110,116 (Effect v3, Server tab, error-monitoring +
// performance + logs selected, metrics not selected), plus the two repro-only options (tunnel, debug).
import * as Sentry from "@sentry/effect";
import * as Logger from "effect/Logger";
import * as Layer from "effect/Layer";

export const SentryLive = Layer.mergeAll(
  Sentry.effectLayer({
    dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
    // Repro-only additions: deliver envelopes to the local sink and print init debug output.
    tunnel: process.env.SENTRY_TUNNEL,
    debug: true,

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for tracing.
    // We recommend adjusting this value in production.
    // Learn more at
    // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
    tracesSampleRate: 1.0,
  }),

  // Enable Effect tracing
  Layer.setTracer(Sentry.SentryEffectTracer),

  // Forward Effect logs to Sentry
  Logger.replace(Logger.defaultLogger, Sentry.SentryEffectLogger)
);
