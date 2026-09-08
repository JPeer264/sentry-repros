# TanStack Start on Bun: Vite plugin order crashes the build, and parameterized route names are never produced

Milestone: Bun + Framework gaps
Labels: JavaScript, Bun, Bug
Priority: Medium

Unless `sentryTanstackStart()` is the first Vite plugin and `@sentry/*` stays external in the Nitro server build, `vite build` dies with `Cannot read properties of null (reading 'getVariableForExportName')`, because Nitro bundles the SDK. With that fixed and the Bun integrations added, errors, isolation, incoming trace, outgoing fetch and logs work under `bun --preload ./instrument.server.mjs .output/server/index.mjs`. Parameterized route names such as `GET /api/user/$id` are still not produced on Bun, and database spans need the diagnostics-channel pin from the Bun channel ticket.

**Work item.** Make the plugin robust to ordering or fail with a clear message, and find why the route patterns do not reach the server span on Bun.

**Evidence.** Cell record M-tanstack-bun in `_reports/deep-probe-report.html`; reproduction `cells/M-tanstack-bun/`, each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
