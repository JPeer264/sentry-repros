# B14 — NestJS on Bun via the plugin build

## What it reproduces

A NestJS 12 app (`@nestjs/platform-express`, Bun 1.4.0) bundled with `Bun.build` + `sentryBunPlugin()`
and instrumented with `@sentry/bun` plus `nestIntegration()` from `@sentry/nestjs`. The plugin build
does give route-named request spans (`http.server GET /cats/:id`, `http.route=/cats/:id`), Express
middleware/handler spans, the Nest spans (`Create Nest App`, `CatsController.getCat`,
`Request handler`) and error capture through `SentryGlobalFilter`
(`mechanism: auto.http.nestjs.global_filter`). Two things break. With the documented
`external: ["@sentry/*"]` (build.ts, `dist/`), `SentryGlobalFilter` from `@sentry/nestjs/setup` runs
against a second, external copy of `@nestjs/core`, so `BaseExceptionFilter`'s injected
`httpAdapterHost` is undefined and every error request additionally crashes with
`TypeError: undefined is not an object (evaluating 'applicationRef.isHeadersSent')` — the original
error is still captured, but the client gets Express's HTML 500 instead of Nest's JSON 500. Bundling
`@sentry/nestjs` instead (build2.ts, `dist2/`) trips a Bun bundler bug on `export * from '@sentry/node'`
and the app does not boot. Keeping exactly `@sentry/nestjs` external via an `onResolve` hook while
bundling `@sentry/nestjs/setup` (build4.ts, `dist4/`) works end to end.

## Install

```
npm install --no-audit --no-fund \
  $REPRO/_toolbox/pack/sentry-bun-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-node-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-nestjs-10.67.0.tgz \
  @nestjs/core @nestjs/common @nestjs/platform-express reflect-metadata rxjs
```

The same tarballs are mirrored in `$REPRO/_toolbox/pack/`.
`@nestjs/*` resolves to 12.0.1. All `@sentry/*` packages are `develop` (v11 line, package version
10.67.0).

## Run

```
bun run build.ts    # external ["@sentry/*"] plus NestJS optional peers -> dist/
bun run build2.ts   # @sentry/nestjs bundled                            -> dist2/
bun run build4.ts   # exactly "@sentry/nestjs" external, /setup bundled -> dist4/

# each run starts its own sink (sink.mjs) and app, drives /cats/42, /boom and /sentinel from a
# plain node process, waits for the sentinel event AND its span, then kills both processes
SINK_PORT=41885 PORT=41886 SENTRY_NEST=1 SENTRY_FILTER=1 SENTRY_LIFECYCLE=stream LABEL=b-nest-filter-stream ./run.sh
DIST=dist2 SINK_PORT=41913 PORT=41914 SENTRY_NEST=1 SENTRY_FILTER=1 SENTRY_LIFECYCLE=stream LABEL=e-dist2-nest-filter-stream ./run.sh
DIST=dist4 SINK_PORT=41933 PORT=41934 SENTRY_NEST=1 SENTRY_FILTER=1 SENTRY_LIFECYCLE=stream LABEL=g-dist4-nest-filter-stream ./run.sh
```

Other variants from the record: `SENTRY_NEST=0 SENTRY_FILTER=0` (plain `@sentry/bun`),
`SENTRY_FILTER=0` (integration without the filter), `SENTRY_LIFECYCLE=static` (transaction
envelopes), `bun run build3.ts` + `DIST=dist3` (Sentry and Nest both external), and
`BUN=$S/bun1314/bun-darwin-aarch64/bun` for the Bun 1.3.14 CI pin.

`dist/`, `dist2/` and `dist4/` are committed but are not runnable on their own — the bundles keep
`@sentry/*` (and the Nest optional peers) external, so `npm install` is required either way. They
were left in place because this environment forbids `rm` on anything but `node_modules`.

## Expected (recorded verdict: partial)

- B, `dist/`, `external: ["@sentry/*"]`, nestIntegration + `APP_FILTER: SentryGlobalFilter`, stream:

```
TypeError: undefined is not an object (evaluating 'applicationRef.isHeadersSent')
/boom -> 500 <!DOCTYPE html> ... <title>Error</tit
{"type":"event","exception":"boom from nest","mechanism":"auto.http.nestjs.global_filter","handled":false,"sdk":"sentry.javascript.bun","transaction":"GET /boom","hasContextLine":true}
{"type":"event","exception":"undefined is not an object (evaluating 'applicationRef.isHeadersSent')","mechanism":"auto.http.express","handled":false,...,"transaction":"GET /boom"}
{"type":"span","items":["function Create Nest App [root] {origin=auto.http.nestjs status=ok}"]}
{"type":"span","items":["middleware urlencodedParser {origin=auto.http.express status=ok}","middleware jsonParser ...","middleware <anonymous> ...","handler Request handler {cb=getCat origin=auto.http.nestjs status=ok}","function CatsController.getCat {route=/cats/:id cb=getCat origin=auto.http.nestjs status=ok}","handler /cats/:id {route=/cats/:id origin=auto.http.express status=ok}","http.server GET /cats/:id [root] {route=/cats/:id origin=auto.http.server status=ok}"]}
```

