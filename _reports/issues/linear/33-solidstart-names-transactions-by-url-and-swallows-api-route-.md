# SolidStart names transactions by URL and swallows API-route errors on every runtime

Milestone: XPlatform Functionality Gaps
Labels: JavaScript, Bug
Priority: Medium

SolidStart mounts the whole app as one Nitro catch-all handler, so the SDK's Nitro route parameterization never fires: server transactions arrive as `GET /users/456` with source `url` on Node, Bun, Deno and Workers. Errors thrown in a file API route (`src/routes/api/*.ts`) or during page render are turned into a 500 by SolidStart's internal h3 app before Nitro's error hook, so no event is sent, and the guide's own verification snippet produces nothing. Only `withServerActionInstrumentation`, or a user h3 middleware registered first in the array form of `createMiddleware`, captures them.

**Work item.** A SolidStart middleware in `@sentry/solidstart` that names the span from the route manifest and captures API-route errors.

**Evidence.** Cell records M-solidstart-bun, M-solidstart-deno, M-solidstart-cf in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproductions [`cells/M-solidstart-bun/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-solidstart-bun), [`cells/M-solidstart-deno/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-solidstart-deno), [`cells/M-solidstart-cf/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-solidstart-cf), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
