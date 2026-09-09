# D09 — Request body capture on `Deno.serve`

Runtime: **deno** (2.9.0) · SDK: **develop** only (`@sentry/*` 10.67.0 tarballs from
`_toolbox/pack`, built from `getsentry/sentry-javascript` at `6f2da7483d`). 10.73.0 is not
installed and must not be.

## What it reproduces

A `Deno.serve` app with one throwing route (`POST /throw`), one succeeding route
(`POST /ok`) and a `GET /sentinel` route that captures the sentinel message. A driver POSTs a
JSON body to `/ok` and `/throw`, then hits `/sentinel` and waits for the sentinel event to
reach a local envelope sink before reading the sink.

The probe varies three knobs through env vars so a single app covers the whole matrix:

| env | values | effect |
| --- | --- | --- |
| `LIFECYCLE` | `stream` (default), `static` | `Sentry.init({ traceLifecycle })` |
| `BODIES` | `on` (default), `off` | `off` sets `dataCollection: { httpBodies: [] }` |
| `MAXSIZE` | unset (default), `none`, `small`, `always` | `denoServeIntegration({ maxRequestBodySize })` |
| `BODYSIZE` | driver-side; `2000` produces a 2010-byte JSON body | |

`sink-d09.mjs` is an extended copy of `_toolbox/sink.mjs`: it keeps `request.data` (plus its
length) on events and transactions, the `http.request.body.*` attributes on stream-lifecycle
spans, and the same attributes in the static transaction's `contexts.trace.data`.

## Install

```
cd $REPRO/probes/D09
npm install
```

`package.json` already points at the tarballs by relative path, so plain `npm install` is
enough. The explicit equivalent (with `S=$SCRATCH`):

```
npm install $REPRO/_toolbox/pack/sentry-deno-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
            $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz
```

`deno.json` sets `nodeModulesDir: "manual"` so Deno uses that prepared `node_modules`.

## Run

`run-d09.sh <label> [ENV=VAL ...]` picks a random sink port and a random app port, starts
`PORT=<sinkPort> node sink-d09.mjs`, starts the Deno app, drives it and writes
`result-<label>.json`. It kills both processes when it is done.

```
cd $REPRO/probes/D09
./run-d09.sh default
./run-d09.sh static           LIFECYCLE=static
./run-d09.sh bodies-off       LIFECYCLE=static BODIES=off
./run-d09.sh bodies-off-stream BODIES=off
./run-d09.sh maxsize-none     LIFECYCLE=static MAXSIZE=none
./run-d09.sh maxsize-small    LIFECYCLE=static MAXSIZE=small BODYSIZE=2000
./run-d09.sh override         LIFECYCLE=static BODIES=off MAXSIZE=always
```

Pass each `ENV=VAL` as its own argument — quoting them into the label is what made the first
attempt at this rebuild run seven copies of the default configuration.

What the script does internally, if you want to run the pieces by hand:

```
PORT=<sinkPort> node sink-d09.mjs > sink-<label>.log 2>&1 &
APP_PORT=<appPort> SINK_PORT=<sinkPort> [LIFECYCLE=...] [BODIES=...] [MAXSIZE=...] \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys probe.ts > app-<label>.log 2>&1 &
node drive-d09.mjs <appPort> <sinkPort> [bodyBytes] > result-<label>.json 2> drive-<label>.log
```

Types checked alongside the run:

```
cat node_modules/@sentry/deno/build/esm/integrations/deno-serve.d.ts
```

## Expected

Recorded verdict: **works**.

With `dataCollection: {}` a POST JSON body to a throwing `Deno.serve` route lands in
`request.data` on both the error event and the transaction (static lifecycle) and, in the
default stream lifecycle, also as the span attribute `http.request.body.data`.
`dataCollection: { httpBodies: [] }` removes `request.data` everywhere;
`denoServeIntegration({ maxRequestBodySize })` is typed (`MaxRequestBodySize`,
`@default 'medium'`), `'none'` suppresses capture, `'small'` truncates a 2010-byte body to
1000 chars ending in `'...'`, and `'always'` overrides `httpBodies: []` as the type comment
says.

