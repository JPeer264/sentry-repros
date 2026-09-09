# Google Cloud Functions: an HTTP invocation splits into two root spans, and the callback wrappers never end the function span

Milestone: XPlatform Functionality Gaps
Labels: JavaScript, Bug
Priority: Medium

`wrapHttpFunction` calls `continueTrace` before `startSpanManual` (`packages/google-cloud-serverless/src/gcpfunction/http.ts:48-52`). With no incoming headers that starts a fresh trace, so every HTTP invocation produced two segments in two traces, `Serverless function execution` (`function.gcp`) and the framework's `http.server GET`, with the error linked to the function trace only; with `sentry-trace` and `baggage` present the two share a trace but stay siblings, never nested. The event and cloud-event wrappers do not call `continueTrace` and their span is a child of the `http.server` segment (DOC-Q70, `results-http-config.json`, `results-event-tracing.json`).

The callback wrappers have a second defect. For a three-parameter handler `wrapEventFunction` takes the callback branch (`packages/google-cloud-serverless/src/gcpfunction/events.ts:69-76`), where `span.end()` only runs inside the callback. A handler that throws synchronously is captured by `handleCallbackErrors` and rethrown, the callback never runs, and no `function.gcp` span is sent at all, which is the shape both config snippets print (`results-event-config.json`, `results-cloudevent-config.json`).

**Work item.** Start the function span first and continue the trace inside it; end the span on the error path of the callback wrappers.

**Evidence.** Getting-started reproduction [`quickstarts/gcp-functions/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/gcp-functions), run in September 2026 against develop `03aaf42455` (package 10.67.0); results in `results-*.json` and the README of each directory.
