# React Router on Bun: the documented server entry depends on `renderToPipeableStream`, which Bun does not provide

Milestone: Bun + Framework gaps
Labels: JavaScript, Bun, Bug
Priority: Medium

Bun resolves `react-dom/server` to a build without `renderToPipeableStream`, so `createSentryHandleRequest({ renderToPipeableStream, ... })` from the guide cannot be used. The verified entry uses `renderToReadableStream` with `Sentry.wrapSentryHandleRequest(handler)` and `export const handleError = Sentry.createSentryHandleError({ logErrors: true })`. With that, the documented `instrumentations` export, and the Bun integrations from the umbrella ticket, all seven capabilities pass.

**Work item.** Ship a `renderToReadableStream` variant of `createSentryHandleRequest`, or name `wrapSentryHandleRequest` as the Bun path in the package docs.

**Evidence.** Cell record M-reactrouter-bun in `_reports/deep-probe-report.html`; reproduction `cells/M-reactrouter-bun/`, each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
