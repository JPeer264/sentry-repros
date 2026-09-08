# Remix on Bun: the request handler patch never runs when the server runtime is inlined

Milestone: Bun + Framework gaps
Labels: JavaScript, Bun, Bug
Priority: Medium

Plain `bun server.mjs` sends errors and logs only, no transactions and no spans. Bundling the server entry with `Bun.build({ plugins: [sentryBunPlugin()] })` and running `bun dist/server.js` gives route-named transactions, `LOADER routes/users.$id` children, database spans and outgoing fetch spans. Because the bundle inlines `@remix-run/server-runtime`, Sentry's `createRequestHandler` patch never runs, so per-request isolation and incoming trace continuation only work when the app wraps the adapter handler in `withIsolationScope` and `continueTrace` itself, or adds `bunHttpServerIntegration({ spans: false })`.

Two app-side traps: `"sideEffects": false` in the app's `package.json` makes `Bun.build` tree-shake the side-effect-only driver import, and `express` must go back on `external` after the plugin has run.

**Work item.** Apply the request handler patch to an inlined server runtime (the plugin can transform it), and warn when `sideEffects: false` drops an instrumented import.

**Evidence.** Cell record M-remix-bun in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-remix-bun/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-remix-bun), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
