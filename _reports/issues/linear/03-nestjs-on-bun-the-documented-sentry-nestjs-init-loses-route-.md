# NestJS on Bun: the documented `@sentry/nestjs` init loses route names, and the plugin build fails without Nest peers as externals

Milestone: Bun + Framework gaps
Labels: JavaScript, Bun, Bug
Priority: Medium

NestJS 11 boots on Bun 1.4.0 with a `tsconfig.json` that has `experimentalDecorators` and `emitDecoratorMetadata`. With `Sentry.init` from `@sentry/nestjs`, route names are lost on Bun; initializing from `@sentry/bun` and adding `nestIntegration()` from `@sentry/nestjs` restores them. Route names and the Express middleware and handler spans exist only in the bundled build; `bun src/main.ts` gives URL-named transactions and no child spans.

The `Bun.build` with `sentryBunPlugin()` fails with `Could not resolve: "@nestjs/microservices/microservices-module"` unless Nest's lazily required optional peers are listed as `external` (`@nestjs/microservices`, `@nestjs/microservices/microservices-module`, `@nestjs/websockets`, `@nestjs/websockets/socket-module`, `@nestjs/platform-express/multer`, `class-validator`, `class-transformer`, `cache-manager`).

**Work item.** Make `@sentry/nestjs` init pick the Bun SDK on Bun, and have the plugin treat Nest's optional peers as external by default.

**Evidence.** Cell record M-nestjs-bun in `_reports/deep-probe-report.html`; reproduction `cells/M-nestjs-bun/`, each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
