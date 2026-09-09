Oak appears nowhere in the docs, on any runtime. The Bun guide, `docs/platforms/javascript/guides/bun/index.mdx:1-212`, names no framework and never mentions `Bun.serve` or a routes map, and `docs/platforms/javascript/common/configuration/integrations/bunserver.mdx:18` is the only description of the `Bun.serve` instrumentation but says nothing about how server spans are named. `Bun.serve` itself appears in the docs only on that integration page.

Verified on Oak 17.2.0 with `@sentry/bun` 10.67.0 (develop, 6f2da7483d) on Bun 1.4.0. Oak is JSR-only, so installation needs an `.npmrc` with `@jsr:registry=https://npm.jsr.io` and `npm install "@oak/oak@npm:@jsr/oak__oak@17.2.0"`, followed by `npm install @sentry/bun mysql2`; `bun add @oak/oak` fails outright and `bun add` could not resolve the SDK packages' transitive `@sentry/*` dependencies, so the npm route is required. Put `Sentry.init` in `instrument.ts` imported first, create the `mysql2` connection at module scope, mount the app through `Bun.serve`, and run `bun app.ts` — no bundle and no `sentryBunPlugin()` were needed for any capability here. For route names, build the routes map from the Oak router at startup and keep `fetch` as the fallback: `const handler = req => app.fetch(req); const routes = {}; for (const r of router) routes[r.path] = handler; Bun.serve({ port, routes, fetch: handler })`. That map shape comes from the follow-up run; the cell app named spans with a router-level middleware instead.

Works today:

- Unhandled handler errors, with mechanism `auto.http.bun.serve`; with an Oak error middleware in place the mechanism becomes `oak`, and a user-registered Oak `error` listener stops the re-throw, after which the app has to capture the error itself
- Route names `GET /users/:id` with source `route` and `url.template` once the routes map is passed, in both lifecycles and on the error path. The recorded verdict for route names is partial: see the naming limit below
- Per-request isolation across concurrent requests
- Incoming `sentry-trace`/`baggage` continuation
- Outgoing `fetch` spans with propagation headers
- `mysql2` database spans with no build step, because mysql2 publishes its own `node:diagnostics_channel` events. This is the generalizable half of the Bun story: "no library spans without a bundle" is not a universal rule, but a driver without native channels still needs the `sentryBunPlugin` bundle
- `Sentry.logger` log envelopes correlated to the request trace

Known limits:

- Mounted with `fetch` only, server spans take the raw pathname with source `url` under `traceLifecycle: 'static'` (`GET /users/7`, high cardinality) and collapse to a bare `GET` under the `stream` default.
- Even with the routes map, routes using regex constraints, optional params or `(.*)` are derived into the map and still fall back to source `url` (`/api/opt` from `/api/opt/:a?`, `/api/star/a/b` from `/api/star/(.*)`), while a path that Oak answers with a 404 can still be labelled `GET /api/num/:id(\d+)` with source `route`.
- Mounted with `app.listen()` the SDK still emits method-only server spans, but errors are never captured, the database span is not emitted at all, the outgoing-`fetch` span detaches onto the process trace as its own root, logs carry a stale process trace id, and request isolation leaks across concurrent requests (all three concurrent events carried one tag and one trace id).
- Neither naming approach works under `app.listen()`; bundling with `@sentry/bun/plugin` does not change route naming either, and neither does init placement or lifecycle.
- Browser-side capture was not exercised.

What to change:

- New page `docs/platforms/javascript/guides/bun/frameworks/oak.mdx` with the JSR install, the `Bun.serve` mount and routes map, the `bun app.ts` run command, and the capability list.
- Document the second naming option beside the map: a router-level `router.use` middleware calling `Sentry.updateSpanName` and setting the `sentry.segment.name.source` attribute to `route`, which also names the error path. `updateSpanName` alone leaves the source as `custom`. The routes map is preferable because it also sets `url.template` and runs once at startup.
- `common/configuration/integrations/bunserver.mdx`: add that server span names come from the `Bun.serve` routes map.

---

_From the runtime docs audit of September 2026, item DOC-F7, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._
