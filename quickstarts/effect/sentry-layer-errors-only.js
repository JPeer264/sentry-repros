// docs/platforms/javascript/guides/effect/index.mdx:88-116 with only the "error-monitoring" onboarding
// option (no tracer, logger or metrics layer), plus the two repro-only options (tunnel, debug).
import * as Sentry from "@sentry/effect";
import * as Layer from "effect/Layer";

export const SentryLive = Layer.mergeAll(
  Sentry.effectLayer({
    dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
    // Repro-only additions: deliver envelopes to the local sink and print init debug output.
    tunnel: process.env.SENTRY_TUNNEL,
    debug: true,
  })
);
