# Nuxt `bun` preset: the server init is never loaded because Bun ignores `NODE_OPTIONS`

Milestone: Bun + Framework gaps
Labels: JavaScript, Bun, Improvement
Priority: Medium

The documented start command loads `sentry.server.config.mjs` through `node --import`. Bun ignores `NODE_OPTIONS` and has no `--import` flag, so under `NITRO_PRESET=bun` and `bun .output/server/index.mjs` the SDK never initializes unless `sentry: { autoInjectServerSentry: "top-level-import" }` is set in `nuxt.config.ts`. With that and the Bun integrations, six of seven capabilities pass. Nitro bundling `mysql2` breaks every query with `genFunc$1 is not a function` regardless of Sentry; `nitro.externals.external: ["mysql2"]` avoids it.

**Work item.** Default `autoInjectServerSentry` to `top-level-import` when the Nitro preset is `bun`, or fail the build with the instruction.

**Evidence.** Cell record M-nuxt-bun in `_reports/deep-probe-report.html`; reproduction `cells/M-nuxt-bun/`, each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
