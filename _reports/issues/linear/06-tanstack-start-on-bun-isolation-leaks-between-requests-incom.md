# TanStack Start on Bun: isolation leaks between requests, incoming traces are ignored, and route names are never produced

Milestone: Bun + Framework gaps
Labels: JavaScript, Bun, Bug
Priority: Medium

The documented wiring builds and runs on Bun as it stands: `sentryTanstackStart()` from `@sentry/tanstackstart-react/vite` last in the Vite plugin list, `sentryGlobalRequestMiddleware` and `sentryGlobalFunctionMiddleware` in `createStart()`, `wrapFetchWithSentry` on the server entry, started with `bun --preload ./.output/server/instrument.server.mjs .output/server/index.mjs`. Errors from `server.handlers` routes and logs arrive. Four capabilities do not. Per-request isolation is recorded broken: three concurrent requests and a sentinel all carried the tags of the last request and one shared trace id, which is a process-global isolation scope leaking tags, and user data with them. Incoming `sentry-trace` and `baggage` are ignored. Outgoing fetch spans are absent. Parameterized names such as `GET /api/user/$id` were never produced. Follow-up runs that added `bunHttpServerIntegration()` were never recorded, so none of the four is claimed fixed.

Database spans need the diagnostics-channel pin from the Bun channel ticket, over `orchestrion:mysql:query`, `orchestrion:mysql2:query` and `orchestrion:mysql2:execute`: the same build gave `["middleware globalRequestMiddleware"]` without it and the two `db` spans with it. Use the stream lifecycle here, under `static` each database span arrives as its own transaction.

**Work item.** Find why the process-global isolation scope leaks between requests on Bun and why the route patterns the Vite plugin inlines never reach the server span, and put a recorded run of the four capabilities with `bunHttpServerIntegration()` on the record.

**Evidence.** Cell record M-tanstack-bun in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-tanstack-bun/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-tanstack-bun), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
