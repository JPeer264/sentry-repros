# Hono on Bun: a `Bun.build` that externalizes `@sentry/*` while inlining `hono` 500s every request

Milestone: Bun + Framework gaps
Labels: JavaScript, Bun, Bug
Priority: Medium

`bun app.ts` with `@sentry/hono/bun` gives `GET /users/:id` (source `route`) and the `auto.http.hono.context_error` event, with no instrument file and no `--preload`, because the middleware calls `Sentry.init` itself. A `Bun.build` with `sentryBunPlugin()` and `external: ["@sentry/*"]` keeps `@sentry/hono` external but inlines `hono`, which leaves two copies of hono's `GET_MATCH_RESULT` symbol in the process: every request then 500s inside `@sentry/hono`'s `requestHandler`. The working choices are no `external` at all, which is the verified recipe, or `hono` externalized together with `@sentry/*`, which behaves exactly like the unbundled run.

The bundle is what adds spans for drivers that publish no diagnostics channels of their own, such as `mysql@2`; `mysql2` 3.20.0+ needs no build step, as long as the driver is queried early or the channels are pinned.

**Work item.** Make `@sentry/hono` survive a second copy of `hono` in the bundle, or detect the duplicate at init and fail with the fix, which is to drop `external` or to externalize `hono` too.

**Evidence.** Cell record M-hono-bun in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-hono-bun/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-hono-bun), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
