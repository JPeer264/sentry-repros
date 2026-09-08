# D02 — Enrichment on Deno events

Runtime: **deno 2.9.0** · SDK: `@sentry/deno@10.67.0` (develop / v11 line, tarballs from `_toolbox/pack`)

## What it reproduces

How much of the scope a Deno app sets actually lands on an event, and how the Deno permission set
changes that. `main.ts` (hook entry, first line `import '@sentry/deno/import'`) and `main-nohook.ts`
(identical minus that line) both set a user, two tags, an extra, a custom context, add a manual
breadcrumb, emit a `console.log` with an object argument and a `console.warn`, do an outgoing
`fetch` to the sink's `/__target` route, then throw from `innerThrow()` and `captureException` it,
followed by a `captureMessage('sentinel')` and `flush(5000)`. Running the same file under
`--allow-net --allow-env --allow-read --allow-sys` versus `--allow-net` alone isolates exactly which
enrichment needs which permission, and running the hook entry under `--allow-net` alone shows that
the documented hook import aborts the process before `Sentry.init` ever runs. `sink.mjs` is
`$S/qs/sink.mjs` plus a `/__target` endpoint that records the incoming `sentry-trace` header and a
`/__items?raw` route that returns whole envelope payloads; `show.py` prints the enrichment fields
out of those raw payloads.

## Install

```
cd $REPRO/probes/D02
P=$REPRO/_toolbox/pack
npm install --no-audit --no-fund $P/sentry-deno-10.67.0.tgz $P/sentry-core-10.67.0.tgz \
  $P/sentry-server-utils-10.67.0.tgz $P/sentry-server-runtime-injection-10.67.0.tgz
```

`deno.json` sets `nodeModulesDir: "manual"`, so Deno uses the `node_modules` npm just wrote.

## Run

```
cd $REPRO/probes/D02
PORT=41207 node sink.mjs > sink.log 2>&1 & sp=$!

./run.sh 41207 hook-all       main.ts        --allow-net --allow-env --allow-read --allow-sys
./run.sh 41207 hook-netonly   main.ts        --allow-net
./run.sh 41207 nohook-all     main-nohook.ts --allow-net --allow-env --allow-read --allow-sys
./run.sh 41207 nohook-netonly main-nohook.ts --allow-net
./run.sh 41207 hook-net-env   main.ts        --allow-net --allow-env

python3 show.py raw-hook-all.json raw-nohook-netonly.json raw-hook-net-env.json raw-nohook-all.json
cat app-hook-netonly.log

kill $sp; wait $sp
```

`run.sh` clears the sink, runs `deno run --no-prompt <flags> <entry> <port> <label>` into
`app-<label>.log`, polls `/__items` until the `sentinel` event is there, and saves
`items-<label>.json`, `raw-<label>.json` and `target-<label>.json`. Pick a different free port if
41207 is taken.

## Expected

Recorded verdict: **partial**.

