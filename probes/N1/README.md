# N1 - Deno with only the permissions the docs prescribe

Runtime: deno 2.9.0 | SDK: `@sentry/deno` 10.67.0 (develop line, tarballs in `_toolbox/pack/`)

## What it reproduces

A docs-shaped Deno server (`main-nh.ts`: `import * as Sentry from "@sentry/deno"`, `Sentry.init`,
`Deno.serve`) throws a three-frame-deep error from `src/boom.ts` inside the request handler, and the
same app is run five times under increasing permission flag sets, starting from the exact set the
Sentry Deno docs prescribe (`--allow-net=<host>`, then `--allow-read=./src`, then `--allow-env`).
An extended envelope sink keeps `server_name`, `contexts.*`, `release`, `environment` and the
per-frame `filename` / `context_line` / `pre_context`, so it is visible which event fields the
documented flags silently drop. Three more entries cover the edges: `main.ts` is the same app with
the repo's recommended `import "@sentry/deno/import"` first line, `main-wronghost.ts` points the
tunnel at `localhost` while the flag allows only `127.0.0.1`, and `main-deploy2.ts` simulates Deno
Deploy by proxying `Deno.permissions` so that `querySync` is absent while `query` still routes
through the same object.

## Install

From this directory:

```
npm install --no-audit --no-fund \
  ../../_toolbox/pack/sentry-deno-10.67.0.tgz \
  ../../_toolbox/pack/sentry-core-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz
```

`deno.json` sets `nodeModulesDir: "manual"`, so Deno uses that `node_modules` as-is.

## Run

From this directory. Ports 52847 (sink) and 52848 (app) are the defaults baked into `run3.sh`;
check they are free first (`lsof -nP -iTCP:52847 -iTCP:52848`) and override with
`SINK_PORT=`/`APP_PORT=` if not.

```
PORT=52847 node sink.mjs > sink.log 2>&1 & spid=$!
sleep 1

# with the `import "@sentry/deno/import"` hook (main.ts):
./run2.sh . dev-a  --allow-net=127.0.0.1
./run2.sh . dev-b  --no-prompt --allow-net=127.0.0.1 --allow-read=./src

# docs-shaped, no hook (main-nh.ts):
./run3.sh . dev-nh-a  main-nh.ts --allow-net=127.0.0.1
./run3.sh . dev-nh-b  main-nh.ts --no-prompt --allow-net=127.0.0.1 --allow-read=./src
./run3.sh . dev-nh-c  main-nh.ts --no-prompt --allow-net=127.0.0.1 --allow-read=./src --allow-env
./run3.sh . dev-nh-cs main-nh.ts --no-prompt --allow-net=127.0.0.1 --allow-read=./src --allow-env --allow-sys
./run3.sh . dev-nh-d  main-nh.ts --no-prompt --allow-net --allow-env --allow-read --allow-sys
./run3.sh . dev-wronghost main-wronghost.ts --allow-net=127.0.0.1
./run3.sh . dev-deploy2   main-deploy2.ts --no-prompt --allow-net --allow-env --allow-read --allow-sys

python3 analyze.py dev-nh-a dev-nh-b dev-nh-c dev-nh-cs dev-nh-d
sed 's/\x1b\[[0-9;]*m//g' out2/dev-a/app.log
sed 's/\x1b\[[0-9;]*m//g' out2/dev-wronghost/app.log

kill $spid; wait $spid
```

`run3.sh` clears the sink, starts one `deno run` with the given flags and `< /dev/null`, waits for
its `LISTENING <port>` line, drives it from a separate `curl` process (`GET /boom`, then
`GET /sentinel`), polls `/__items` until the sentinel envelope has arrived, and writes
`out2/<label>/{app.log,items.json}`. `run2.sh` is the same runner pinned to `main.ts`. `sink.mjs` is
`_toolbox/sink.mjs` with the event mapping extended to keep `server_name`, `contexts.os`,
`contexts.runtime`, `contexts.device`, `contexts.app` and every frame's filename, line, `in_app`,
context-line presence and pre-context count, plus the release/environment/os attributes on span
envelopes.

## Expected

Recorded verdict: **partial**.

