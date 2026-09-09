# Nuxt `bun` preset: no request span unless `bunServerIntegration()` is added by hand

Milestone: Bun + Framework gaps
Labels: JavaScript, Bun, Improvement
Priority: Medium

The server init no longer needs a start-up flag or an inject mode: since develop commit `ec50b3e8f1` the Nitro build bundles `sentry.server.config.ts` and imports it from a generated Nitro plugin, so `Sentry.init` runs at server startup under `NITRO_PRESET=bun npx nuxt build` and `bun run .output/server/index.mjs`. Both `autoInjectServerSentry` modes are deprecated as of that commit and keep working until v12, and the config is no longer emitted to `.output/server/sentry.server.config.mjs`.

What Bun still needs is the server instrumentation. Without `bunServerIntegration()` from `@sentry/bun` there is no request span at all: every event in the process shares one trace id, a stale transaction name leaks from an earlier request onto every later event, names are not route-based, incoming trace headers are ignored, and the `mysql2` span is dropped too, because its subscriber binds with `requiresParentSpan: true` and has no request span to attach to. The cause is the runtime rather than the preset, Bun never publishes `http.server.request.start` (0 events on Bun against 1 on Node), and the default `node-server` preset under Bun needs `bunHttpServerIntegration()` for the same reason. Nitro bundling `mysql2` is a separate problem: without `nitro.externals.external: ["mysql2"]` the query itself fails with `genFunc$1 is not a function`, with or without Sentry, and with the entry but no `bunServerIntegration()` the query succeeds and no span is recorded.

**Work item.** Add the Bun server integration from the `@sentry/nuxt` server side when the runtime is Bun, so the documented wiring produces a request span on both presets.

**Evidence.** Cell record M-nuxt-bun in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-nuxt-bun/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-nuxt-bun), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
