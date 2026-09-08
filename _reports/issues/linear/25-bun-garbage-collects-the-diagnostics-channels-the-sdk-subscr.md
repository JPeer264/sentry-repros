# Bun garbage-collects the diagnostics channels the SDK subscribes to

Milestone: Bun Functionality Gaps
Labels: JavaScript, Bun, Bug
Priority: High

Bun's `node:diagnostics_channel` holds channels weakly and collects a channel together with its subscribers when nothing keeps a strong reference. The SDK drops the channel object it subscribes to (`packages/server-utils/src/tracing-channel.ts:200-208`), so an instrumented module that first evaluates inside a request, such as mysql's lazily required `lib/Connection.js` or a driver imported dynamically in a handler, never gets spans. Reproduced on develop and 10.73.0, bun 1.4.0 and 1.3.14, and in the database-span cells of six framework SDKs on Bun. Node keeps subscribed channels alive.

Workarounds: import drivers and create pools at module scope, or pin the channels after `Sentry.init()` with `dc.tracingChannel(name)` held on `globalThis`.

**Work item.** Retain the channel references in the SDK. File the Bun report with the minimal probe.

**Evidence.** Probe records X02, B17 in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproductions [`probes/X02/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/probes/X02), [`probes/B17/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/probes/B17). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
