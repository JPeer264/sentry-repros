# D12 - Oak framework on Deno

Runtime: Deno 2.9.0 | SDK: `@sentry/deno` 10.67.0 (develop line, tarballs in `_toolbox/pack/`) |
Framework: `jsr:@oak/oak@17.2.0`

## What it reproduces

An Oak application (`/user/:id`, `/error` which throws, `/sentinel` which captures a message) is
served on Deno in six layouts, crossing three axes: where `Sentry.init` lives (a separate
`instrument.ts` imported before Oak, versus inline in the same module as the `@oak/oak` import),
whether the `@sentry/deno/import` hook is active, and whether the app registers
`app.addEventListener("error", evt => Sentry.captureException(evt.error))`. A seventh app
(`main-active.ts`) answers `GET /active` with what the route handler sees:
`Sentry.getActiveSpan()`'s trace id and the isolation scope's propagation trace id. The probe asks
three things: does Oak get request spans at all, does the thrown route error reach Sentry, and is
anything captured inside a route linked to that request's trace.

## Install

From this directory:

```
npm install --no-audit --no-fund \
  ../../_toolbox/pack/sentry-deno-10.67.0.tgz \
  ../../_toolbox/pack/sentry-core-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  "path-to-regexp@^6.3.0"
```

`deno.json` sets `nodeModulesDir: "manual"`, so Deno uses exactly this `node_modules`. `@oak/oak`
itself is a jsr package and is fetched into the Deno cache on first run (needs network);
`path-to-regexp` is Oak's one npm dependency and has to be present in `node_modules` for a manual
`nodeModulesDir`.

## Run

From this directory (ports are free-choice; check they are unused first):

```
PORT=47821 node sink.mjs > sink.log 2>&1 & spid=$!
./run.sh main-hook.ts    0 47822 47821 d12-hook-el0
./run.sh main-hook.ts    1 47823 47821 d12-hook-el1
./run.sh main-nohook.ts  0 47824 47821 d12-nohook-el0
./run.sh main-nohook.ts  1 47825 47821 d12-nohook-el1
./run.sh oak-hook.ts     0 47826 47821 d12-hoisted-hook-el0
./run.sh oak-nohook.ts   1 47827 47821 d12-hoisted-nohook-el1
./run-active.sh 47828 47821 d12-active
kill $spid; wait $spid
```

`run.sh <entry> <0|1 error listener> <app port> <sink port> <label>` starts the app with

```
APP_PORT=<app port> SINK_PORT=<sink port> OAK_ERROR_LISTENER=<0|1> \
  deno run --no-lock --no-prompt --allow-net --allow-env --allow-read --allow-sys <entry>
```

waits for it to answer, waits 2 s so the readiness request's span envelope flushes before the sink
is cleared, runs `node drive.mjs <app port> <sink port> > <label>.items.json` (GET `/user/42`,
`/error`, `/sentinel`; waits for the sentinel event plus 2.5 s for the 500 ms span-stream flush),
renders it with `node verify.mjs <label>.items.json`, and kills the app. `sink.mjs` is
`_toolbox/sink.mjs` with the span mapping extended to keep each span's `op`, `status`, `trace_id`,
`http.response.status_code`, `url.full`, `http.route`, `sentry.source` and `sentry.origin`.

## Expected

Recorded verdict: **partial**.

