# Express, Hapi, Koa and NestJS on Deno: hook order and JSON-require failures per framework

Milestone: Deno + Framework gaps
Labels: JavaScript, Deno, Bug
Priority: High

With `import "@sentry/deno/import"` as the first line, Express and Hapi fail at import with `SyntaxError: Unexpected token ':'` and Koa with `Cannot resolve module "./index.js"`, because any module load hook makes Deno compile `require("*.json")` as JavaScript (denoland/deno#36240). Without the hook they run, but transactions are URL-named, there are no child spans and handler errors are not captured.

Verified shapes: a JSON load hook registered before the framework import restores route names for Hapi and NestJS; Koa needs the hook registered after its own import through `await import("@sentry/deno/import")` for driver spans; bundling with esbuild and `sentryOrchestrionPlugin()` from `@sentry/server-utils/orchestrion/esbuild` gives Hapi and Koa route names, framework spans and error capture with no runtime hook at all. NestJS with `@sentry/nestjs` alone gets everything except parameterized route names.

**Work item.** Once the JSON shim in the Deno milestone ships, re-run the four cells and remove the per-framework workarounds. Add real-library Deno scenarios for these four (JS-3523).

**Evidence.** Cell records M-express-deno, M-hapi-deno, M-koa-deno, M-nestjs-deno in `_reports/deep-probe-report.html`; reproductions `cells/M-express-deno/`, `cells/M-hapi-deno/`, `cells/M-koa-deno/`, `cells/M-nestjs-deno/`, each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
