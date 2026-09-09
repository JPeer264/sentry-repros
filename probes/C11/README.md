# C11 - Configuration from env on Workers

Runtime: Cloudflare Workers (`wrangler dev` 4.x / workerd 1.20260903.1) | SDK: `@sentry/cloudflare`
10.67.0 (develop line, tarballs in `_toolbox/pack/`)

## What it reproduces

A Worker wrapped in `withSentry((env) => ({ tunnel: env.SINK_URL }), { fetch })` that passes no
`dsn`, `environment`, `release` or `tracesSampleRate` in code, so every one of those has to come
from the Worker env. `wrangler.jsonc` supplies `SENTRY_DSN`, `SENTRY_ENVIRONMENT=qa`,
`SENTRY_RELEASE=r1` and `SENTRY_TRACES_SAMPLE_RATE=1` as `vars`, plus a `version_metadata` binding
called `CF_VERSION_METADATA`. Five routes drive it: `/env` logs the raw env object, `/opts` logs the
resolved client options from `Sentry.getClient().getOptions()`, `/hello` answers 200, `/error`
throws `Error("route boom")` out of the handler, and `/sentinel` captures the message used as the
sink sentinel. Two sibling configs vary one input each: `wrangler-norelease.jsonc` drops
`SENTRY_RELEASE` so the release has to fall back to `CF_VERSION_METADATA.id`, and
`wrangler-rate0.jsonc` sets `SENTRY_TRACES_SAMPLE_RATE=0` as a control that the sample rate really
comes from env. The probe checks that the resolved options, the events, the streamed `http.server`
spans and the outgoing DSC all carry the env-supplied values.

## Install

From this directory:

```
npm install --no-audit --no-fund \
  ../../_toolbox/pack/sentry-cloudflare-10.67.0.tgz \
  ../../_toolbox/pack/sentry-core-10.67.0.tgz \
  ../../_toolbox/pack/sentry-opentelemetry-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  wrangler@4
```

## Run

From this directory, one sink per run so each run gets its own raw envelope file:

```
# run 1 - SENTRY_RELEASE=r1, SENTRY_TRACES_SAMPLE_RATE=1
PORT=45311 RAW=$PWD/raw-run1.log node sink.mjs > sink.log 2>&1 & spid=$!
sleep 1
./run.sh wrangler.jsonc 45312 45311 app-run1.log drive-run1.out
kill $spid; wait $spid

# run 2 - no SENTRY_RELEASE, release must come from CF_VERSION_METADATA.id
PORT=45311 RAW=$PWD/raw-run2.log node sink.mjs > sink-run2.log 2>&1 & spid=$!
sleep 1
./run.sh wrangler-norelease.jsonc 45312 45311 app-run2.log drive-run2.out
kill $spid; wait $spid

# run 3 - control, SENTRY_TRACES_SAMPLE_RATE=0
PORT=45311 RAW=$PWD/raw-run3.log node sink.mjs > sink-run3.log 2>&1 & spid=$!
sleep 1
./run.sh wrangler-rate0.jsonc 45312 45311 app-run3.log drive-run3.out
kill $spid; wait $spid

grep -E '^(ENV|OPTS) ' app-run1.log app-run2.log app-run3.log
```

`run.sh <config> <app-port> <sink-port> <app-log> <drive-out>` starts
`./node_modules/.bin/wrangler dev --config <config> --port <app-port> --inspector-port 0 --var
SINK_URL:http://127.0.0.1:<sink-port>/`, waits for the `Ready on http://localhost:<app-port>` line,
runs `drive.mjs`, and kills the wrangler process it started. `drive.mjs` clears the sink, GETs
`/env`, `/opts`, `/hello`, `/error`, `/sentinel`, polls the sink until the `sentinel` event is in it,
then prints every sink item. `sink.mjs` is `_toolbox/sink.mjs` with the event mapping trimmed to
`message`/`exception`/`sdk`/`release`/`environment` plus the envelope-header `trace` (the DSC), and
the span mapping changed to emit, per span, `{name, release, environment, sample_rate}` from the
span attributes plus the same DSC; `RAW=<file>` also appends every raw envelope item.

