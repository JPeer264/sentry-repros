# N7 — Bun with an existing OpenTelemetry setup (`skipOpenTelemetrySetup`)

Runtime: bun 1.4.0 · SDK: `@sentry/bun` 10.67.0 (develop, `getsentry/sentry-javascript@6f2da7483d`)

## What it reproduces

The "Bun with an existing OpenTelemetry setup" docs page
(`~/dev/sentry-docs/platform-includes/performance/opentelemetry-setup/javascript.bun.mdx:3-44`,
NodeTracerProvider tab) cannot be assembled at all on the v11 line. `instrument-n7.ts` is that tab
verbatim, and `bun --preload ./instrument-n7.ts app-n7.ts` dies on its second line because
`@sentry/node-core` does not exist: there is no `packages/node-core` in the monorepo, and npm's latest
is 10.73.0, so there is no 10.67.0 to install. Even with that import removed,
`@sentry/opentelemetry@10.67.0` exports neither `SentrySampler` nor `SentrySpanProcessor` nor
`wrapSamplingDecision`, and the string `skipOpenTelemetrySetup` appears nowhere in the develop source,
so the option is silently ignored. `instrument-n7-reduced.ts` keeps `skipOpenTelemetrySetup: true` plus
what does exist (a bare `NodeTracerProvider` and `SentryPropagator`) and shows the SDK still doing its
full setup anyway: `http.server`/`http.client` spans still stream and the outgoing `fetch` still carries
`sentry-trace`/`baggage` — while the span created purely through the OTEL API (`manual`) never reaches
Sentry. On develop this whole page describes a mechanism the SDK no longer has.

## Install

```
cd $REPRO/probes/N7
npm install --no-audit --no-fund
```

(`package.json` points every `@sentry/*` dependency at the 10.67.0 tarballs in
`$REPRO/_toolbox/pack/`.)

## Run

Sink on 43117, app on 43118, echo target on 43119.

```
cd $REPRO/probes/N7
PORT=43117 node ./sink.mjs > sink.log 2>&1 & sinkpid=$!

# 1. the docs page verbatim — fails to boot
SINK_PORT=43117 APP_PORT=43118 ECHO_PORT=43119 \
  bun --preload ./instrument-n7.ts app-n7.ts > run-tracerprovider.log 2>&1

# 2. what @sentry/opentelemetry@10.67.0 actually exports
bun probe-imports.ts > run-exports.log 2>&1

# 3. does the option do anything? source checks
grep -rn "skipOpenTelemetrySetup" ~/dev/sentry-worktrees/audit-runtime-docs/packages/*/src/
ls ~/dev/sentry-worktrees/audit-runtime-docs/packages/node-core

# 4. the reduced setup — boots, and the SDK sets OTEL up anyway
SINK_PORT=43117 APP_PORT=43118 ECHO_PORT=43119 \
  bun --preload ./instrument-n7-reduced.ts app-n7.ts > run-reduced.log 2>&1 & apppid=$!
curl -s http://127.0.0.1:43118/work; curl -s http://127.0.0.1:43118/error; curl -s http://127.0.0.1:43118/sentinel
curl -s http://127.0.0.1:43117/__items

kill $apppid; kill $sinkpid
```

`/work` wraps an outgoing `fetch` to the echo server in an OTEL-API-only span named `manual` and returns
the trace headers the echo server received. `/sentinel` is the sentinel that proves everything sent
before it has arrived in the sink.

## Expected

Recorded verdict: **broken**.

Recorded evidence lines:

```
$ bun --preload ./instrument-n7.ts app-n7.ts   # instrument-n7.ts = the NodeTracerProvider tab verbatim
error: Cannot find module '@sentry/node-core' from '/…/deep/N7/dev/instrument-n7.ts'
Bun v1.4.0 (macOS arm64)

$ bun probe-imports.ts
@sentry/opentelemetry exports: SentryPropagator, SentryTracerProvider, getScopesFromContext, registerPrepareSpanScope, setOpenTelemetryContextAsyncContextStrategy
SentrySampler: undefined
SentrySpanProcessor: undefined
wrapSamplingDecision: undefined

$ grep -rn "skipOpenTelemetrySetup" ~/dev/sentry-worktrees/audit-runtime-docs/packages/*/src/
(no matches)
$ ls ~/dev/sentry-worktrees/audit-runtime-docs/packages/node-core
ls: …/packages/node-core: No such file or directory

# reduced run (skipOpenTelemetrySetup: true honoured? no) - app response from /work:
{"ok":true,"headers":{"sentry-trace":"e875d166205249619b9d5435cdc46c27-9d9b273117ef37b4-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=e875d166205249619b9d5435cdc46c27,sentry-org_id=1,sentry-sampled=true,…","traceparent":null}}

# sink (39411) after /work, /error, /sentinel - note: NO `manual` span anywhere
{"type": "span", "items": ["http.server | GET | trace=e875d166205249619b9d5435cdc46c27 | parent=9d9b273117ef37b4", "http.client | GET 127.0.0.1 | trace=e875d166205249619b9d5435cdc46c27 | parent=82b86e9027e6f84d", "http.server | GET | trace=e875d166205249619b9d5435cdc46c27 | parent=-"]}
{"type": "event", "exception": "n7-boom", "mechanism": "generic", "handled": true, "sdk": "sentry.javascript.bun", "trace_id": "177029a631d440c0b7824d3c815c4b0d"}
{"type": "event", "message": "sentinel", "sdk": "sentry.javascript.bun", "trace_id": "09a9547d8a7d4def95e91b4ecc732868"}
```

