// docs/platforms/javascript/guides/effect/index.mdx:286-293 verbatim, run with Effect.runPromise (the
// other obvious reading of "Run with your layer"). No sentinel: the process exit is the terminal condition.
import { Effect } from "effect";
import * as Sentry from "@sentry/effect";

const program = Effect.gen(function* () {
  yield* Effect.fail(new Error("Sentry Test Error"));
});

// Run with your layer that includes Sentry.effectLayer
import { SentryLive } from "./sentry-layer.js";
Effect.runPromise(program.pipe(Effect.provide(SentryLive)));
