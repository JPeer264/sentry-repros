# NestJS on Bun: the documented `@sentry/nestjs` init emits no server span, and the plugin build fails without Nest peers as externals

Milestone: Bun + Framework gaps
Labels: JavaScript, Bun, Bug
Priority: Medium

NestJS 11 boots on Bun 1.4.0 with a `tsconfig.json` that has `experimentalDecorators` and `emitDecoratorMetadata`. Initializing from `@sentry/nestjs` costs the server span entirely: unbundled, no server span of any kind is emitted and events lose their transaction name. The verified shape is `Sentry.init` from `@sentry/bun` in `src/instrument.ts`, imported as the first line of `src/main.ts`, plus `SentryModule.forRoot()` and the `SentryGlobalFilter` `APP_FILTER` provider from `@sentry/nestjs/setup`, which is the piece that captures controller errors. Route names and the Express middleware and handler spans exist only in the bundled build: `bun src/main.ts` gives URL-sourced names under `traceLifecycle: 'static'` and a span named just `http.server GET`, with no path at all, under the stream default. No runtime hook substitutes for the bundle, `Bun.plugin(sentryBunPlugin())` at runtime breaks `@nestjs/common`'s CommonJS named exports and `@sentry/server-runtime-injection/register` is a no-op on Bun.

The `Bun.build` with `sentryBunPlugin()` fails with `Could not resolve: "@nestjs/microservices/microservices-module"` unless Nest's lazily required optional peers are listed as `external` (`@nestjs/microservices`, `@nestjs/microservices/microservices-module`, `@nestjs/websockets`, `@nestjs/websockets/socket-module`, `@nestjs/platform-express/multer`, `class-validator`, `class-transformer`, `cache-manager`). `@sentry/bun` and the driver may stay on that list, because the plugin un-externalizes the packages it instruments.

**Work item.** Make `@sentry/nestjs` init pick the Bun SDK on Bun, and have the plugin treat Nest's optional peers as external by default.

**Evidence.** Cell record M-nestjs-bun in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-nestjs-bun/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-nestjs-bun), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
