// docs/platforms/javascript/guides/effect/index.mdx:188-214 verbatim (Effect v4, Server tab, all four onboarding
// options) plus the two repro-only options (tunnel, debug), followed by the Tracing (index.mdx:316-326) and Logs
// (index.mdx:352-368) verify snippets and the repro-only sentinel, run with Effect.provide + NodeRuntime.runMain.
import * as Sentry from "@sentry/effect";
import { NodeRuntime } from "@effect/platform-node";
import * as Logger from "effect/Logger";
import * as Layer from "effect/Layer";
import * as Tracer from "effect/Tracer";
import * as Effect from "effect/Effect";

const SentryLive = Layer.mergeAll(
  Sentry.effectLayer({
    dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
    // Repro-only additions: deliver envelopes to the local sink and print init debug output.
    tunnel: process.env.SENTRY_TUNNEL,
    debug: true,

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for tracing.
    // We recommend adjusting this value in production.
    tracesSampleRate: 1.0,
  }),

  // Enable Effect tracing
  Layer.succeed(Tracer.Tracer, Sentry.SentryEffectTracer),

  // Forward Effect logs to Sentry
  Logger.layer([Sentry.SentryEffectLogger]),

  // Forward Effect metrics to Sentry
  Sentry.SentryEffectMetricsLayer
);

const sentinel = Effect.gen(function* () {
  Sentry.captureMessage("sentinel");
  yield* Effect.void.pipe(Effect.withSpan("sentinel"));
  yield* Effect.promise(() => Sentry.flush(5000));
});

const program = Effect.gen(function* () {
  yield* Effect.log("User example action completed");

  yield* Effect.logWarning("Slow operation detected").pipe(
    Effect.annotateLogs({
      operation: "data_fetch",
      duration: "3500ms",
    })
  );

  yield* Effect.logError("Validation failed").pipe(
    Effect.annotateLogs({
      field: "email",
      reason: "Invalid email",
    })
  );

  yield* Effect.gen(function* () {
    // Simulate some work
    yield* Effect.sleep("100 millis");
    yield* Effect.fail(new Error("Sentry Test Error"));
  }).pipe(
    Effect.withSpan("My First Test Transaction", {
      attributes: { op: "test" },
    })
  );
});

program.pipe(Effect.ensuring(sentinel), Effect.provide(SentryLive), NodeRuntime.runMain);
