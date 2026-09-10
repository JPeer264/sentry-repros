# `@sentry/elysia` on Node reports the Bun SDK name and a `bun` runtime

Milestone: XPlatform Functionality Gaps
Labels: JavaScript, Bug
Priority: Medium

Elysia with `@elysiajs/node` on Node 26.5.0, initialized from `@sentry/elysia` as the guide prints it, sends every event and span with `sdk.name: sentry.javascript.bun` and `contexts.runtime: { name: "bun", version: "unknown" }`, in all eight variants of the run (DOC-Q66, `results-guide.json`). The init delegates to `@sentry/bun` on both runtimes, and `@sentry/elysia` applies its own SDK metadata before the Bun SDK stamps its. Issues and spans from Node deployments are filed against the wrong platform, and the runtime version is never reported.

**Work item.** Pick the base SDK and the reported metadata by runtime in `@sentry/elysia`. Same root as the Elysia on Deno ticket in the Deno milestone, and as JS-3582 and JS-3583.

**Evidence.** Getting-started reproduction [`quickstarts/elysia/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/elysia), run in September 2026 against develop `03aaf42455` (package 10.67.0); results in `results-*.json` and the README of each directory.
