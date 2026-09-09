# `@sentry/nitro`: `enableNitroErrorHandler` is untyped, and the dev server initializes the SDK twice

Milestone: XPlatform Functionality Gaps
Labels: JavaScript, Bug
Priority: Medium

`packages/nitro/src/runtime/hooks/captureErrorHook.ts:38` reads `enableNitroErrorHandler` off the client options with an `in` check, and it works at runtime, but no shipped type declares it for a plain Nitro app: `@sentry/nuxt` carries it on `SentryNuxtServerOptions` (`packages/nuxt/src/common/types.ts:20`) and `@sentry/nitro` has no equivalent, so the TypeScript instrument file the guide prints gets an excess-property error (DOC-Q80, `results-no-error-handler.json`).

Under `nitro dev` with the documented `--import` flag the SDK initializes twice, in the main thread and in the worker, with 92 `Integration installed` lines, and every request sends two segments: a main-thread dev-proxy `GET` with source `url` and the worker's route-named one (`results-dev.json`).

**Work item.** Declare the option on the Nitro server options type, and skip the init in the dev proxy thread.

**Evidence.** Getting-started reproduction [`quickstarts/nitro/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/nitro), run in September 2026 against develop `03aaf42455` (package 10.67.0); results in `results-*.json` and the README of each directory.
