# Hapi on Workers: an early `close` turns every response into a 499 and the error event never fires

Milestone: Cloudflare + Framework gaps
Labels: JavaScript, Cloudflare Workers, Bug
Priority: Medium

On workerd the response emits `close` before `finish` with `writableEnded` still false. Hapi reads that as a client disconnect, answers 499, and its `request` and `error` events never fire, so `hapiIntegration` captures nothing. An app-side `onRequest` extension that drops the premature `close` before Hapi's transmit sees it restores capture, the transaction name and the `auto.function.hapi` mechanism; an `onPreResponse` extension that calls `captureException` when `request.response.isBoom` is the fallback. Route names, isolation, incoming trace, outgoing fetch, database spans and logs work with build-time instrumentation, and a four-line `onPreResponse` rename gets route names on a plain `wrangler` build as well.

`hapiIntegration()` is neither a Cloudflare default integration nor re-exported by `@sentry/cloudflare`, so it has to be imported from `@sentry/server-utils` by hand.

**Work item.** Handle the early `close` inside `hapiIntegration` or the Cloudflare HTTP server shim, so Hapi on workerd needs no app-side extension. Re-export `hapiIntegration` from `@sentry/cloudflare`, or add it to the defaults there.

**Evidence.** Cell record M-hapi-cf in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-hapi-cf/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-hapi-cf), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