The documented flags never prompt and never crash the plain (docs-shaped) app, but they silently
degrade four things: with `--allow-net=127.0.0.1` alone the event still arrives with
exception/mechanism/release/environment/contexts.runtime/contexts.device intact, while `server_name`
is null, `contexts.os.version` is absent, and NO frame has `context_line`/`pre_context`. Adding
`--allow-read=./src` restores context lines only for files under `./src`: the entry `main-nh.ts`
(one directory up) stays context-free. Neither documented flag restores `app:///` path
normalization; frame filenames stay absolute machine paths until read access covers `./`
(`normalizepaths.ts:52` does `Deno.permissions.querySync({name:'read', path:'./'})` and falls back to
a stack-derived root, which yields no rewrite here). `--allow-sys` is the flag that brings back
`server_name` and `os.version`, and the docs never mention it. `--allow-env` changes nothing for the
docs-shaped app, BUT with the repo's recommended `import "@sentry/deno/import"` first line the
process dies at import time without it: `build/esm/vendored/debug/src/node.js` does
`Object.keys(process.env)` at module scope. No permission is ever prompted for; `client.ts:9`,
`context.ts:20`, `contextlines.ts:96` and `normalizepaths.ts:52` all `query` first and drop the field
when the state is not `granted`. The only diagnostic the SDK emits is the transport warning when the
DSN/tunnel host is outside `--allow-net`.

Recorded flag-by-flag table (docs-shaped app, no import hook):

| flag set | event sent | server_name | contexts.os.version | context lines | filenames |
| --- | --- | --- | --- | --- | --- |
| `--allow-net=127.0.0.1` | yes | absent | absent | none | absolute |
| `+ --allow-read=./src` | yes | absent | absent | ./src frames only | absolute |
| `+ --allow-env` | yes | absent | absent | ./src frames only | absolute |
| `+ --allow-sys` | yes | present | present | ./src frames only | absolute |
| `--allow-net --allow-env --allow-read --allow-sys` | yes | present | present | all frames | `app:///...` |

Recorded evidence lines:

```
(a) exact docs line, WITH the `@sentry/deno/import` hook -- out2/dev-a/app.log:
CMD: deno run --allow-net=127.0.0.1 main.ts
error: Uncaught (in promise) NotCapable: Requires env access, run again with the --allow-env flag
exports.inspectOpts = Object.keys(process.env).filter(key => {
    at file:///.../node_modules/debug/src/node.js:124:30
NO_PORT (process exited or never listened)
(b) `--no-prompt --allow-net=127.0.0.1 --allow-read=./src main.ts` -> identical NotCapable env crash.

(a) `--allow-net=127.0.0.1` -- out2/dev-nh-a/items.json:
{"exception": "n1 nested boom", "mechanism": "auto.http.deno", "sdk": "sentry.javascript.deno@10.67.0",
 "server_name": null, "ctx_os": {"name": "macOS"}, "ctx_runtime": {"name": "deno", "version": "2.9.0"},
 "release": "n1-release@1.0.0", "environment": "n1-environment", "hasContextLine": false,
 "boomFrames": [{"filename": ".../main-nh.ts", "hasCtxLine": false, "preCount": 0},
                {"filename": ".../src/boom.ts", "hasCtxLine": false, "preCount": 0}]}
(b) boom.ts frames gain hasCtxLine=true preCount=5, main-nh.ts stays hasCtxLine=false,
    server_name still null, os has no version.
(c) b + `--allow-env` -- byte-identical field set to (b).
(cs) b + `--allow-env --allow-sys`:
{"exception": "n1 nested boom", "server_name": "DJ90J9R5XC.local",
 "ctx_os": {"name": "macOS", "version": "24.6.0"}, "hasContextLine": true,
 ... "filename": ".../src/boom.ts" ...}
(d) full set: same as (cs) PLUS normalized filenames `app:///main-nh.ts`, `app:///src/boom.ts`
    and context lines on the entry file.

Stream spans mirror it, os.version is present only from --allow-sys on:
  span ['http.server GET'] attrs= {"server.address":"127.0.0.1","sentry.release":"n1-release@1.0.0",
        "os.name":"macOS","process.runtime.engine.name":"v8"}                       (dev-nh-a/b/c)
  span ['http.server GET'] attrs= {... "os.name":"macOS", "os.version":"24.6.0"}    (dev-nh-cs/d)

Wrong-host --allow-net -- app serves fine, every envelope dropped, sentinel never arrives:
Sentry SDK requires 'net' permission to send events.
    Run with '--allow-net=localhost:52847' to grant the required permissions.

