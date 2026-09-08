The Deno guide has no frameworks section, and the Fastify, Express, Koa and Hapi guides contain no mention of Deno. Only `guides/hono/index.mdx:88-89,320-322` covers Deno.

What was observed on deno 2.9.0, with and without a first-line `import '@sentry/deno/import';`: Fastify works with no hook, producing `GET /user/:id` (source `route`), a handler span and an `auto.function.fastify` error, because Fastify publishes its own `node:diagnostics_channel` events. Hono via `@sentry/hono/deno` works with no hook. Express, Koa and Hapi without the hook produce URL-named transactions (`GET /user/42`, source `url`), no child spans and no captured error. With the hook, all three fail at import: Express and Hapi with `SyntaxError: Unexpected token ':'`, Koa with `Cannot resolve module "./index.js"`. Fastify also fails at import under the hook. The per-framework Deno items DOC-F18 to DOC-F34 carry the verified wiring for every other framework.

What to change:

- Add `guides/deno/frameworks/index.mdx` with a table: framework, behavior without the hook, behavior with the hook, guide to follow.
- State plainly that Fastify and Hono are supported on Deno with no extra step, and that Express, Koa and Hapi produce URL-named server transactions without error capture, and fail to import under the hook.
- Add a "Deno" note to the Fastify guide (works as is) and to the Express, Koa and Hapi guides (server transactions only), each linking to the new page.

---

_From the runtime docs audit of September 2026, item DOC-D4, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._
