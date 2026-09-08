# Koa on Workers: instrumented `use()` starts a span at startup, which workerd rejects

Milestone: Cloudflare + Framework gaps
Labels: JavaScript, Cloudflare Workers, Bug
Priority: Medium

Creating the Koa app at module scope makes the Worker fail to start with `Disallowed operation called within global scope`, because the instrumented `app.use()` starts a span outside any request. The app, every `use()`, the router wiring and `app.listen()` must run inside the fetch handler behind a memoized promise; `httpServerHandler({ port })` may stay at module scope. With that and the Vite plugin build, all seven capabilities pass, including `auto.middleware.koa` errors and `http.route`.

**Work item.** Make the Koa `use` instrumentation record nothing when there is no active request or isolation scope, so module-scope construction works on workerd.

**Evidence.** Cell record M-koa-cf in `_reports/deep-probe-report.html`; reproduction `cells/M-koa-cf/`, each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
