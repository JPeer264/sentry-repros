# No warning when a Worker is bundled without build-time instrumentation

Milestone: Cloudflare + Framework gaps
Labels: JavaScript, Cloudflare Workers, Improvement
Priority: High

Express, Koa, Hapi and NestJS boot on workerd behind `enable_nodejs_http_server_modules` and `httpServerHandler` from `cloudflare:node`, and Fresh and Elysia run as plain fetch handlers. A Worker bundled by `wrangler dev` or `wrangler deploy` alone then emits no route names, no framework spans and no database spans, and logs nothing. Built with `sentryCloudflareVitePlugin()` from `@sentry/cloudflare/vite`, or with `sentryOrchestrionPlugin()` from `@sentry/server-utils/orchestrion/esbuild` for non-Vite builds, all of them arrive. On Bun the same situation prints a debug-level line (JS-3508); on Cloudflare there is nothing.

**Work item.** Detect at init on workerd that no channel injection happened and warn at the default log level, naming both plugins. Document `sentryOrchestrionPlugin`, which is exported from six entry points and documented nowhere.

**Evidence.** Cell records M-express-cf, M-koa-cf, M-hapi-cf, M-nestjs-cf, M-fresh-cf, M-elysia-cf in `_reports/deep-probe-report.html`; reproductions `cells/M-express-cf/`, `cells/M-koa-cf/`, `cells/M-hapi-cf/`, `cells/M-nestjs-cf/`, `cells/M-fresh-cf/`, `cells/M-elysia-cf/`, each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
