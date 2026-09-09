The Hono guide names Bun at `docs/platforms/javascript/guides/hono/index.mdx:12`, has a Bun install tab at `hono/index.mdx:84-86` and a Bun setup snippet at `hono/index.mdx:278-300`, but it never shows how to start the app or what the runtime delivers. The Bun guide teaches only `bun --preload ./instrument.js app.js` (`bun/index.mdx:100`) and carries a "Bundled Code Limitation" alert at `bun/index.mdx:90-94`. `sentryBunPlugin`, `@sentry/bun/plugin` and `Bun.build` appear nowhere in the docs.

Verified on Hono 4.13.x with `@sentry/hono/bun` 10.67.0 (develop, 6f2da7483d) on Bun 1.4.0 and re-run on 1.4.2: install `@sentry/hono` plus `@sentry/bun`, call `app.use(sentry(app, { dsn, tracesSampleRate: 1.0 }))` on a fresh `new Hono()`, export `{ port, fetch: app.fetch }`, and run `bun app.ts`. No instrument file and no `--preload` are needed, because the middleware calls `Sentry.init` itself. `traceLifecycle` defaults to `stream` on this line, which names the request span `http.server GET /users/:id` and the database span `db SELECT users`; under `traceLifecycle: 'static'` the same run gives a transaction `GET /users/:id` and a span `db SELECT * FROM users`. One Bun bug needs a workaround: Bun garbage-collects a `node:diagnostics_channel` channel that only Sentry's subscriber holds, so a driver whose first query happens later in the process silently loses its spans; pin the channels by keeping a strong reference right after the middleware is registered, `globalThis.__sentryPinnedChannels ??= ['mysql2:query', 'mysql2:execute', 'mysql2:connect', 'mysql2:pool:connect'].map(name => dc.tracingChannel(name))`, which is harmless on Node. Building the same entry with `Bun.build({ entrypoints: ['./app.ts'], outdir: './dist', target: 'bun', sourcemap: 'external', plugins: [sentryBunPlugin()] })` from `@sentry/bun/plugin` and running `bun dist/app.js` adds spans for `mysql`@2; the bundled captures cover errors, route names, incoming trace continuation, outgoing `fetch`, both database drivers and logs, and do not drive the isolation route.

Works today:

- Unhandled handler errors, with the route as the transaction name
- Parameterized route names (`GET /users/:id`, source `route`)
- Per-request isolation across concurrent requests
- Incoming `sentry-trace`/`baggage` continuation
- Outgoing `fetch` spans with propagation headers
- `mysql2` 3.20.0+ database spans with no build step, as long as the driver is loaded and queried early or the channels are pinned as above
- `Sentry.logger` log envelopes, flushed on a roughly 5 second timer and needing no `enableLogs` option

Known limits:

- Drivers that do not publish `node:diagnostics_channel` events themselves, such as `mysql`@2, produce spans only in the `Bun.build` bundle.
- Do not pass `external: ["@sentry/*"]` to `Bun.build` for a Hono app. Externalizing `@sentry/*` while `hono` is inlined gives two copies of hono's `GET_MATCH_RESULT` symbol and every request 500s inside `@sentry/hono`'s `requestHandler`. Either pass no `external` at all (the verified recipe), or externalize `hono` together with `@sentry/*`, which then behaves exactly like the unbundled run.

What to change:

- `guides/hono/index.mdx`: add a "Run your app" step with a Bun tab showing `bun app.ts` and the `Bun.build` + `sentryBunPlugin()` variant, state that the `--preload` step is not needed here, and name the span names a reader will see under the `stream` default and under `static`.
- `guides/bun/index.mdx:90-94`: rewrite the alert so it describes the plugin build as the supported way to instrument bundled code.
- `packages/hono/README.md:172-190`: the Bun section ends in the Node recipe (`serve` from `@hono/node-server`); replace it with the `export default app` form the docs page shows.

---

_From the runtime docs audit of September 2026, item DOC-F1, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._
