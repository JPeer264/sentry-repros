// docs/platforms/javascript/guides/effect/index.mdx:349-368 verbatim, then the three repro-only lines
// that run it (Effect.provide + NodeRuntime.runMain).
import { Effect } from "effect";
import * as Sentry from "@sentry/effect";

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
});

import { NodeRuntime } from "@effect/platform-node";
import { SentryLive } from "./sentry-layer.js";
import { sentinel } from "./sentinel.js";
program.pipe(Effect.ensuring(sentinel), Effect.provide(SentryLive), NodeRuntime.runMain);
