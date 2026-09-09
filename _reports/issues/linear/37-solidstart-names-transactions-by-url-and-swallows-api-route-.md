# SolidStart names transactions by URL and swallows API-route errors on every runtime

Milestone: XPlatform Functionality Gaps
Labels: JavaScript, Bug
Priority: Medium

SolidStart mounts the whole app as one Nitro catch-all handler, so the SDK's Nitro route parameterization never fires: server transactions arrive as `GET /users/456` with source `url` on Node, Bun, Deno and Workers, and collapse to a bare `GET` under the stream lifecycle. Errors thrown in a file API route (`src/routes/api/*.ts`) or during page render are turned into a 500 by SolidStart's internal h3 app before Nitro's error hook, so no event is sent, and the guide's own verification snippet is exactly that unreported case. API-route errors are recoverable from user land, with a try/catch h3 middleware registered first in the array form of `createMiddleware` and spreading the nested `sentryBeforeResponseMiddleware()`, and server functions are already covered by `withServerActionInstrumentation`; page-render errors stay dark on every runtime, and on Workers the Nitro error plugin cannot reach them either, because the render is streamed through a detached pipe.

Route names are recoverable too, but only through a helper the framework package does not re-export: `setHttpServerSpanRouteAttribute` from `@sentry/server-utils` names API routes from `event.params` in `onBeforeResponse` and SSR pages from `useCurrentMatches`, and renames the segment span only.

**Work item.** A SolidStart middleware in `@sentry/solidstart` that names the span from the route manifest and captures API-route errors.

Generalized by "Server segments keep a method-only name although the framework knows the route", which records the same symptom on TanStack Start and Nuxt with a cause of its own on each.

**Evidence.** Cell records M-solidstart-bun, M-solidstart-deno, M-solidstart-cf in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproductions [`cells/M-solidstart-bun/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-solidstart-bun), [`cells/M-solidstart-deno/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-solidstart-deno), [`cells/M-solidstart-cf/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-solidstart-cf), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
