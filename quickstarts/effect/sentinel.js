// Repro-only. Runs after each program (Effect.ensuring): one message, one Effect span through the
// same tracer, then a transport flush. The run polls the sink for these instead of sleeping.
import * as Sentry from "@sentry/effect";
import * as Effect from "effect/Effect";

export const sentinel = Effect.gen(function* () {
  Sentry.captureMessage("sentinel");
  yield* Effect.void.pipe(Effect.withSpan("sentinel"));
  yield* Effect.promise(() => Sentry.flush(5000));
});