Deno Deploy proxy (simulated) -- both captured events replaced by an internal error, user error lost:
{"exception": "this.querySync is not a function", "mechanism": "internal", "server_name": null,
 "ctx_os": null, "frameCount": 10
```

## Observed on 2026-09-07

**Matches the recorded verdict.** Every recorded behaviour reproduced, including the flag-by-flag
table, the import-hook crash, the wrong-host transport warning and the Deno Deploy internal error.
The whole sequence below was re-run end to end from a fresh `npm install` of the four tarballs and
produced byte-identical output; `out2/matrix.txt` is that run.

`out2/dev-a/app.log` (`./run2.sh . dev-a --allow-net=127.0.0.1`, ANSI stripped):

```
CMD: deno run --allow-net=127.0.0.1 main.ts
error: Uncaught (in promise) NotCapable: Requires env access, run again with the --allow-env flag
Warning Couldn't format source line: Column 30 is out of bounds (source may have changed at runtime)
    at Object.toObject (ext:deno_os/30_os.js:133:12)
    at Object.ownKeys (ext:deno_node/_process/process.ts:83:42)
    at Object.keys (<anonymous>)
    at file://$REPRO/probes/N1/node_modules/@sentry/server-runtime-injection/build/esm/vendored/debug/src/node.js:124:30
    at file://$REPRO/probes/N1/node_modules/@sentry/server-runtime-injection/build/esm/vendored/debug/src/node.js:263:1
NO_PORT (process exited or never listened)
```

`out2/dev-b/app.log` is the identical `NotCapable` env crash at the same `node.js:124:30`.

`python3 analyze.py dev-nh-a dev-nh-b dev-nh-c dev-nh-cs dev-nh-d` (also in `out2/matrix.txt`,
absolute paths shortened to `.../N1/` here):

```
--- dev-nh-a ---
  {"exception": "Error: n1 nested boom", "mechanism": "auto.http.deno", "sdk": "sentry.javascript.deno", "server_name": null, "ctx_os": {"name": "macOS"}, "ctx_runtime": {"name": "deno", "version": "2.9.0"}, "release": "n1-release@1.0.0", "environment": "n1-environment", "hasContextLine": false, "frameCount": 10, "boomFrames": [{"filename": ".../N1/main-nh.ts", "line": 25, "hasCtxLine": false, "preCount": 0}, {"filename": ".../N1/src/boom.ts", "line": 14, "hasCtxLine": false, "preCount": 0}, {"filename": ".../N1/src/boom.ts", "line": 10, "hasCtxLine": false, "preCount": 0}, {"filename": ".../N1/src/boom.ts", "line": 6, "hasCtxLine": false, "preCount": 0}]}
  span ['http.server GET'] attrs= {"server.address": "127.0.0.1", "sentry.release": "n1-release@1.0.0", "sentry.environment": "n1-environment", "os.name": "macOS", "process.runtime.engine.name": "v8", "device.processor_count": 16}
--- dev-nh-b ---
  {"exception": "Error: n1 nested boom", "mechanism": "auto.http.deno", "sdk": "sentry.javascript.deno", "server_name": null, "ctx_os": {"name": "macOS"}, "ctx_runtime": {"name": "deno", "version": "2.9.0"}, "release": "n1-release@1.0.0", "environment": "n1-environment", "hasContextLine": true, "frameCount": 10, "boomFrames": [{"filename": ".../N1/main-nh.ts", "line": 25, "hasCtxLine": false, "preCount": 0}, {"filename": ".../N1/src/boom.ts", "line": 14, "hasCtxLine": true, "preCount": 5}, {"filename": ".../N1/src/boom.ts", "line": 10, "hasCtxLine": true, "preCount": 5}, {"filename": ".../N1/src/boom.ts", "line": 6, "hasCtxLine": true, "preCount": 5}]}
  span ['http.server GET'] attrs= {"server.address": "127.0.0.1", "sentry.release": "n1-release@1.0.0", "sentry.environment": "n1-environment", "os.name": "macOS", "process.runtime.engine.name": "v8", "device.processor_count": 16}
--- dev-nh-c ---
  {"exception": "Error: n1 nested boom", "mechanism": "auto.http.deno", "sdk": "sentry.javascript.deno", "server_name": null, "ctx_os": {"name": "macOS"}, "ctx_runtime": {"name": "deno", "version": "2.9.0"}, "release": "n1-release@1.0.0", "environment": "n1-environment", "hasContextLine": true, "frameCount": 10, "boomFrames": [{"filename": ".../N1/main-nh.ts", "line": 25, "hasCtxLine": false, "preCount": 0}, {"filename": ".../N1/src/boom.ts", "line": 14, "hasCtxLine": true, "preCount": 5}, {"filename": ".../N1/src/boom.ts", "line": 10, "hasCtxLine": true, "preCount": 5}, {"filename": ".../N1/src/boom.ts", "line": 6, "hasCtxLine": true, "preCount": 5}]}
  span ['http.server GET'] attrs= {"server.address": "127.0.0.1", "sentry.release": "n1-release@1.0.0", "sentry.environment": "n1-environment", "os.name": "macOS", "process.runtime.engine.name": "v8", "device.processor_count": 16}
--- dev-nh-cs ---
  {"exception": "Error: n1 nested boom", "mechanism": "auto.http.deno", "sdk": "sentry.javascript.deno", "server_name": "DJ90J9R5XC.local", "ctx_os": {"name": "macOS", "version": "24.6.0"}, "ctx_runtime": {"name": "deno", "version": "2.9.0"}, "release": "n1-release@1.0.0", "environment": "n1-environment", "hasContextLine": true, "frameCount": 10, "boomFrames": [{"filename": ".../N1/main-nh.ts", "line": 25, "hasCtxLine": false, "preCount": 0}, {"filename": ".../N1/src/boom.ts", "line": 14, "hasCtxLine": true, "preCount": 5}, {"filename": ".../N1/src/boom.ts", "line": 10, "hasCtxLine": true, "preCount": 5}, {"filename": ".../N1/src/boom.ts", "line": 6, "hasCtxLine": true, "preCount": 5}]}
  span ['http.server GET'] attrs= {"server.address": "127.0.0.1", "sentry.release": "n1-release@1.0.0", "sentry.environment": "n1-environment", "os.name": "macOS", "os.version": "24.6.0", "process.runtime.engine.name": "v8", "device.processor_count": 16}
--- dev-nh-d ---
  {"exception": "Error: n1 nested boom", "mechanism": "auto.http.deno", "sdk": "sentry.javascript.deno", "server_name": "DJ90J9R5XC.local", "ctx_os": {"name": "macOS", "version": "24.6.0"}, "ctx_runtime": {"name": "deno", "version": "2.9.0"}, "release": "n1-release@1.0.0", "environment": "n1-environment", "hasContextLine": true, "frameCount": 10, "boomFrames": [{"filename": "app:///main-nh.ts", "line": 25, "hasCtxLine": true, "preCount": 5}, {"filename": "app:///src/boom.ts", "line": 14, "hasCtxLine": true, "preCount": 5}, {"filename": "app:///src/boom.ts", "line": 10, "hasCtxLine": true, "preCount": 5}, {"filename": "app:///src/boom.ts", "line": 6, "hasCtxLine": true, "preCount": 5}]}
  span ['http.server GET'] attrs= {"server.address": "127.0.0.1", "sentry.release": "n1-release@1.0.0", "sentry.environment": "n1-environment", "os.name": "macOS", "os.version": "24.6.0", "process.runtime.engine.name": "v8", "device.processor_count": 16}
```

`out2/dev-wronghost/app.log` (`--allow-net=127.0.0.1`, tunnel host `localhost`) - the app serves,
the sink stays empty (`out2/dev-wronghost/items.json` is `[]`, the sentinel never arrives), and the
handler error is only printed to the console:

```
CMD: deno run --allow-net=127.0.0.1 main-wronghost.ts
LISTENING 52848
Sentry SDK requires 'net' permission to send events.
    Run with '--allow-net=localhost:52847' to grant the required permissions.
Error: n1 nested boom
    at level3 (file:///.../N1/src/boom.ts:6:9)
```

`out2/dev-deploy2/items.json` - both captured events are replaced by the same internal error, the
user error is lost:

```
{"message": null, "exception": "TypeError: this.querySync is not a function", "mechanism": "internal", "server_name": null, "ctx_os": null, "frameCount": 10, "hasContextLine": false}
span ['http.server GET']
{"message": null, "exception": "TypeError: this.querySync is not a function", "mechanism": "internal", "server_name": null, "ctx_os": null, "frameCount": 10, "hasContextLine": false}
span ['http.server GET']
```

Only cosmetic differences from the record, none affecting the verdict: the app lives at the probe
root instead of a `dev/` subdirectory, so the entry is `./main-nh.ts` and the recorded frame line
numbers differ (`main-nh.ts:25`, `boom.ts:14/10/6` here); `src/boom.ts` has three nested frames
instead of one, so four in-app frames show up rather than two; the sink reports the exception as
`"Error: n1 nested boom"` (type prefix included) and the SDK name without the version suffix; and
the `NotCapable` stack points straight at
`node_modules/@sentry/server-runtime-injection/build/esm/vendored/debug/src/node.js:124:30` rather
than the sourcemapped `node_modules/debug/src/node.js:124:30`.

## Files

- `main-nh.ts` - docs-shaped entry, no module hook
- `main.ts` - same app with `import "@sentry/deno/import"` as the first line
- `main-wronghost.ts` - same app, tunnel host `localhost` while the flag allows `127.0.0.1`
- `main-deploy2.ts` - same app behind a `Deno.permissions` proxy that hides `querySync`
- `src/boom.ts` - three nested frames ending in `throw new Error('n1 nested boom')`
- `sink.mjs` - extended envelope sink; `run2.sh` / `run3.sh` - runners; `analyze.py` - table printer
- `out2/<label>/` - `app.log` and `items.json` per flag set, plus `out2/matrix.txt`
