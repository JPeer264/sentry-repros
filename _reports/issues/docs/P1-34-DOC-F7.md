Oak appears nowhere in the docs, on any runtime. The Bun guide is a single page, `docs/platforms/javascript/guides/bun/index.mdx:1-214`, which names no framework and never mentions `Bun.serve` or a routes map, and `docs/platforms/javascript/common/configuration/integrations/bunserver.mdx:18` is the only description of the `Bun.serve` instrumentation but says nothing about how server spans are named.

Verified on Oak 17.2.0 with `@sentry/bun` 10.67.0 on Bun 1.4.0. Oak is JSR-only, so installation needs an `.npmrc` with `@jsr:registry=https://npm.jsr.io` and `npm install "@oak/oak@npm:@jsr/oak__oak@17.2.0"`. Put `Sentry.init` in `instrument.ts` imported first, create the `mysql2` connection at module scope, and mount the app through `Bun.serve`. For route names, build the routes map from the Oak router at startup and keep `fetch` as the fallback: `const handler = req => app.fetch(req); const routes = {}; for (const r of router) routes[r.path] = handler; Bun.serve({ port, routes, fetch: handler })`.

Works today:

- Unhandled handler errors
- Route names `GET /users/:id` with source `route` once the routes map is passed
- Per-request isolation across concurrent requests
- Incoming `sentry-trace`/`baggage` continuation
- Outgoing `fetch` spans with propagation headers
- `mysql2` database spans with no build step
- `Sentry.logger` log envelopes correlated to the request trace

Known limits:

- Mounted with `fetch` only, server spans are named `GET` with source `url`; routes using regex constraints, optional params or `(.*)` are named imprecisely unless listed explicitly in the map.
- `app.listen()` is not a working mount shape with `@sentry/bun`.
- Browser-side capture was not exercised.

What to change:

- New page `docs/platforms/javascript/guides/bun/frameworks/oak.mdx` with the JSR install, the `Bun.serve` mount and routes map, and the capability list.
- `common/configuration/integrations/bunserver.mdx`: add that server span names come from the `Bun.serve` routes map.

---

_From the runtime docs audit of September 2026, item DOC-F7, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._
