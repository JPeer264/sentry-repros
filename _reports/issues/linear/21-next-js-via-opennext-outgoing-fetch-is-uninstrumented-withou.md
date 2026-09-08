# Next.js via OpenNext: outgoing fetch is uninstrumented without the Cloudflare fetch integration

Milestone: Cloudflare + Framework gaps
Labels: JavaScript, Cloudflare Workers, Bug
Priority: Medium

With the documented OpenNext wiring, errors, route names, isolation, incoming trace and logs pass. Outgoing `fetch` and `node:http` requests produce no `http.client` span and carry no `sentry-trace` or `baggage` header, because the Workers runtime provides a native fetch that the Node HTTP instrumentation never sees. Installing `@sentry/cloudflare` explicitly (it is not a transitive dependency of `@sentry/nextjs`) and adding `fetchIntegration()` from it to `sentry.server.config.ts` restores both. mysql2 needs `disableEval: true` or `pool.query` throws `EvalError: Code generation from strings disallowed`.

**Work item.** Add the Cloudflare fetch integration to the Next.js server defaults when the runtime is workerd.

**Evidence.** Cell record M-nextjs-cf in `_reports/deep-probe-report.html`; reproduction `cells/M-nextjs-cf/`, each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