## Expected

Recorded verdict: **works**.

With no `dsn` in code, `withSentry(env => ({ tunnel }))` picks up `SENTRY_DSN`,
`SENTRY_ENVIRONMENT=qa`, `SENTRY_TRACES_SAMPLE_RATE=1` and `SENTRY_RELEASE=r1` from the wrangler
vars: error and message events carry release `r1` / environment `qa`, and every request produces a
sampled `http.server` span (stream lifecycle, `sentry.sample_rate=1`, DSC `sampled=true`). Removing
`SENTRY_RELEASE` makes the release fall back to `CF_VERSION_METADATA.id` (a local-dev uuid) on
events, spans and DSC. A control run with `SENTRY_TRACES_SAMPLE_RATE=0` produces no span envelopes
and DSC `sampled=false`, so the rate really comes from env.

Recorded evidence lines:

```
run 1 (SENTRY_RELEASE=r1, rate 1):
OPTS {"dsn":"https://public@o1.ingest.sentry.io/1","environment":"qa","release":"r1","tracesSampleRate":1,"tunnel":"http://127.0.0.1:41123/"}
{"type":"span","items":[{"name":"http.server GET","release":"r1","environment":"qa","sample_rate":1}],"dsc":{"release":"r1","environment":"qa","sample_rate":"1","sampled":"true"}}
{"type":"event","exception":"route boom","release":"r1","environment":"qa","sdk":"sentry.javascript.cloudflare","dsc":{"release":"r1","environment":"qa","sample_rate":"1","sampled":"true"}}
{"type":"event","message":"sentinel","exception":"sentinel","release":"r1","environment":"qa","sdk":"sentry.javascript.cloudflare","dsc":{"release":"r1","environment":"qa","sample_rate":"1","sampled":"true"}}

run 2 (no SENTRY_RELEASE, version_metadata binding):
ENV {...,"CF_VERSION_METADATA":{"id":"87d9cbf2-d42c-4491-bcb3-79d70d9c842c","tag":"","timestamp":"2026-09-04T08:27:17.555Z"}}
OPTS {"dsn":"https://public@o1.ingest.sentry.io/1","environment":"qa","release":"87d9cbf2-d42c-4491-bcb3-79d70d9c842c","tracesSampleRate":1,"tunnel":"http://127.0.0.1:41123/"}
{"type":"span","items":[{"name":"http.server GET","release":"87d9cbf2-d42c-4491-bcb3-79d70d9c842c","environment":"qa","sample_rate":1}],"dsc":{"release":"87d9cbf2-d42c-4491-bcb3-79d70d9c842c","environment":"qa","sample_rate":"1","sampled":"true"}}
{"type":"event","exception":"route boom","release":"87d9cbf2-d42c-4491-bcb3-79d70d9c842c","environment":"qa","sdk":"sentry.javascript.cloudflare","dsc":{...,"sampled":"true"}}

run 3 (control, SENTRY_TRACES_SAMPLE_RATE=0): only two event items, no span items:
OPTS {...,"release":"r1","tracesSampleRate":0,...}
{"type":"event","exception":"route boom","release":"r1","environment":"qa","sdk":"sentry.javascript.cloudflare","dsc":{"release":"r1","environment":"qa","sample_rate":"0","sampled":"false"}}
{"type":"event","message":"sentinel","exception":"sentinel","release":"r1","environment":"qa","sdk":"sentry.javascript.cloudflare","dsc":{"release":"r1","environment":"qa","sample_rate":"0","sampled":"false"}}
```

## Observed on 2026-09-07

Matches the recorded verdict (**works**), on all three runs. Verbatim trimmed output of the run
above (`drive-run{1,2,3}.out`, `app-run{1,2,3}.log`, `raw-run{1,2,3}.log` in this directory):