## Observed on 2026-09-07

Matches the record: verdict **broken**, reproduced on the first run. bun 1.4.2, ports 43117 (sink),
43118 (app), 43119 (echo).

The docs page verbatim (`run-tracerprovider.log`, exit 1):

```
error: Cannot find module '@sentry/node-core' from '$REPRO/probes/N7/instrument-n7.ts'

Bun v1.4.2 (macOS arm64)
```

Exports (`run-exports.log`):

```
@sentry/opentelemetry exports: SentryPropagator, SentryTracerProvider, getScopesFromContext, registerPrepareSpanScope, setOpenTelemetryContextAsyncContextStrategy
SentrySampler: undefined
SentrySpanProcessor: undefined
wrapSamplingDecision: undefined
```

Source checks:

```
$ grep -rn "skipOpenTelemetrySetup" ~/dev/sentry-worktrees/audit-runtime-docs/packages/*/src/
(no matches, exit 1)
$ ls ~/dev/sentry-worktrees/audit-runtime-docs/packages/node-core
ls: $SDK/packages/node-core: No such file or directory
```

The reduced setup boots (`run-reduced.log`) and `skipOpenTelemetrySetup: true` changes nothing, the
response from `/work` still carries full Sentry propagation headers:

```
[instrument] client after init: true
[app] listening on 43118, echo on 43119

{"ok":true,"headers":{"sentry-trace":"766159d1bc1a463baf1270d654b2c474-ba5300585ca20022-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=766159d1bc1a463baf1270d654b2c474,sentry-sampled=true,sentry-sample_rand=0.16430125644752502,sentry-sample_rate=1","traceparent":null}}
```

Sink after `/work`, `/error`, `/sentinel` (`items.json`) - the SDK's own spans all arrive, the
OTEL-API span `manual` appears nowhere:

```
{"type": "event", "exception": "Error: n7-boom", "mechanism": "generic", "handled": true, "sdk": "sentry.javascript.bun", "runtime": "bun", "trace_id": "41136680b08147cc9b23d4df21f3ae4b"}
{"type": "event", "message": "sentinel", "sdk": "sentry.javascript.bun", "runtime": "bun", "trace_id": "f95a196f69824569bae3ee69c31fe6b0"}
{"type": "span", "trace_id": "766159d1bc1a463baf1270d654b2c474", "items": ["http.server | GET | trace=766159d1bc1a463baf1270d654b2c474 | parent=ba5300585ca20022", "http.client | GET 127.0.0.1 | trace=766159d1bc1a463baf1270d654b2c474 | parent=8840b0d25ca253e0", "http.server | GET | trace=766159d1bc1a463baf1270d654b2c474 | parent=-"]}
{"type": "span", "trace_id": "41136680b08147cc9b23d4df21f3ae4b", "items": ["http.server | GET | trace=41136680b08147cc9b23d4df21f3ae4b | parent=-"]}
{"type": "span", "trace_id": "f95a196f69824569bae3ee69c31fe6b0", "items": ["http.server | GET | trace=f95a196f69824569bae3ee69c31fe6b0 | parent=-"]}
```

### Differences from the record

- bun is 1.4.2 on this machine, the record ran on 1.4.0. The failure and the reduced run are identical
  on both.
- Ports are 43117/43118/43119 here (39411 sink, 51373/51374 app+echo in the record).
- The SDK is installed from the `_toolbox/pack` tarballs via `npm install` instead of the
  `$S/qs/bun` symlink template, which no longer exists on this machine. The record's note that
  `bun add <tarball>` fails on `@sentry/server-runtime-injection` still holds; `npm install` with all
  six `@sentry/*` tarballs listed in `package.json` resolves fine.
- The recorded baggage carries `sentry-org_id=1` and the rebuild's does not, because the record's DSN
  had an org id in it. The rebuild's baggage instead carries `sentry-sample_rand`/`sentry-sample_rate`.
  Irrelevant to the verdict.
- The record's two secondary findings (the 10.73.0 fetch-propagation regression, and the
  `skipOpenTelemetrySetup` transaction-name change on 10.73.0) are not rebuilt here: they are 10.73.0
  observations, and this rebuild tests develop only.