- E, `dist2/`, `@sentry/nestjs` bundled:

```
1 | export * from '@sentry/node';
ReferenceError: node is not defined
      at .../node_modules/@sentry/nestjs/build/esm/index.js:1:1
```

- G, `dist4/`: works end to end.

## Observed on 2026-09-07

Matches the record.

B (`drive-b-nest-filter-stream.log`, `app-b-nest-filter-stream.log`):

```
/cats/42 -> 200 {"id":"42","name":"Kitty"}
/boom -> 500 <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</tit
/sentinel -> 200 {"ok":true}
TypeError: undefined is not an object (evaluating 'applicationRef.isHeadersSent')
    at handleUnknownError (.../node_modules/@nestjs/core/exceptions/base-exception-filter.js:45:14)
{"type":"event","exception":"Error: boom from nest","mechanism":"auto.http.nestjs.global_filter","handled":false,"sdk":"sentry.javascript.bun","runtime":"bun","hasContextLine":true,"transaction":"GET /boom"}
{"type":"event","exception":"TypeError: undefined is not an object (evaluating 'applicationRef.isHeadersSent')","mechanism":"auto.http.express","handled":false,"sdk":"sentry.javascript.bun","runtime":"bun","hasContextLine":true,"transaction":"GET /boom"}
{"type":"span","items":["function Create Nest App [root] {origin=auto.http.nestjs status=ok}"]}
{"type":"span","items":["middleware urlencodedParser {origin=auto.http.express status=ok}","middleware jsonParser {origin=auto.http.express status=ok}","middleware <anonymous> {origin=auto.http.express status=ok}","handler Request handler {cb=getCat origin=auto.http.nestjs status=ok}","function CatsController.getCat {route=/cats/:id cb=getCat origin=auto.http.nestjs status=ok}","handler /cats/:id {route=/cats/:id origin=auto.http.express status=ok}","http.server GET /cats/:id [root] {route=/cats/:id origin=auto.http.server status=ok}"]}
{"type":"span","items":["handler Request handler {cb=boom origin=auto.http.nestjs status=error}",...,"function RootController.boom {route=/boom cb=boom origin=auto.http.nestjs status=error}","handler /boom {route=/boom origin=auto.http.express status=error}","http.server GET /boom [root] {route=/boom origin=auto.http.server status=error}"]}
```

E (`app-e-dist2-nest-filter-stream.log`):

```
1 | export * from '@sentry/node';
    ^
ReferenceError: node is not defined
      at $REPRO/probes/B14/node_modules/@sentry/nestjs/build/esm/index.js:1:1

Bun v1.4.0 (macOS arm64)
```

G (`drive-g-dist4-nest-filter-stream.log`) — JSON 500, one captured error, no `applicationRef` crash,
and the exception-filter span:

```
/cats/42 -> 200 {"id":"42","name":"Kitty"}
/boom -> 500 {"statusCode":500,"message":"Internal server error"}
/sentinel -> 200 {"ok":true}
{"type":"event","exception":"Error: boom from nest","mechanism":"auto.http.nestjs.global_filter","handled":false,"sdk":"sentry.javascript.bun","runtime":"bun","hasContextLine":true,"transaction":"GET /boom"}
{"type":"span","items":["handler Request handler {cb=boom origin=auto.http.nestjs status=error}","middleware urlencodedParser {origin=auto.http.express status=ok}","middleware jsonParser {origin=auto.http.express status=ok}","middleware <anonymous> {origin=auto.http.express status=ok}","function RootController.boom {route=/boom cb=boom origin=auto.http.nestjs status=error}","middleware SentryGlobalFilter {origin=auto.middleware.nestjs.exception_filter status=ok}","handler /boom {route=/boom origin=auto.http.express status=ok}","http.server GET /boom [root] {route=/boom origin=auto.http.server status=error}"]}
```

### Differences from the record

- The record had to rollup-build `@sentry/nestjs` from a copy of the worktree package because no
  tarball existed; `$S/pack/sentry-nestjs-10.67.0.tgz` now exists and was used directly.
- `instrument.ts` static-imports `nestIntegration` and only registers it when `SENTRY_NEST=1`, so the
  `SENTRY_NEST=0` variant still loads `@sentry/nestjs` (it just does not use it). Variant A was not
  re-run.
- The record's sink is an extended copy of `$S/qs/sink.mjs`; `sink.mjs` here is that copy rebuilt —
  span item strings carry `{route= cb= origin= status=}` and transactions carry `route`.
- The driver waits for the sentinel event *and* its own request span before reading the sink; waiting
  for the event alone returns before the span envelopes are flushed.
