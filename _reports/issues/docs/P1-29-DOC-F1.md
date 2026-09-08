The Hono guide names Bun at `docs/platforms/javascript/guides/hono/index.mdx:12`, has a Bun install tab at `hono/index.mdx:84-86` and a Bun setup snippet at `hono/index.mdx:290-317`, but it never shows how to start the app or what the runtime delivers. The Bun guide teaches only `bun --preload ./instrument.js app.js` (`bun/index.mdx:106`) and carries a "Bundled Code Limitation" alert at `bun/index.mdx:96-98`. `sentryBunPlugin`, `@sentry/bun/plugin` and `Bun.build` appear nowhere in the docs.

Verified on Hono 4.10.x with `@sentry/hono/bun` 10.67.0 on Bun 1.4.0: install `@sentry/hono` plus `@sentry/bun`, call `app.use(sentry(app, { dsn, tracesSampleRate: 1.0 }))` on a fresh `new Hono()`, export `{ port, fetch: app.fetch }`, and run `bun app.ts`. No instrument file and no `--preload` are needed, because the middleware calls `Sentry.init` itself. Building the same entry with `Bun.build({ entrypoints: ['./app.ts'], outdir: './dist', target: 'bun', sourcemap: 'external', plugins: [sentryBunPlugin()] })` from `@sentry/bun/plugin` and running `bun dist/app.js` keeps every capability.

Works today:

- Unhandled handler errors, with the route as the transaction name
- Parameterized route names (`GET /users/:id`, source `route`)
- Per-request isolation across concurrent requests
- Incoming `sentry-trace`/`baggage` continuation
- Outgoing `fetch` spans with propagation headers
- `mysql2` database spans without any build step
- `Sentry.logger` log envelopes

Known limits:

- Drivers that do not publish `node:diagnostics_channel` events themselves, such as `mysql`@2, produce spans only in the `Bun.build` bundle.
- Passing `external` to `Bun.build` splits `hono` from `@sentry/hono` and the patches stop applying.

What to change:

- `guides/hono/index.mdx`: add a "Run your app" step with a Bun tab showing `bun app.ts` and the `Bun.build` + `sentryBunPlugin()` variant, and state that the `--preload` step is not needed here.
- `guides/bun/index.mdx:96-98`: rewrite the alert so it describes the plugin build as the supported way to instrument bundled code.

---

_From the runtime docs audit of September 2026, item DOC-F1, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._