Recorded evidence lines:

```
default (stream): {"type":"event","exception":"route boom","mechanism":"auto.http.deno","handled":false,"request":{"method":"POST","url":"http://127.0.0.1:22865/throw","data":"{\"user\":\"alice\",\"password\":\"hunter2\",\"n\":1}","dataLen":43,"hasHeaders":true}}
default (stream) span: {"name":"http.server POST","bodyAttrs":{"http.request.body.size":43,"http.request.body.data":"{\"user\":\"alice\",\"password\":\"hunter2\",\"n\":1}"}}
LIFECYCLE=static: {"type":"transaction","name":"POST /throw","op":"http.server","source":"url","status":"ok","request":{"method":"POST","url":"http://127.0.0.1:45376/throw","data":"{\"user\":\"alice\",\"password\":\"hunter2\",\"n\":1}","dataLen":43,"hasHeaders":true},"traceData":{"http.request.body.size":43}}
BODIES=off (static): {"type":"event","exception":"route boom","mechanism":"auto.http.deno","handled":false,"request":{"method":"POST","url":"http://127.0.0.1:34439/throw","hasHeaders":true}} and {"type":"transaction","name":"POST /throw",...,"request":{"method":"POST","url":"http://127.0.0.1:34439/throw","hasHeaders":true},"traceData":{"http.request.body.size":43}}
BODIES=off (stream) span: {"name":"http.server POST","bodyAttrs":{"http.request.body.size":43}}
MAXSIZE=none: event request {"method":"POST","url":"http://127.0.0.1:42943/throw","hasHeaders":true} (no data)
MAXSIZE=small BODYSIZE=2000: event request "data":"{\"big\":\"xxx...","dataLen":1000 (ends with "..."), transaction traceData {"http.request.body.size":2010}
BODIES=off MAXSIZE=always: event request "data":"{\"user\":\"alice\",\"password\":\"hunter2\",\"n\":1}","dataLen":43
built types build/esm/integrations/deno-serve.d.ts: maxRequestBodySize?: MaxRequestBodySize; "An explicit value overrides `dataCollection.httpBodies`" "@default 'medium'"; denoServeIntegration: (options?: DenoServeIntegrationOptions | undefined) => Integration
```

Recorded side notes to expect as well:

1. In the default stream lifecycle the full raw body is written to `http.request.body.data` on
   every non-GET `http.server` span, including the successful `/ok` request whose body carries
   a `password` field. In static lifecycle the transaction's trace data only carries
   `http.request.body.size`; the body sits in `request.data`.
2. The transaction for the throwing route has `status: "ok"` even though the handler threw and
   the client got 500.
3. Whenever body capture actually reads the body, Deno 2.9.0 prints
   `Deno.serve: request.signal aborts on successful responses (legacy behavior, see denoland/deno#29111)`
   to stderr. The warning is absent when capture is disabled.

## Observed on 2026-09-07

All seven variants ran on deno 2.9.0 / node v26.5.0 against the develop tarballs. Verbatim,
trimmed from `result-<label>.json`:

