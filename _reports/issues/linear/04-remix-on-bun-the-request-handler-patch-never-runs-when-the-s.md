# Remix on Bun: the request handler patch never runs when the server runtime is inlined

Milestone: Bun + Framework gaps
Labels: JavaScript, Bun, Bug
Priority: Medium

Plain `bun server.mjs` sends errors and logs only: no transactions, no spans, and no `transaction` field on the events, so errors group without a route. Per-request isolation and incoming trace continuation do work there. Bundling the server entry with `Bun.build({ plugins: [sentryBunPlugin()] })` and running `bun dist/server.js` gives route-named transactions (`GET users/:id`, source `route`, with no leading slash), `function LOADER routes/users.$id` children and `mysql2` database spans; outgoing fetch spans did not reproduce on the re-run, where `sentry-trace` and `baggage` came back null on every attempt. Because the bundle inlines `@remix-run/server-runtime`, Sentry's `createRequestHandler` patch never runs, so per-request isolation and incoming trace continuation come back only when the app wraps the adapter handler itself, an `app.all('*', ...)` around it with `withIsolationScope`, `continueTrace` and `setSDKProcessingMetadata({ normalizedRequest })`, the last of which is also what puts request data on the events.

The split has one root cause in the SDK: the `loadModule` monkeypatch and `withoutInstrumentedExternals` give spans or isolation, never both. `express` must go back on `external` after the plugin has run, through a keep-external plugin appended after `sentryBunPlugin()`, because the plugin un-externalizes the packages it instruments. A second app-side trap, `"sideEffects": false` in the app's `package.json` letting `Bun.build` tree-shake the side-effect-only driver import, comes from a follow-up run whose result was never recorded.

**Work item.** Apply the request handler patch to an inlined server runtime (the plugin can transform it), so one build shape gives both spans and isolation.

**Evidence.** Cell record M-remix-bun in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-remix-bun/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-remix-bun), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
