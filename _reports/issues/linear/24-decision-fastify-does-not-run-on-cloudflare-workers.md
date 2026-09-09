# Decision: Fastify does not run on Cloudflare Workers

Milestone: Cloudflare + Framework gaps
Labels: JavaScript, Cloudflare Workers, Task
Priority: Low

Fastify 5.12.3 behind `httpServerHandler` with `nodejs_compat` and `enable_nodejs_http_server_modules`: constructing the app at module scope throws `Disallowed operation called within global scope`, because Fastify's boot generates random values and schedules work. Constructing it lazily on the first request then fails when any route is registered, because the router compiles matchers with `new Function` and Workers forbid runtime code generation, with no compatibility flag that lifts it. Declaring a route schema is not an escape either, ajv and fast-json-stringify compile the same way. Fastify 4 behaves the same. A plain `node:http` server behind the same config serves 200s, so the Cloudflare entrypoint is fine and it is the framework that cannot be constructed. No Sentry capability could be exercised.

**Work item.** Record the decision and state it in the Cloudflare and Fastify docs (audit DOC-F38). No SDK work.

**Evidence.** Cell record M-fastify-cf in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-fastify-cf/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-fastify-cf), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
