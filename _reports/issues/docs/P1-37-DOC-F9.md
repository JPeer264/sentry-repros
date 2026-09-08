No page mentions NestJS on Bun. `docs/platforms/javascript/guides/nestjs/index.mdx:4-5` sets `sdk: sentry.javascript.nestjs` with `fallbackGuide: javascript.node`, the prerequisites include at `nestjs/index.mdx:14` resolves to the Node prerequisites, and the init snippet at `nestjs/index.mdx:75` is Node-only; the Bun guide's only bundling statement is the alert at `guides/bun/index.mdx:96-98`.

Verified on NestJS 11 (`@nestjs/core` + `@nestjs/platform-express`) with `@sentry/nestjs` and `@sentry/bun` 10.67.0 on Bun 1.4.0: a `tsconfig.json` with `experimentalDecorators` and `emitDecoratorMetadata`, `Sentry.init` from `@sentry/bun` in `src/instrument.ts` imported as the first line of `src/main.ts`, `SentryModule.forRoot()` plus the `SentryGlobalFilter` `APP_FILTER` provider in `src/app.module.ts`, then a `Bun.build({ target: 'bun', plugins: [sentryBunPlugin()] })` build from `@sentry/bun/plugin` that lists Nest's lazily required optional peers in `external` (`@nestjs/microservices`, `@nestjs/microservices/microservices-module`, `@nestjs/websockets`, `@nestjs/websockets/socket-module`, `@nestjs/platform-express/multer`, `class-validator`, `class-transformer`, `cache-manager`).

Works today:

- Unhandled controller errors, via the mandatory `SentryGlobalFilter`
- Per-request isolation across concurrent requests
- Incoming `sentry-trace`/`baggage` continuation
- Outgoing `fetch` spans with propagation headers
- `mysql` database spans in the bundled build
- `Sentry.logger` log envelopes

Known limits:

- Route names and the Express middleware and handler child spans exist only in the bundled build; `bun src/main.ts` gives URL-sourced names and no child spans.
- Without the `SentryGlobalFilter` provider, controller errors are swallowed and no event is sent.
- Omitting the `external` entries above makes the build fail outright.

What to change:

- New page `docs/platforms/javascript/guides/bun/frameworks/nestjs.mdx` with the tsconfig requirement, the `@sentry/bun` init, the module wiring, the build recipe with its `external` list, and the capability list.

---

_From the runtime docs audit of September 2026, item DOC-F9, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._
