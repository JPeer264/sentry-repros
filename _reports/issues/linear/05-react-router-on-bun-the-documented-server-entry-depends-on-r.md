# React Router on Bun: the documented server entry depends on `renderToPipeableStream`, which Bun does not provide

Milestone: Bun + Framework gaps
Labels: JavaScript, Bun, Bug
Priority: Medium

Bun resolves `react-dom/server` to a build without `renderToPipeableStream`, so `createSentryHandleRequest({ renderToPipeableStream, ... })` from the guide cannot be used. The verified entry uses `renderToReadableStream` with `Sentry.wrapSentryHandleRequest(handler)` and `export const handleError = Sentry.createSentryHandleError({ logErrors: true })`. The customization escape hatch at `manual-setup.mdx:284-330` (`getMetaTagTransformer` plus `wrapSentryHandleRequest`) builds on `renderToPipeableStream` too and needs the same variant.

Two further things are required on Bun that the guide calls optional or never mentions. `export const instrumentations = [Sentry.createSentryServerInstrumentation()];` is what produces a route-named `http.server` span at all, while `manual-setup.mdx:273` presents it as optional, which holds only for Node. `bunHttpServerIntegration()` from `@sentry/bun` on top of it restores per-request isolation, incoming trace continuation, outgoing fetch spans and database spans; without both, only errors and logs arrive. Gate the integrations on the runtime (`process.versions.bun ? [fetchIntegration(), bunHttpServerIntegration()] : []`), or Node gets two client spans per `fetch`.

**Work item.** Ship a `renderToReadableStream` variant of `createSentryHandleRequest` and of the `getMetaTagTransformer` escape hatch, or name `wrapSentryHandleRequest` as the Bun path in the package docs. Make the `instrumentations` export unnecessary on Bun, or state that it is required there.

**Evidence.** Cell record M-reactrouter-bun in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-reactrouter-bun/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-reactrouter-bun), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
