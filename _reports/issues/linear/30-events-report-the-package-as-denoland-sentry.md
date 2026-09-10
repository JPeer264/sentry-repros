# Events report the package as `denoland:sentry`

Milestone: Deno Functionality Gaps
Labels: JavaScript, Deno, Bug
Priority: Low

`packages/deno/src/client.ts:36` sets `sdk.packages[0].name` to `denoland:sentry`, while the package ships on npm only and every documented install uses `npm:@sentry/deno`.

**Work item.** Report `npm:@sentry/deno`, matching the other SDKs.

**Evidence.** Probe record D02 in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`probes/D02/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/probes/D02). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
