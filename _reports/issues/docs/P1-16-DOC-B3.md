The Bun guide has no frameworks section, and `guides/express/`, `guides/fastify/`, `guides/koa/`, `guides/hapi/` and `guides/nextjs/` contain no mention of Bun. `guides/hono/index.mdx:12,84-85,290-292` covers Bun; `guides/elysia/index.mdx:5` inherits from Bun.

Observed on bun 1.4.0: under `bun run`, Express, Koa, Hapi and Fastify produce URL-named server transactions (`GET /user/42`, source `url`), no child spans and no captured error. After `Bun.build` with `sentryBunPlugin`, the same apps produce route-named transactions (`GET /user/:id`, `GET /user/{id}` on Hapi), middleware/router/handler spans and captured errors (`auto.http.express`, `auto.middleware.koa`, `auto.function.hapi`, `auto.function.fastify`), matching Node. Hono via `@sentry/hono/bun` works with `bun run` and after bundling only while `hono` stays external; with `hono` inlined, transactions fall back to `GET /user/42` and no error is captured. The per-framework Bun items DOC-F1 to DOC-F17 carry the verified wiring for every other framework.

What to change:

- Add `guides/bun/frameworks/index.mdx` with a table: framework, behavior under `bun run`, behavior after `Bun.build` + plugin, guide to follow.
- Note that database clients must be created at module scope.
- Add a "Bun" pointer to the Express, Fastify, Koa and Hapi guides.
- Add "keep `hono` external when bundling" to the Hono guide's Bun tab.

---

_From the runtime docs audit of September 2026, item DOC-B3, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._
