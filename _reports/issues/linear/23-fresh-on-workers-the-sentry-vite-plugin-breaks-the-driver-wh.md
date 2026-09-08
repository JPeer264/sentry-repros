# Fresh on Workers: the Sentry Vite plugin breaks the driver when no worker environment exists

Milestone: Cloudflare + Framework gaps
Labels: JavaScript, Cloudflare Workers, Bug
Priority: Low

Fresh's own Vite plugin emits `_fresh/server.js` whose default export is already a fetch handler, so it runs on Workers with no adapter. Putting `sentryCloudflareVitePlugin()` into Fresh's `vite.config.ts` breaks the database driver under workerd, because there is no Cloudflare worker environment for the plugin to instrument. The working shape keeps the SDK and the driver external to the SSR build and bundles the wrangler entry separately with the orchestrion esbuild plugin. Errors are swallowed by Fresh's default handler and spans are named by method only, as on the other runtimes.

**Work item.** Make the Cloudflare Vite plugin a no-op with a warning when the Vite config has no worker environment.

**Evidence.** Cell record M-fresh-cf in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-fresh-cf/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-fresh-cf), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
