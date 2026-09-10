# The `/request` entry runs without an async-context strategy under the stream lifecycle

Milestone: CF Functionality Gaps
Labels: JavaScript, Cloudflare Workers, Bug
Priority: High

`wrapRequestHandler` from `@sentry/cloudflare/request` sets up a reduced client and is the one Cloudflare wrapper that never calls `setAsyncLocalStorageAsyncContextStrategy`. Under the default stream lifecycle a request without I/O is sent as a legacy transaction envelope and a following event was dropped; `traceLifecycle: "static"` avoids it, and so does calling `setAsyncLocalStorageAsyncContextStrategy()` from `@sentry/server-utils/no-diagnostic-channels` at module scope, which needs the `nodejs_als` flag. 10.73.0 is unaffected because it defaults to the static lifecycle. Without the strategy there is no per-request isolation either: every `setTag`, `setUser` and request-data write is global to the isolate and bleeds into later requests, and no event carries request data. Remix wired through this entry loses isolation for that reason, and the two Hydrogen framework pages document exactly this shape, which exists for runtimes that cannot enable `nodejs_compat`.

**Work item.** Set the strategy in the request entry whenever AsyncLocalStorage is available, and otherwise force the static lifecycle there with a warning.

**Evidence.** Cell record M-remix-cf in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-remix-cf/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-remix-cf), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0). Also probe record C09 in the deep probe report.