With all four permissions every enrichment lands: user, tags, extra, custom context, manual +
console + fetch breadcrumbs, `app://` filenames with `context_line` (5 lines pre/post),
`contexts.runtime`/`os` (with version)/`v8`/`typescript`/`app`/`device`, `server_name`. With
`--allow-net` only the SDK still sends the event but drops `server_name`, `os.version`, `app://`
normalisation and context lines. However the documented hook entry `import "@sentry/deno/import"`
crashes the process at startup under `--allow-net` only (`NotCapable: Requires env access` from the
`debug` package's `Object.keys(process.env)`), so no event is sent at all; adding `--allow-env` is
required for the hook. Sentinel arrived in the sink before the exception event (contextlines is
async), so sentinel ordering does not hold on Deno.

Recorded evidence lines:

```
[hook, --allow-net --allow-env --allow-read --allow-sys]
sdk: sentry.javascript.deno 10.67.0 | platform: javascript | server_name: DJ90J9R5XC.local | release: d02@1.0.0 | env: probe
user: {"id": "u-42", "email": "u42@example.com", "username": "u42"}
tags: {"probe": "D02", "run": "hook-all"}
extra: {"probe_extra": {"list": [1, 2, 3]}}
contexts.app: {"app_start_time": "2026-09-04T09:03:36.261Z"}
contexts.device: {"arch": "aarch64", "processor_count": 16}
contexts.os: {"name": "macOS", "version": "24.6.0"}
contexts.v8: {"name": "v8", "version": "14.9.207.2-rusty"}
contexts.typescript: {"name": "TypeScript", "version": "6.0.3"}
contexts.probe_ctx: {"label": "hook-all", "answer": 42}
contexts.runtime: {"name": "deno", "version": "2.9.0"}
breadcrumb: {"category": "manual", "level": "info", "message": "manual breadcrumb", "data": {"step": 1}}
breadcrumb: {"category": "console", "level": "log", "message": "console log breadcrumb [object Object]", "data": {"arguments": ["console log breadcrumb", {"n": 1}], "logger": "console"}}
breadcrumb: {"category": "console", "level": "warning", "message": "console warn breadcrumb", "data": {"arguments": ["console warn breadcrumb"], "logger": "console"}}
breadcrumb: {"type": "http", "category": "fetch", "data": {"method": "GET", "url": "http://127.0.0.1:44341/__target", "status_code": 200}}
frame: {"filename": "app:///main.ts", "function": "innerThrow", "lineno": 28, "colno": 9, "in_app": true, "context_line": "  throw new Error(`D02 boom ${label}`);", "pre": 5, "post": 5}

[hook, --allow-net only] deno exit=1, items: []
error: Uncaught (in promise) NotCapable: Requires env access, run again with the --allow-env flag
exports.inspectOpts = Object.keys(process.env).filter(key => {
    at file://$SDK/node_modules/debug/src/node.js:124:30

[no hook, --allow-net only] deno exit=0, items: ['event:sentinel', 'event:D02 boom nohook-netonly']
server_name: None
contexts.os: {"name": "macOS"}
frame: {"filename": ".../deep/D02/develop/main-nohook.ts", "function": "innerThrow", "lineno": 27, "colno": 9, "in_app": true}
(user, tags, extra, probe_ctx, runtime, v8, typescript, app, device, all 5 breadcrumbs identical to the all-permissions run)

[hook, --allow-net --allow-env] deno exit=0, same event as no-hook net-only (server_name: None, os without version, absolute filenames, no context_line)
```

Recorded side notes: there is no `contexts.deno` key; the console breadcrumb message stringifies
object arguments as `[object Object]` while `data.arguments` keeps them intact; the `/__target`
request carried no `sentry-trace` header (known K2); the sentinel event reached the sink before the
exception event in every run.

## Observed on 2026-09-07

Matches the recorded verdict (**partial**).

Run order (`run.sh` output):

```
deno exit=0 label=hook-all
items: [('event', 'sentinel'), ('event', 'Error: D02 boom hook-all')]
deno exit=1 label=hook-netonly
items: []
deno exit=0 label=nohook-all
items: [('event', 'sentinel'), ('event', 'Error: D02 boom nohook-all')]
deno exit=0 label=nohook-netonly
items: [('event', 'sentinel'), ('event', 'Error: D02 boom nohook-netonly')]
deno exit=0 label=hook-net-env
items: [('event', 'sentinel'), ('event', 'Error: D02 boom hook-net-env')]
```

`python3 show.py raw-hook-all.json` (hook, all four permissions):

```
sdk: sentry.javascript.deno 10.67.0 | platform: javascript | server_name: DJ90J9R5XC.local | release: d02@1.0.0 | env: probe
user: {"id": "u-42", "email": "u42@example.com", "username": "u42"}
tags: {"probe": "D02", "run": "hook-all"}
extra: {"probe_extra": {"list": [1, 2, 3]}}
contexts.app: {"app_start_time": "2026-09-07T09:03:09.853Z"}
contexts.device: {"arch": "aarch64", "processor_count": 16}
contexts.os: {"name": "macOS", "version": "24.6.0"}
contexts.v8: {"name": "v8", "version": "14.9.207.2-rusty"}
contexts.typescript: {"name": "TypeScript", "version": "6.0.3"}
contexts.probe_ctx: {"label": "hook-all", "answer": 42}
contexts.runtime: {"name": "deno", "version": "2.9.0"}
breadcrumb: {"category": "manual", "level": "info", "message": "manual breadcrumb", "data": {"step": 1}}
breadcrumb: {"category": "console", "data": {"arguments": ["console log breadcrumb", {"n": 1}], "logger": "console"}, "level": "log", "message": "console log breadcrumb [object Object]"}
breadcrumb: {"category": "console", "data": {"arguments": ["console warn breadcrumb"], "logger": "console"}, "level": "warning", "message": "console warn breadcrumb"}
breadcrumb: {"category": "fetch", "data": {"method": "GET", "url": "http://127.0.0.1:41207/__target", "status_code": 200}, "type": "http"}
frame: {"filename": "app:///main.ts", "function": "innerThrow", "lineno": 28, "colno": 9, "in_app": true, "context_line": "  throw new Error(`D02 boom ${label}`);", "pre": 5, "post": 5}
```

`python3 show.py raw-nohook-netonly.json` (no hook, `--allow-net` only):

```
sdk: sentry.javascript.deno 10.67.0 | platform: javascript | server_name: None | release: d02@1.0.0 | env: probe
user: {"id": "u-42", "email": "u42@example.com", "username": "u42"}
tags: {"probe": "D02", "run": "nohook-netonly"}
extra: {"probe_extra": {"list": [1, 2, 3]}}
contexts.app: {"app_start_time": "2026-09-07T09:03:23.002Z"}
contexts.device: {"arch": "aarch64", "processor_count": 16}
contexts.os: {"name": "macOS"}
contexts.v8: {"name": "v8", "version": "14.9.207.2-rusty"}
contexts.typescript: {"name": "TypeScript", "version": "6.0.3"}
contexts.probe_ctx: {"label": "nohook-netonly", "answer": 42}
contexts.runtime: {"name": "deno", "version": "2.9.0"}
breadcrumb: {"category": "manual", "level": "info", "message": "manual breadcrumb", "data": {"step": 1}}
breadcrumb: {"category": "console", "data": {"arguments": ["console log breadcrumb", {"n": 1}], "logger": "console"}, "level": "log", "message": "console log breadcrumb [object Object]"}
breadcrumb: {"category": "console", "data": {"arguments": ["console warn breadcrumb"], "logger": "console"}, "level": "warning", "message": "console warn breadcrumb"}
breadcrumb: {"category": "fetch", "data": {"method": "GET", "url": "http://127.0.0.1:41207/__target", "status_code": 200}, "type": "http"}
frame: {"filename": "$REPRO/probes/D02/main-nohook.ts", "function": "innerThrow", "lineno": 27, "colno": 9, "in_app": true, "context_line": null, "pre": 0, "post": 0}
```

`cat app-hook-netonly.log` (hook, `--allow-net` only, deno exit=1, sink items `[]`):

```
error: Uncaught (in promise) NotCapable: Requires env access, run again with the --allow-env flag
Warning Couldn't format source line: Column 30 is out of bounds (source may have changed at runtime)
    at Object.toObject (ext:deno_os/30_os.js:133:12)
    at Object.ownKeys (ext:deno_node/_process/process.ts:83:42)
    at Object.keys (<anonymous>)
    at file://$REPRO/probes/D02/node_modules/@sentry/server-runtime-injection/build/esm/vendored/debug/src/node.js:124:30
    at file://$REPRO/probes/D02/node_modules/@sentry/server-runtime-injection/build/esm/vendored/debug/src/node.js:263:1
```

`hook-net-env` produced exactly the no-hook net-only shape (`server_name: None`, `contexts.os:
{"name": "macOS"}`, `filename: $REPRO/probes/D02/main.ts`,
`context_line: null`), and `nohook-all` produced exactly the all-permissions shape
(`server_name: DJ90J9R5XC.local`, `contexts.os` with `version: 24.6.0`,
`filename: app:///main-nohook.ts`, `context_line` with 5 lines pre/post). The side notes hold too:
no `contexts.deno` key anywhere; the console breadcrumb message is
`console log breadcrumb [object Object]` with the object intact in `data.arguments`;
`target-hook-all.json` is `[{"url":"/__target","st":null,"baggage":null}]`, so the outgoing fetch
carried no `sentry-trace` header; and the `sentinel` event arrived before the exception event in all
four runs that sent anything.

### Difference from the record

Only the path in the crash stack. The record ran against worktree symlinks, so Deno's source-mapped
frame pointed at
`file://$SDK/node_modules/debug/src/node.js:124:30`.
This rebuild installs the tarballs, so the same frame is
`node_modules/@sentry/server-runtime-injection/build/esm/vendored/debug/src/node.js:124:30` — the
same vendored copy of `debug`, the same line 124 column 30, the same `Object.keys(process.env)`, the
same `NotCapable` abort before `Sentry.init` runs. Nothing about the finding changes.
