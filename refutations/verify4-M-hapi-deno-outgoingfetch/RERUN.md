# verify4-M-hapi-deno-outgoingfetch

Deps: `npm install $REPRO/_toolbox/pack/sentry-{deno,core,server-utils,server-runtime-injection,opentelemetry}-10.67.0.tgz @hapi/hapi`

Start helpers:
  PORT=41971 node sink.mjs > sink.log 2>&1 &
  REC_PORT=41972 node recorder.mjs > rec.log 2>&1 &

Variants (all: deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys <entry>):
  A baseline  SINK_PORT=41971 REC_PORT=41972 APP_PORT=41973 LIFECYCLE=static FETCHFIX=0 ... main-hook.ts
  B fix       ... LIFECYCLE=static FETCHFIX=1 ... main-hook.ts
  C fix       ... LIFECYCLE=stream FETCHFIX=1 ... main-hook.ts
  D fix       ... LIFECYCLE=static FETCHFIX=1 ... main-nohook.ts

Drive: curl /downstream (fetch), /downstream-http (node:http), /sentinel
Read:  curl -s http://127.0.0.1:41971/__items ; recorder log shows sentry-trace/baggage per hit.

FETCHFIX=1 adds ./fetch-integration.ts (denoFetchIntegration) to Sentry.init integrations.

## Run B/C (verification, 2026-09-06)

`bash run-b.sh > b-run.log 2>&1`   -> variants A (baseline hook+jsonfix static), B (fetchfix static),
                                      C (fetchfix stream), D (fetchfix, no import hook, static).
`bash run-c.sh > c-run.log 2>&1`   -> variant E (baseline hook+jsonfix stream).

Logs: b-run.log / c-run.log hold the sink `__items` per variant; b-rec.log / c-rec.log hold the
recorder lines with sentry-trace / baggage per downstream hit.

Result: baseline has NO http.client span and NO headers for `fetch` in both lifecycles; adding
`denoFetchIntegration()` from ./fetch-integration.ts to `Sentry.init({ integrations: [...] })`
produces the span and both headers in both lifecycles, with and without the import hook.
