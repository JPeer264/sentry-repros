// The "./Http.js" the guide imports at index.mdx:86 but never shows. Repro-only: a layer that runs the
// tracing verify program (index.mdx:316-326) followed by the sentinel, instead of an HTTP server.
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { sentinel } from "./sentinel.js";

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

export const HttpLive = Layer.effectDiscard(program.pipe(Effect.ensuring(sentinel)));