```
run 1 (wrangler.jsonc: SENTRY_RELEASE=r1, SENTRY_TRACES_SAMPLE_RATE=1)
app-run1.log:
ENV {"SINK_URL":"http://127.0.0.1:45311/","SENTRY_DSN":"https://public@o1.ingest.sentry.io/1","SENTRY_ENVIRONMENT":"qa","SENTRY_RELEASE":"r1","SENTRY_TRACES_SAMPLE_RATE":"1","CF_VERSION_METADATA":{"id":"8f5db349-fc8f-4bfd-993c-e2a257b5838f","tag":"","timestamp":"2026-09-07T08:58:38.308Z"}}
OPTS {"dsn":"https://public@o1.ingest.sentry.io/1","environment":"qa","release":"r1","tracesSampleRate":1,"tunnel":"http://127.0.0.1:45311/"}
drive-run1.out: GET /env -> 200, /opts -> 200, /hello -> 200, /error -> 500, /sentinel -> 200
{"type":"span","items":[{"name":"http.server GET","release":"r1","environment":"qa","sample_rate":1}],"dsc":{"environment":"qa","release":"r1","public_key":"public","trace_id":"c8aefb63167e4db190aff441b0d5fbad","org_id":"1","sampled":"true","sample_rand":"0.3045180713286231","sample_rate":"1"}}
{"type":"span","items":[{"name":"http.server GET","release":"r1","environment":"qa","sample_rate":1}],"dsc":{...,"sampled":"true","sample_rate":"1"}}
{"type":"span","items":[{"name":"http.server GET","release":"r1","environment":"qa","sample_rate":1}],"dsc":{...,"sampled":"true","sample_rate":"1"}}
{"type":"event","exception":"route boom","sdk":"sentry.javascript.cloudflare","release":"r1","environment":"qa","dsc":{"environment":"qa","release":"r1","public_key":"public","trace_id":"f91e27202dfd43dbaae0b99c54bf4bf4","org_id":"1","sampled":"true","sample_rand":"0.6178737680386925","sample_rate":"1"}}
{"type":"span","items":[{"name":"http.server GET","release":"r1","environment":"qa","sample_rate":1}],"dsc":{...,"trace_id":"f91e27202dfd43dbaae0b99c54bf4bf4","sampled":"true","sample_rate":"1"}}
{"type":"event","message":"sentinel","exception":"sentinel","sdk":"sentry.javascript.cloudflare","release":"r1","environment":"qa","dsc":{"environment":"qa","release":"r1","public_key":"public","trace_id":"d78244847281477fb6fa350ecba1349f","org_id":"1","sampled":"true","sample_rand":"0.9121834746627213","sample_rate":"1"}}
{"type":"span","items":[{"name":"http.server GET","release":"r1","environment":"qa","sample_rate":1}],"dsc":{...,"trace_id":"d78244847281477fb6fa350ecba1349f","sampled":"true","sample_rate":"1"}}

run 2 (wrangler-norelease.jsonc: no SENTRY_RELEASE)
app-run2.log:
ENV {"SINK_URL":"http://127.0.0.1:45311/","SENTRY_DSN":"https://public@o1.ingest.sentry.io/1","SENTRY_ENVIRONMENT":"qa","SENTRY_TRACES_SAMPLE_RATE":"1","CF_VERSION_METADATA":{"id":"72a22150-3ac6-411c-b10b-7aa4a5640b16","tag":"","timestamp":"2026-09-07T08:59:06.944Z"}}
OPTS {"dsn":"https://public@o1.ingest.sentry.io/1","environment":"qa","release":"72a22150-3ac6-411c-b10b-7aa4a5640b16","tracesSampleRate":1,"tunnel":"http://127.0.0.1:45311/"}
{"type":"span","items":[{"name":"http.server GET","release":"72a22150-3ac6-411c-b10b-7aa4a5640b16","environment":"qa","sample_rate":1}],"dsc":{"environment":"qa","release":"72a22150-3ac6-411c-b10b-7aa4a5640b16","public_key":"public","trace_id":"1d95a138a340472dbd37b4dc291a3dc0","org_id":"1","sampled":"true","sample_rand":"0.23187616446777104","sample_rate":"1"}}
{"type":"event","exception":"route boom","sdk":"sentry.javascript.cloudflare","release":"72a22150-3ac6-411c-b10b-7aa4a5640b16","environment":"qa","dsc":{"environment":"qa","release":"72a22150-3ac6-411c-b10b-7aa4a5640b16","public_key":"public","trace_id":"9754f09350274a02b6f501f4b2de3529","org_id":"1","sampled":"true","sample_rand":"0.15558998449915395","sample_rate":"1"}}
{"type":"event","message":"sentinel","exception":"sentinel","sdk":"sentry.javascript.cloudflare","release":"72a22150-3ac6-411c-b10b-7aa4a5640b16","environment":"qa","dsc":{...,"sampled":"true","sample_rate":"1"}}
(7 items total, same shape as run 1, every one carrying the uuid as release)

run 3 (wrangler-rate0.jsonc: SENTRY_TRACES_SAMPLE_RATE=0) - control
app-run3.log:
OPTS {"dsn":"https://public@o1.ingest.sentry.io/1","environment":"qa","release":"r1","tracesSampleRate":0,"tunnel":"http://127.0.0.1:45311/"}
drive-run3.out: only two sink items, no span items:
{"type":"event","exception":"route boom","sdk":"sentry.javascript.cloudflare","release":"r1","environment":"qa","dsc":{"environment":"qa","release":"r1","public_key":"public","trace_id":"834b90a3af864f36ae3c3de07517c6bc","org_id":"1","sampled":"false","sample_rand":"0.5559113582302944","sample_rate":"0"}}
{"type":"event","message":"sentinel","exception":"sentinel","sdk":"sentry.javascript.cloudflare","release":"r1","environment":"qa","dsc":{"environment":"qa","release":"r1","public_key":"public","trace_id":"46ec4159267b410e8c4a49bedb2efb36","org_id":"1","sampled":"false","sample_rand":"0.6214425890407319","sample_rate":"0"}}
```

