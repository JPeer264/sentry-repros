// docs/platforms/javascript/guides/effect/index.mdx:313-326 verbatim, then the three repro-only lines
// that run it (Effect.provide + NodeRuntime.runMain).
import { Effect } from "effect";
import * as Sentry from "@sentry/effect";

const program = Effect.gen(function* () {
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

import { NodeRuntime } from "@effect/platform-node";
import { SentryLive } from "./sentry-layer.js";
import { sentinel } from "./sentinel.js";
program.pipe(Effect.ensuring(sentinel), Effect.provide(SentryLive), NodeRuntime.runMain);
