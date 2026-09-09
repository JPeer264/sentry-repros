// docs/platforms/javascript/guides/effect/index.mdx:286-293 verbatim, then the three repro-only lines
// that run it the way the Configure step runs its layer (Effect.provide + NodeRuntime.runMain).
import { Effect } from "effect";
import * as Sentry from "@sentry/effect";

const program = Effect.gen(function* () {
  yield* Effect.fail(new Error("Sentry Test Error"));
});

// Run with your layer that includes Sentry.effectLayer
import { NodeRuntime } from "@effect/platform-node";
import { SentryLive } from "./sentry-layer.js";
import { sentinel } from "./sentinel.js";
program.pipe(Effect.ensuring(sentinel), Effect.provide(SentryLive), NodeRuntime.runMain);