Every recorded claim holds: with nothing but a `tunnel` in code, the resolved options carry the DSN,
`environment: "qa"`, `release: "r1"` and `tracesSampleRate: 1` from the env; events and the streamed
`http.server` spans carry `release`/`environment` and `sentry.sample_rate: 1`, and the DSC on the
envelope header carries `sampled: "true"`, `sample_rate: "1"`. Dropping `SENTRY_RELEASE` moves the
release to `CF_VERSION_METADATA.id` everywhere at once (options, events, span attributes, DSC), and
the rate-0 control emits the two events with `sampled: "false"` / `sample_rate: "0"` and no span
envelope at all - and because the sentinel event that follows the requests did arrive, the absence
of spans is real and not a timing artifact.

Differences from the record are cosmetic only: ports (45311 sink / 45312 app instead of 41123 /
41231), the per-run `CF_VERSION_METADATA.id` uuid (the record already notes that local `wrangler
dev` mints a fresh uuid on every start, and it differs even between run 1 and run 2 here), and the
run's own trace ids and `sample_rand` values. This rebuild also leaves the `version_metadata`
binding in all three configs rather than only in the no-release one; that changes nothing, because
`SENTRY_RELEASE` takes precedence over `CF_VERSION_METADATA.id` in `getFinalOptions`, which run 1
and run 3 confirm (`release: "r1"` while the ENV line shows a uuid is available).

The record's side observation reproduces too: `Sentry.captureMessage('sentinel')` arrives with both
`message: "sentinel"` and a synthetic exception value `"sentinel"`, i.e. develop attaches a stack
trace to messages by default.

## Files

- `src/index.ts` - the Worker; `withSentry` passes only `tunnel`
- `wrangler.jsonc` - `SENTRY_RELEASE=r1`, `SENTRY_TRACES_SAMPLE_RATE=1`, `version_metadata` binding
- `wrangler-norelease.jsonc` - same without `SENTRY_RELEASE`
- `wrangler-rate0.jsonc` - same with `SENTRY_TRACES_SAMPLE_RATE=0`
- `sink.mjs` - envelope sink extended with release/environment/sample_rate and the DSC
- `drive.mjs` - request driver plus sentinel poll
- `run.sh` - starts `wrangler dev` on one config, drives it, kills it
- `app-run{1,2,3}.log`, `drive-run{1,2,3}.out`, `raw-run{1,2,3}.log`, `sink*.log` - output of the run above
- `pids.txt` - note that every process started here was killed
