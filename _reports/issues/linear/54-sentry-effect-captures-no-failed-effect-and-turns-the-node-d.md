# `@sentry/effect` captures no failed effect and turns the Node defaults off

Milestone: XPlatform Functionality Gaps
Labels: JavaScript, Bug
Priority: Medium

Nothing in `packages/effect/src` calls `captureException`, `captureMessage` or `captureEvent`, so a failed effect is never reported: `yield* Effect.fail(new Error("Sentry Test Error"))`, the guide's own verify step, produced no error event in any variant that ran it (DOC-Q76, `results-issues.json`, `results-launch.json`, `results-v4.json`). `packages/effect/src/server/sdk.ts:17` sets `defaultIntegrations: options.defaultIntegrations ?? false`, so the global handlers that would otherwise catch the crash are off as well and only `SpanStreaming` is installed (DOC-Q77). The SDK's own e2e app captures failures by hand with `captureException(Cause.squash(cause))`.

**Work item.** Capture failed effects from the layer, and either keep the Node default integrations or say at init which ones were dropped.

**Evidence.** Getting-started reproduction [`quickstarts/effect/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/effect), run in September 2026 against develop `03aaf42455` (package 10.67.0); results in `results-*.json` and the README of each directory.
