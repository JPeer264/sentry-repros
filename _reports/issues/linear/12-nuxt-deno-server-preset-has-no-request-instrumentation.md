# Nuxt `deno_server` preset has no request instrumentation

Milestone: Deno + Framework gaps
Labels: JavaScript, Deno, Bug
Priority: Medium

With `nitro: { preset: "deno_server" }` and the documented wiring, there are no `http.server` spans, `getActiveSpan()` is undefined in handlers, every request shares one isolation scope and one trace id, and incoming trace headers are ignored. The default `node-server` output run under `deno run` gets route names, `GET /api/users/:id` with source `route` in both lifecycles and `getActiveSpan()` defined in handlers, identical to the Node control, because Nitro's node-server entry uses `node:http`, which the Deno SDK instruments; isolation and incoming trace continuation were measured only on the `deno_server` build, where they fail, so both are unmeasured on `node-server`. Outgoing fetch needs `winterCGFetchIntegration()` from `@sentry/vercel-edge`, an extra install, verified on the `deno_server` build under the stream lifecycle (JS-3517); `fetchIntegration()` from `@sentry/cloudflare`, already a dependency of `@sentry/nuxt`, is the zero-install candidate nobody has run yet.

`deno_server` with `top-level-import` also writes the config import into a file named `.output/server/deno.json start`, and under the static lifecycle drops parentless fetches with `no_parent_span`.

**Work item.** Cover Nitro's `Deno.serve` entry in the `@sentry/nuxt` server side, or state the preset limit in the package and the docs.

**Evidence.** Cell record M-nuxt-deno in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-nuxt-deno/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-nuxt-deno), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
