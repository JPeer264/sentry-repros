# The Lambda `_HANDLER` shim wraps the handler again, so `wrapHandler` options never apply

Milestone: XPlatform Functionality Gaps
Labels: JavaScript, Bug
Priority: Medium

`awsLambdaIntegration` rewrites `_HANDLER` to a shim that loads the user's export and passes it through `instrumentHandler`, which ends in `wrapHandler(patched)` with no options (`packages/aws-serverless/src/instrumentHandler.ts:53` and `:56`). Nothing checks whether the export is already a `wrapHandler` result, so the user's options sit inside a second wrapper that runs with defaults. With `Sentry.wrapHandler(handler, { flushTimeout: 1000, captureTimeoutWarning: false })` in the handler file a `Possible function timeout: qs-aws-lambda` warning event still arrived (DOC-Q73, `results-manual-esm-wrap-options.json`); `flushTimeout` and `timeoutWarningLimit` are unreachable the same way.

**Work item.** Mark handlers produced by `wrapHandler` and let the shim reuse the inner wrapper instead of adding a default outer one.

**Evidence.** Getting-started reproduction [`quickstarts/aws-lambda/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/aws-lambda), run in September 2026 against develop `03aaf42455` (package 10.67.0); results in `results-*.json` and the README of each directory.
