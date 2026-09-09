# Next.js via OpenNext: outgoing fetch is uninstrumented without the Cloudflare fetch integration

Milestone: Cloudflare + Framework gaps
Labels: JavaScript, Cloudflare Workers, Bug
Priority: Medium

With the documented OpenNext wiring, errors, route names, isolation, incoming trace and logs pass. Outgoing `fetch` and `node:http` requests produce no `http.client` span and carry no `sentry-trace` or `baggage` header, because the Workers runtime provides a native fetch that the Node HTTP instrumentation never sees. Installing `@sentry/cloudflare` explicitly (it is not a transitive dependency of `@sentry/nextjs`) and adding `fetchIntegration()` from it to `sentry.server.config.ts` restores both, `node:http` calls included. `next.config` has to stay CommonJS: `import { withSentryConfig } from '@sentry/nextjs'` in an ESM `next.config.mjs` fails with `Named export 'withSentryConfig' not found`, because the exports map puts the CJS `node` condition ahead of `import`.

Database spans exist only for drivers that publish their own diagnostics channels, and mysql2 needs `disableEval: true` or `pool.query` throws `EvalError: Code generation from strings disallowed`; mysql 2.x produces none. The symptom at init is `Failed to register diagnostics-channel injection hooks, so channel-based integrations will not record spans` with `TypeError: port1.on is not a function`, and `serverExternalPackages` is not an escape hatch, the spans arrive and the driver breaks with `PROTOCOL_INCORRECT_PACKET_SEQUENCE`.

**Work item.** Add the Cloudflare fetch integration to the Next.js server defaults when the runtime is workerd.

**Evidence.** Cell record M-nextjs-cf in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-nextjs-cf/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-nextjs-cf), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
