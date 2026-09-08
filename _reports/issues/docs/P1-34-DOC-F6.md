Grepping `docs/platforms/javascript/guides/hapi/` for "bun" returns nothing. That guide is `sdk: sentry.javascript.node` with `fallbackGuide: javascript.node` (`hapi/index.mdx:4-5`) and renders `getting-started-node` (`hapi/index.mdx:12`), while `platform-includes/getting-started-use/javascript.hapi.mdx:17,42` still instruct `await Sentry.setupHapiErrorHandler(server)`. The Bun guide's alert at `guides/bun/index.mdx:96-98` is the only statement about bundling and it does not describe this shape.

Verified on `@hapi/hapi` 21.3.10 with `@sentry/bun` 10.67.0 on Bun 1.4.0: install `@sentry/bun`, put `Sentry.init` in `instrument.ts` imported as the first line of `app.ts`, create the database connection at module scope, `await server.start()`, then build with `Bun.build({ entrypoints: ['./app.ts'], outdir: './dist', target: 'bun', external: ['@sentry/*'], sourcemap: 'external', plugins: [sentryBunPlugin()] })` from `@sentry/bun/plugin` and run `bun dist/app.js`.

Works today:

- Unhandled route-handler errors, captured without a `setupHapiErrorHandler` call
- Route names `GET /users/{id}` with source `route`, plus a `router` child span
- Per-request isolation across concurrent requests
- Incoming `sentry-trace`/`baggage` continuation
- Outgoing `fetch` spans with propagation headers
- `mysql` database spans nested under the router span
- `Sentry.logger` log envelopes

Known limits:

- Without the plugin build there is no Hapi instrumentation: URL-sourced names, no router or database spans, and the handler error is not captured at all.

What to change:

- New page `docs/platforms/javascript/guides/bun/frameworks/hapi.mdx`: install, `instrument.ts` placement, the `build.ts` recipe, `bun run build.ts && bun dist/app.js`, and the capability list.
- Note on that page that the error handler is registered automatically in this shape.

---

_From the runtime docs audit of September 2026, item DOC-F6, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._
