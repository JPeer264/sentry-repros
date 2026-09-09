# Express, Hapi, Koa and NestJS on Deno: hook order and JSON-require failures per framework

Milestone: Deno + Framework gaps
Labels: JavaScript, Deno, Bug
Priority: High

With `import "@sentry/deno/import"` as the first line, all four abort at import with `SyntaxError: Unexpected token ':'`, because any module load hook makes Deno compile `require("*.json")` as JavaScript (denoland/deno#36240): Express dies inside `statuses`, Hapi inside `@hapi/validate`'s `require('../package.json')`, Koa inside `statuses`' `require('./codes.json')`, and NestJS never starts. Without the hook they run, but transactions are URL-named, there are no child spans and handler errors are not captured automatically.

Verified shapes, all built from shipped exports. A six-line JSON load hook registered before the framework import restores route names and framework spans for Express, Hapi and NestJS. Koa's hook must not be a static import of the entry file, because Deno instantiates the entry's whole module graph, Koa included, before the first statement runs: register it through `--import=./preload.ts` for route names, or defer it with `await import("@sentry/deno/import")` after the app import for driver spans. Bundling with esbuild and `sentryOrchestrionPlugin()` from `@sentry/server-utils/orchestrion/esbuild` gives Hapi and Koa route names, framework spans and error capture with no runtime hook at all. NestJS takes `enableRuntimeChannelInjection: false` as the alternative to the JSON hook, at the cost of route names and framework spans.

Error capture without the hook exists, but not from `@sentry/deno`: `setupExpressErrorHandler(app)` and `attachHapiErrorHandler(server)` live in `@sentry/server-utils` and are not re-exported, and there is no `setupKoaErrorHandler` there at all, so Koa falls back to a hand-written `app.on('error')` whose events carry a manual mechanism.

**Work item.** Once the JSON shim in the Deno milestone ships, re-run the four cells and remove the per-framework workarounds. Re-export the framework error handlers from `@sentry/deno`. Add real-library Deno scenarios for these four (JS-3523).

**Evidence.** Cell records M-express-deno, M-hapi-deno, M-koa-deno, M-nestjs-deno in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproductions [`cells/M-express-deno/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-express-deno), [`cells/M-hapi-deno/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-hapi-deno), [`cells/M-koa-deno/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-koa-deno), [`cells/M-nestjs-deno/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-nestjs-deno), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
