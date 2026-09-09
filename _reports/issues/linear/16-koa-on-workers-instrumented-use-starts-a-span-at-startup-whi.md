# Koa on Workers: instrumented `use()` starts a span at startup, which workerd rejects

Milestone: Cloudflare + Framework gaps
Labels: JavaScript, Cloudflare Workers, Bug
Priority: Medium

Creating the Koa app at module scope makes the Worker fail to start with `Disallowed operation called within global scope`, because the instrumented `app.use()` starts a span outside any request. The app, every `use()`, the router wiring and `app.listen()` must run inside the fetch handler behind a memoized promise; `httpServerHandler({ port })` may stay at module scope. Express and Hapi hit the same wall from their own module-scope route registration once build-time instrumentation is on. With the lazy construction and the Vite plugin build, all seven capabilities pass, including `auto.middleware.koa` errors, whose listener the Koa integration attaches itself, and `http.route`.

**Work item.** Make the Koa `use` instrumentation record nothing when there is no active request or isolation scope, so module-scope construction works on workerd.

**Evidence.** Cell record M-koa-cf in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-koa-cf/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-koa-cf), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