```
default (stream): {"type": "event", "exception": "route boom", "mechanism": "auto.http.deno", "handled": false, "request": {"method": "POST", "url": "http://127.0.0.1:45751/throw", "data": "{\"user\":\"alice\",\"password\":\"hunter2\",\"n\":1}", "dataLen": 43, "hasHeaders": true}}
default (stream) span: {"name": "http.server POST", "bodyAttrs": {"http.request.body.size": 43, "http.request.body.data": "{\"user\":\"alice\",\"password\":\"hunter2\",\"n\":1}"}}
LIFECYCLE=static: {"type": "transaction", "name": "POST /throw", "op": "http.server", "source": "url", "status": "ok", "request": {"method": "POST", "url": "http://127.0.0.1:48698/throw", "data": "{\"user\":\"alice\",\"password\":\"hunter2\",\"n\":1}", "dataLen": 43, "hasHeaders": true}, "traceData": {"http.request.body.size": 43}}
BODIES=off (static): {"type": "event", "exception": "route boom", "mechanism": "auto.http.deno", "handled": false, "request": {"method": "POST", "url": "http://127.0.0.1:54670/throw", "hasHeaders": true}}
BODIES=off (static): {"type": "transaction", "name": "POST /throw", "op": "http.server", "source": "url", "status": "ok", "request": {"method": "POST", "url": "http://127.0.0.1:54670/throw", "hasHeaders": true}, "traceData": {"http.request.body.size": 43}}
BODIES=off (stream) span: {"name": "http.server POST", "bodyAttrs": {"http.request.body.size": 43}}
MAXSIZE=none: {"type": "event", "exception": "route boom", "mechanism": "auto.http.deno", "handled": false, "request": {"method": "POST", "url": "http://127.0.0.1:55998/throw", "hasHeaders": true}}
MAXSIZE=small BODYSIZE=2000: {"type": "event", "exception": "route boom", ..., "request": {"method": "POST", "url": "http://127.0.0.1:53969/throw", "data": "{\"big\":\"xxxx...xxxx...", "dataLen": 1000, "hasHeaders": true}}
MAXSIZE=small BODYSIZE=2000: {"type": "transaction", "name": "POST /throw", ..., "traceData": {"http.request.body.size": 2010}}
BODIES=off MAXSIZE=always: {"type": "event", "exception": "route boom", "mechanism": "auto.http.deno", "handled": false, "request": {"method": "POST", "url": "http://127.0.0.1:49799/throw", "data": "{\"user\":\"alice\",\"password\":\"hunter2\",\"n\":1}", "dataLen": 43, "hasHeaders": true}}
```

`drive-maxsize-small.log` reports `body bytes: 2010`, and the truncated `data` string is exactly
1000 characters ending in `...`.

Built types, verbatim from `node_modules/@sentry/deno/build/esm/integrations/deno-serve.d.ts`:

```
import type { MaxRequestBodySize } from '@sentry/core';
export type DenoServeIntegrationOptions = {
    /**
     * Controls the maximum size of incoming HTTP request bodies attached to events.
     * An explicit value overrides `dataCollection.httpBodies`.
     *
     * If `dataCollection.httpBodies` excludes `'incomingRequest'`, body capture defaults to `'none'`.
     *
     * @default 'medium'
     */
    maxRequestBodySize?: MaxRequestBodySize;
```

Side notes 1 to 3 all reproduced:

1. `result-default.json` contains two `http.server POST` spans, one for `/ok` and one for
   `/throw`, and both carry `http.request.body.data` with the `password` field.
2. `POST /throw` has `"status": "ok"` in every static-lifecycle result while
   `drive-<label>.log` records `/throw -> 500`.
3. `grep -c 'request.signal aborts'` over the app logs: `default` 1, `static` 1, `bodies-off` 0,
   `bodies-off-stream` 0, `maxsize-none` 0, `maxsize-small` 1, `override` 1 — the warning appears
   exactly in the runs where the SDK reads the body.

**Match: yes.** Every recorded evidence line reproduces, field for field, with only the random
ports differing. Verdict stands at `works`.

### Note on the files in this directory

An earlier interrupted rebuild left result, app, sink and drive files whose names contain the
env-var arguments (for example `result-bodies-off LIFECYCLE=static BODIES=off.json`). Those runs
all executed the default configuration, so their contents are not evidence for their labels.
They are stale and were left in place rather than renamed or deleted; the current evidence is in
the space-free `result-<label>.json`, `app-<label>.log` and `drive-<label>.log` files.
