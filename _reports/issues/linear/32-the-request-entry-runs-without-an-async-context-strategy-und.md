# The `/request` entry runs without an async-context strategy under the stream lifecycle

Milestone: CF Functionality Gaps
Labels: JavaScript, Cloudflare Workers, Bug
Priority: High

`wrapRequestHandler` from `@sentry/cloudflare/request` sets up a reduced client with no async-context strategy. Under the default stream lifecycle some requests turn into legacy transaction envelopes and events are dropped; `traceLifecycle: "static"` avoids it. On Workers with `nodejs_compat`, Remix wired through this entry loses per-request isolation unless `setAsyncLocalStorageAsyncContextStrategy` is called first.

**Work item.** Set the strategy in the request entry whenever AsyncLocalStorage is available, and otherwise force the static lifecycle there with a warning.

**Evidence.** Cell record M-remix-cf in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-remix-cf/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-remix-cf), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0). Also the Cloudflare section of the deep probe report.
