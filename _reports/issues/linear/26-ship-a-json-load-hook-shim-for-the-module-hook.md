# Ship a JSON load-hook shim for the module hook

Milestone: Deno Functionality Gaps
Labels: JavaScript, Deno, Bug
Priority: High

Registering any `Module.registerHooks` load hook on Deno 2.9 makes CommonJS `require("*.json")` compile as JavaScript (denoland/deno#36240, fix in denoland/deno#36243, both open). Under `@sentry/deno/import` that breaks Express, Hapi, Fastify, mysql2, Koa's dependencies and NestJS at import with `SyntaxError: Unexpected token ':'`, and under the runtime channel injection it turns every Next.js request into a 500. A second load hook that delegates and sets `format: "json"` for `.json` URLs works around it, verified with the hook on and off. The public option today is `enableRuntimeChannelInjection: false`, which buys a process that boots at the price of every channel-based integration.

**Work item.** Register that shim in `register.ts` until the Deno fix ships, with a version check to drop it afterwards.

**Evidence.** Probe record X03 in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`probes/X03/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/probes/X03). First-round probe D-JSON, see the code-defects table in the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
