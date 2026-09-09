# Bun garbage-collects the diagnostics channels the SDK subscribes to

Milestone: Bun Functionality Gaps
Labels: JavaScript, Bun, Bug
Priority: High

Bun's `node:diagnostics_channel` holds channels weakly and collects a channel together with its subscribers when nothing keeps a strong reference. The SDK drops the channel object it subscribes to (`packages/server-utils/src/tracing-channel.ts:200-208`, `packages/server-utils/src/integrations/mysql.ts:79-80`), so an instrumented module that first evaluates inside a request, such as mysql's lazily required `lib/Connection.js` or a driver imported dynamically in a handler, never gets spans. Reproduced on develop (10.67.0) on bun 1.4.0, re-run on 1.4.2, and on the CI pin bun 1.3.14, which behaves identically; and with no SDK at all, where a plain `dc.tracingChannel(name).subscribe(...)` at module scope loses its subscription the same way. Node keeps subscribed channels alive. It is why the database-span cells of seven framework SDKs on Bun (Hono, Next.js, SvelteKit, Astro, React Router, TanStack Start and SolidStart) each carry a channel pin or a driver-import workaround.

Workarounds: import drivers and create pools at module scope, or pin the channels after `Sentry.init()` with `dc.tracingChannel(name)` held on `globalThis`.

**Work item.** Retain the channel references in the SDK. File the Bun report with the minimal probe.

**Evidence.** Probe records X02, B17 in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproductions [`probes/X02/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/probes/X02), [`probes/B17/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/probes/B17). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
