No page mentions NestJS on Bun. `docs/platforms/javascript/guides/nestjs/index.mdx:4-5` sets `sdk: sentry.javascript.nestjs` with `fallbackGuide: javascript.node`, the prerequisites include at `nestjs/index.mdx:14` resolves to the Node prerequisites, the init comes from the `getting-started-config` include at `nestjs/index.mdx:57` and the `{filename: main.ts}` "Import this first!" snippet sits at `nestjs/index.mdx:75`; `platform-includes/getting-started-install/javascript.nestjs.mdx:3-15` has no Bun tab. The Bun guide's only bundling statement is the alert at `guides/bun/index.mdx:90-94`.

Verified on NestJS 11 (`@nestjs/core` + `@nestjs/platform-express` ^11.2.3) with `@sentry/nestjs` and `@sentry/bun` 10.67.0 (develop, 6f2da7483d) on Bun 1.4.0, driver `mysql` ^2.18.1: a `tsconfig.json` with `experimentalDecorators` and `emitDecoratorMetadata`, `Sentry.init` from `@sentry/bun` in `src/instrument.ts` imported as the first line of `src/main.ts` with `import 'reflect-metadata';` as the second, `SentryModule.forRoot()` plus the `SentryGlobalFilter` `APP_FILTER` provider in `src/app.module.ts`, then `Bun.build({ entrypoints: ['./src/main.ts'], outdir: './dist', target: 'bun', sourcemap: 'external', external: [...], plugins: [sentryBunPlugin()] })` from `@sentry/bun/plugin`, run as `bun run build.ts && bun dist/main.js`. The `external` list must carry Nest's lazily required optional peers (`@nestjs/microservices`, `@nestjs/microservices/microservices-module`, `@nestjs/websockets`, `@nestjs/websockets/socket-module`, `@nestjs/platform-express/multer`, `class-validator`, `class-transformer`, `cache-manager`) or the build fails to resolve them; `@sentry/bun` and `mysql` may also be listed, because the plugin removes the packages it instruments from that list again.

Works today:

- Unhandled controller errors, via the mandatory `SentryGlobalFilter`
- Per-request isolation across concurrent requests
- Incoming `sentry-trace`/`baggage` continuation
- Outgoing `fetch` spans with propagation headers
- `mysql` database spans in the bundled build
- `Sentry.logger` log envelopes

Known limits:

- Route names and the Express middleware and handler child spans exist only in the bundled build. Running `bun src/main.ts` gives URL-sourced names under `traceLifecycle: 'static'` (`GET /users/42`, source `url`) and, under the `stream` default, a span named just `http.server GET` with no path at all, so every route collapses into one name. Child spans are absent either way.
- Initializing from `@sentry/nestjs` instead of `@sentry/bun` costs the server span entirely: unbundled, no server span of any kind is emitted and events lose their transaction name.
- Without the `SentryGlobalFilter` provider, controller errors are swallowed and no event is sent.
- There is no runtime hook that substitutes for the bundle. `Bun.plugin(sentryBunPlugin())` at runtime breaks `@nestjs/common`'s CommonJS named exports and the app does not boot (`SyntaxError: Export named 'Injectable' not found`), and `@sentry/server-runtime-injection/register` is a no-op on Bun because `node:module.registerHooks` is undefined there.
- The unbundled failure is silent: there is no warning at all unless `debug: true` is set.
- There are no Nest-specific spans in either lifecycle, and `SentryModule.forRoot()` contributed no visible spans on Bun; the piece from `@sentry/nestjs` that demonstrably mattered is `SentryGlobalFilter`.
- Browser-side capture was not exercised.

What to change:

- New page `docs/platforms/javascript/guides/bun/frameworks/nestjs.mdx` with the tsconfig requirement, the `@sentry/bun` init and the `reflect-metadata` import order, the module wiring, the full build recipe with its `external` list, the `bun run build.ts && bun dist/main.js` commands, and the capability list.
- State on that page that the unbundled path can be given route names from app code with a global Nest interceptor that reads `req.route.path` and, on the root span, calls `updateName`, sets `http.route` and sets `sentry.segment.name.source` to `route` (the v10 `sentry.source` key does not work) — and that this restores the name only, not the child spans.
- `guides/bun/index.mdx:90-94`: replace the "Bundled Code Limitation" alert rather than amending it. For NestJS the bundle is the only path to library instrumentation.
- `platform-includes/getting-started-install/javascript.nestjs.mdx:3-15`: add a Bun tab.

---

_From the runtime docs audit of September 2026, item DOC-F9, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._