`Deno.serve` request spans appear for Oak as streamed `span` envelopes named by method only
(`http.server GET`, `url.full` carries the raw path, `/error` gets `status=error http.status=500`),
but ONLY when `Sentry.init` runs in a separate module imported before Oak: Oak's
`http_server_native.ts` binds `globalThis.Deno.serve` at module-evaluation time, so with
`Sentry.init` in the same file as `import { Application } from "@oak/oak"` (imports hoisted) no
request spans are produced at all. The thrown route error is never captured by the SDK on its own
(Oak catches it, answers 500 and logs `[uncaught application error]`);
`app.addEventListener("error", evt => Sentry.captureException(evt.error))` is required and then
yields an event, but that event is not linked to the request trace (its trace_id equals the global
isolation-scope trace, not the request span's), because Oak runs middleware outside the wrapped
handler's async context: `Sentry.getActiveSpan()` inside a route handler is null and the isolation
scope is shared across requests. The `@sentry/deno/import` hook makes no difference (Oak is a jsr
package, not under `node_modules`).

Recorded evidence lines:

```
instrument-first, listener off (d2-hook-el0):
event: sentinel sentinel mechanism "generic" handled true trace ff1506de3acb4a6ea1406cda3a39f273 ... sentry.javascript.deno@10.67.0
span: ["http.server GET | status=ok trace=1ad93502a1754b66ba00976b4c329154 http.status=200 url=http://127.0.0.1:41341/user/42 route=undefined source=undefined origin=auto.http.deno"]
span: ["http.server GET | status=error trace=5b3bd1b4e1b64eaf80d30920583740e4 http.status=500 url=http://127.0.0.1:41341/error route=undefined ..."]
span: ["http.server GET | status=ok ... url=http://127.0.0.1:41341/sentinel ..."]
(no error event)

instrument-first, listener on (d2-hook-el1):
event:  oak route boom mechanism "generic" handled true trace c4b688c68d4c4672a7c9eb77b55f8bfc transaction undefined request_url undefined
event: sentinel ... trace c4b688c68d4c4672a7c9eb77b55f8bfc
span: ["http.server GET | status=error trace=e0dc381dc5364017a0c6af321bc0b455 http.status=500 url=http://127.0.0.1:41342/error ..."]

no-hook variants (d2-nohook-el0/el1): identical output.

hoisted init in same module as Oak import:
(d2-hoisted-hook-el0): only `event: sentinel ...`, zero span items
(d2-hoisted-nohook-el1): `event:  oak route boom ...`, `event: sentinel ...`, zero span items

active-span probe:
GET /active -> {"activeSpan":null,"isolationTrace":"2fe1883b74654d5b832cc813bfa055d0"} twice (same
isolation trace both requests) while the sink got
span: ["http.server GET | status=ok trace=b12699a3c0ed4b4388e2554bf549dad3 ... url=http://127.0.0.1:41361/active ..."]
and trace=f3300e30e33c40e9b3be2d2027434fb2.

app log for /error in every run:
[uncaught application error]: Error - oak route boom
response: { status: 500, type: "text", hasBody: true, writable: true }
```

## Observed on 2026-09-07

Matches the recorded verdict (**partial**), on the first run, in every one of the seven runs.
Verbatim trimmed output (`verify-*.txt`, `drive-d12-active.log`, `app-d12-hook-el0.log`):

```
instrument-first, listener off (verify-d12-hook-el0.txt):
event: sentinel sentinel mechanism "generic" handled true trace c7ce7c6f163043abbff0aced84ecb95d transaction undefined request_url undefined
span: ["http.server GET | status=ok trace=aeb5dcb426f14c589b0328b40aaa3c36 http.status=200 url=http://127.0.0.1:47822/user/42 route=undefined source=undefined origin=auto.http.deno"]
span: ["http.server GET | status=error trace=ddac10db068240aeacadc414b81583a6 http.status=500 url=http://127.0.0.1:47822/error route=undefined source=undefined origin=auto.http.deno"]
span: ["http.server GET | status=ok trace=a9c818d3c6be43ddae36e0cc8f35b652 http.status=200 url=http://127.0.0.1:47822/sentinel route=undefined source=undefined origin=auto.http.deno"]
summary: events=1 errorEvents=0 spanItems=3

instrument-first, listener on (verify-d12-hook-el1.txt):
event:  Error: oak route boom mechanism "generic" handled true trace 0a6f68909edd442ba5c22e7ca687b049 transaction undefined request_url undefined
event: sentinel sentinel mechanism "generic" handled true trace 0a6f68909edd442ba5c22e7ca687b049 transaction undefined request_url undefined
span: ["http.server GET | status=ok trace=16fba34d18ce4aaaa6d7d6e675199b77 http.status=200 url=http://127.0.0.1:47823/user/42 route=undefined source=undefined origin=auto.http.deno"]
span: ["http.server GET | status=error trace=75198f1295de43789c7f0570e542a082 http.status=500 url=http://127.0.0.1:47823/error route=undefined source=undefined origin=auto.http.deno"]
span: ["http.server GET | status=ok trace=2449d68b25014ce696abbcfbd7e0858f http.status=200 url=http://127.0.0.1:47823/sentinel route=undefined source=undefined origin=auto.http.deno"]
summary: events=2 errorEvents=1 spanItems=3

no hook, listener off (verify-d12-nohook-el0.txt):
event: sentinel sentinel mechanism "generic" handled true trace d28ee7128be34c17917aa0b319a079cd transaction undefined request_url undefined
span: ["http.server GET | status=ok trace=a18aa05f64be461c8af066c50f3bae6f http.status=200 url=http://127.0.0.1:47824/user/42 route=undefined source=undefined origin=auto.http.deno"]
span: ["http.server GET | status=error trace=fec7ac01f0894d92b62ebee007321077 http.status=500 url=http://127.0.0.1:47824/error route=undefined source=undefined origin=auto.http.deno"]
span: ["http.server GET | status=ok trace=8164b7e8f7564262bbed8df6243a3071 http.status=200 url=http://127.0.0.1:47824/sentinel route=undefined source=undefined origin=auto.http.deno"]
summary: events=1 errorEvents=0 spanItems=3

no hook, listener on (verify-d12-nohook-el1.txt):
event:  Error: oak route boom mechanism "generic" handled true trace d99121f6fbf849aea9584ef44e957d40 transaction undefined request_url undefined
event: sentinel sentinel mechanism "generic" handled true trace d99121f6fbf849aea9584ef44e957d40 transaction undefined request_url undefined
span: ["http.server GET | status=ok trace=a6744ce535cb4c84b3578b0ecb49c26c http.status=200 url=http://127.0.0.1:47825/user/42 route=undefined source=undefined origin=auto.http.deno"]
span: ["http.server GET | status=error trace=664f32df7b594e7f8af945dc4fffa420 http.status=500 url=http://127.0.0.1:47825/error route=undefined source=undefined origin=auto.http.deno"]
span: ["http.server GET | status=ok trace=f7e50f25d23146b892fb1fda95cc35f2 http.status=200 url=http://127.0.0.1:47825/sentinel route=undefined source=undefined origin=auto.http.deno"]
summary: events=2 errorEvents=1 spanItems=3

hoisted init, hook, listener off (verify-d12-hoisted-hook-el0.txt):
event: sentinel sentinel mechanism "generic" handled true trace 8b59fe214ea34a03bb15ff1195f2d9f2 transaction undefined request_url undefined
summary: events=1 errorEvents=0 spanItems=0

hoisted init, no hook, listener on (verify-d12-hoisted-nohook-el1.txt):
event:  Error: oak route boom mechanism "generic" handled true trace 8f9e1e0a332f4b9fa8a917c28c4ddefb transaction undefined request_url undefined
event: sentinel sentinel mechanism "generic" handled true trace 8f9e1e0a332f4b9fa8a917c28c4ddefb transaction undefined request_url undefined
summary: events=2 errorEvents=1 spanItems=0

active-span probe (drive-d12-active.log, verify-d12-active.txt):
GET /active -> {"activeSpan":null,"isolationTrace":"4f7518fb1a6549cba393a38939a52e87"}
GET /active -> {"activeSpan":null,"isolationTrace":"4f7518fb1a6549cba393a38939a52e87"}
span: ["http.server GET | status=ok trace=697c36e5152c4964b0df0d8d3866e719 http.status=200 url=http://127.0.0.1:47828/active route=undefined source=undefined origin=auto.http.deno"]
span: ["http.server GET | status=ok trace=516394746e7446998b9ec1c2cd59ac9b http.status=200 url=http://127.0.0.1:47828/active route=undefined source=undefined origin=auto.http.deno"]

app log for /error in every run (app-d12-hook-el0.log):
[uncaught application error]: Error - oak route boom

request: { url: "http://127.0.0.1:47822/error", method: "GET", hasBody: false }
response: { status: 500, type: "text", hasBody: true, writable: true }
    at file://$REPRO/probes/D12/app.ts:15:11
    at dispatch (https://jsr.io/@oak/oak/17.2.0/middleware.ts:90:13)
    at Application.#handleRequest (https://jsr.io/@oak/oak/17.2.0/application.ts:605:32)
```

Every recorded claim holds. Request spans exist only in the four instrument-first layouts, named
`GET` with `origin=auto.http.deno`, no `http.route` and no `sentry.source`, `url.full` carrying the
raw path, and `/error` at `status=error http.status=500`. Both hoisted layouts produce zero span
items while still delivering events, which is the module-evaluation-order finding. Without the error
listener no error event is produced at all; with it the event arrives but its trace id
(`0a6f68909edd442ba5c22e7ca687b049`, `d99121f6fbf849aea9584ef44e957d40`) equals the sentinel's and
matches none of the three request span trace ids in the same run, i.e. the capture is not linked to
the request trace. The active probe shows `activeSpan: null` in the route and the same
`isolationTrace` for both requests while the sink recorded two distinct request span traces. The
`@sentry/deno/import` hook changes nothing: the `nohook` runs are identical to the `hook` runs.

Differences from the record are cosmetic. Ports are 47821-47828 instead of 41238/41341-41346/41361.
The run labels are `d12-*` instead of `d2-*`. The rebuilt `run.sh` sleeps 2 s after the readiness
request so its span envelope is flushed before `drive.mjs` clears the sink (a run without that sleep
otherwise carries an extra `url=.../user/1` span). The SDK is installed from the `_toolbox/pack`
tarballs plus `path-to-regexp` from npm, instead of symlinking the worktree packages, which removes
the record's `deno add` / lockfile problem; `--no-lock` is kept anyway. `Sentry.init` here omits
`sendDefaultPii`, which `DenoOptions` does not declare and which `deno check` rejects; it does not
affect any of the assertions above. The record renders the captured error as `oak route boom`, the
rebuilt `verify.mjs` renders the same event as `Error: oak route boom` because it prints the
exception type together with its value.

## Files

- `instrument.ts` - `Sentry.init`, imported before Oak in the instrument-first layouts
- `app.ts` - the Oak app (`/user/:id`, `/error`, `/sentinel`), error listener behind `OAK_ERROR_LISTENER`
- `main-hook.ts`, `main-nohook.ts` - instrument-first entries, with and without `@sentry/deno/import`
- `oak-hook.ts`, `oak-nohook.ts` - single-file entries where `Sentry.init` sits after the hoisted Oak import
- `app-active.ts`, `main-active.ts` - the `GET /active` probe for active span and isolation scope
- `deno.json` - `nodeModulesDir: "manual"`, `@oak/oak` mapped to `jsr:@oak/oak@^17.2.0`
- `sink.mjs` - envelope sink, span mapping extended for op, status, trace id, http status, url, route, source, origin
- `drive.mjs`, `drive-active.mjs` - request drivers with the sentinel wait and sink dump
- `verify.mjs` - renders the evidence lines and the summary
- `run.sh`, `run-active.sh` - start one app, drive it, verify, kill it
- `d12-*.items.json` - sink dumps of the runs above
- `verify-d12-*.txt` - the rendered evidence above
- `app-d12-*.log`, `drive-d12-*.log`, `sink.log` - process output
