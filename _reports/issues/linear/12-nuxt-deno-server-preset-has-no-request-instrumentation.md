# Nuxt `deno_server` preset has no request instrumentation

Milestone: Deno + Framework gaps
Labels: JavaScript, Deno, Bug
Priority: Medium

With `nitro: { preset: "deno_server" }` and the documented wiring, there are no `http.server` spans, `getActiveSpan()` is undefined in handlers, every request shares one isolation scope and one trace id, and incoming trace headers are ignored. The default `node-server` output run under `deno run` works, with route names, incoming trace continuation and isolation, because Nitro's node-server entry uses `node:http`, which the Deno SDK instruments. Outgoing fetch needs `winterCGFetchIntegration()` from `@sentry/vercel-edge` on either preset (JS-3517).

**Work item.** Cover Nitro's `Deno.serve` entry in the `@sentry/nuxt` server side, or state the preset limit in the package and the docs.

**Evidence.** Cell record M-nuxt-deno in `_reports/deep-probe-report.html`; reproduction `cells/M-nuxt-deno/`, each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
