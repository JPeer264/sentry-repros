# React 19: the `reactErrorHandler` root hooks dedupe the ErrorBoundary event away

Milestone: XPlatform Functionality Gaps
Labels: JavaScript, Bug
Priority: Medium

With `onCaughtError: Sentry.reactErrorHandler()` on the root and `Sentry.ErrorBoundary` around the tree, two APIs the SDK ships and the page wires together, the root hook captures first (`auto.function.react.error_handler`, `handled: false`) and the boundary's own event is dropped: five `Not capturing exception because it's already been captured.` lines in one run, and with them the `beforeCapture` tags and the linked component stack of `captureReactException`. On a plain `createRoot` the boundary path works as documented (DOC-Q13, `results-error-boundary.json` against `results-error-boundary-plain.json`).

`reactErrorHandler` also derives `handled` from whether a callback was passed, so `onUncaughtError: Sentry.reactErrorHandler(cb)` reports an error that unmounted the whole root as `handled: true`.

**Work item.** Let the boundary's richer event replace the root hook's, or skip the root hook for an error a Sentry boundary will report. Derive `handled` from the hook rather than from the callback.

**Evidence.** Getting-started reproduction [`quickstarts/react/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/react), run in September 2026 against develop `03aaf42455` (package 10.67.0); results in `results-*.json` and the README of each directory.
