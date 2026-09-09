# Fresh on Workers: the Sentry Vite plugin breaks the driver when no worker environment exists

Milestone: Cloudflare + Framework gaps
Labels: JavaScript, Cloudflare Workers, Bug
Priority: Low

Fresh's own Vite plugin emits `_fresh/server.js` whose default export is already a fetch handler, so it runs on Workers with no adapter. Putting `sentryCloudflareVitePlugin()` into Fresh's `vite.config.ts` is worse than a no-op: there is no Cloudflare worker environment for it to instrument, so it injects the channels and then breaks the database driver under workerd through Vite's CJS interop. The working shape keeps the SDK and the driver external to the SSR build and bundles the wrangler entry separately with the orchestrion esbuild plugin, whose banner has to define a `globalThis.require` backed by static `node:*` imports or workerd dies at the first query on `Dynamic require of 'diagnostics_channel' is not supported`.

Errors are swallowed by Fresh's default handler, as on the other runtimes. Route names are not automatic either, because Fresh renames through `@opentelemetry/api` while `@sentry/cloudflare` registers no OpenTelemetry global, so those calls land on a no-op tracer; one `main.ts` middleware registered before `app.fsRoutes()` produces `GET /users/:id` with source `route` in both lifecycles, renaming inside a `finally` and setting the source after the rename.

**Work item.** Make the Cloudflare Vite plugin a no-op with a warning when the Vite config has no worker environment, instead of injecting channels it cannot support.

**Evidence.** Cell record M-fresh-cf in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-fresh-cf/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-fresh-cf), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
