# X03 - K3 independent re-verification (JSON require under a load hook)

Runtime: deno 2.9.0 and deno 2.8.3 (CI pin) | SDK: `@sentry/deno` 10.67.0 (develop line, tarballs in `_toolbox/pack/`)

## What it reproduces

Finding K3: on Deno, a CommonJS file that does `require('./x.json')` throws
`SyntaxError: Unexpected token ':'` as soon as ANY `node:module` `registerHooks({ load })` hook is
registered, including a pure pass-through no-op with no Sentry code in it, which is why
`import '@sentry/deno/import'` breaks `import 'express'` at load time. Sixteen small scripts isolate
the defect: the same require with no hook (`a-nohook`) and with a resolve-only hook
(`b2-resolve-only`) works, a no-op load hook (`b-noop`) and the Sentry hook (`c-sentry`) both fail,
and express reproduces it end to end (`d2-express-nohook` ok, `d3-express-noop` / `d-express` fail at
`node_modules/statuses/index.js:15`). `e2-ctx` shows the mechanism, Deno's `nextLoad()` hands back no
`format` for `.json` so its CJS loader compiles the JSON text as JS, and `e-format-json` /
`e3-workaround` show that a hook which supplies `format: 'json'` (or rewrites the source to
`module.exports=<json>`) fixes it. `f-sentry-fixed` layers exactly that fix outside the Sentry hook
and gets both a working `import 'express'` and the Sentry injection
(`__SENTRY_ORCHESTRION__.runtime = ["express","express"]`), so an SDK-side workaround is feasible.
Koa (`g0-koa-nohook`, `g-koa`, `g2-koa-sentry`) is a separate Deno bug that the JSON fix does not
touch.

## Install

From this directory:

```
npm install --no-audit --no-fund
```

`deno.json` sets `nodeModulesDir: "manual"`, so Deno uses that `node_modules` as-is. The four
`@sentry/*` deps resolve to the tarballs in `../../_toolbox/pack/`; `express` and `koa` come from npm.

## Run

From this directory (pick a free port; check it first with `lsof -nP -iTCP:<port>`):

```
PORT=47731 node sink.mjs > sink-rerun.log 2>&1 & spid=$!
sleep 1
./run.sh 47731 > rerun.log 2>&1
curl -s -X DELETE http://127.0.0.1:47731/__items > /dev/null
./run.sh 47731 <path-to-deno-2.8.3> > rerun-283.log 2>&1
kill $spid; wait $spid
```

`run.sh <port> [deno-binary]` runs all sixteen scripts, then the `--unstable-*` flag matrix on
`b-noop.mjs`, then dumps `curl -s http://127.0.0.1:<port>/__items`. To run one script on its own:

```
SINK_PORT=47731 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys b-noop.mjs
```

The second leg needs the CI-pinned Deno 2.8.3, which is not in this repo. Fetch it into a scratch
directory and pass that path as `run.sh`'s second argument:

```
mkdir -p /tmp/deno283 && cd /tmp/deno283 \
  && curl -sSL -o deno283.zip https://github.com/denoland/deno/releases/download/v2.8.3/deno-aarch64-apple-darwin.zip \
  && unzip -o -q deno283.zip && chmod +x deno && ./deno --version
```

## Expected

Recorded verdict: **broken**.

K3 confirmed independently on both deno 2.9.0 and 2.8.3: a CJS file doing `require('./x.json')` works
with no hook and with a resolve-only hook, but fails with `SyntaxError: Unexpected token ':'` under
ANY `node:module` `registerHooks({load})` hook, even a pure pass-through no-op, so the defect is in
Deno, not in the Sentry transform (denoland/deno#36240). Recorded evidence lines:

```
--- a-nohook: JSON_OK {"hello":"world","n":1} / RESULT a-nohook: ok
--- b-noop: RESULT b-noop: FAIL SyntaxError: Unexpected token ':' / LOAD_SEEN ["req.cjs format=undefined source=string","x.json format=undefined source=string"]
--- b2-resolve-only: RESULT b2-resolve-only: ok
--- c-sentry: RESULT c-sentry: FAIL SyntaxError: Unexpected token ':'
--- d2-express-nohook: RESULT d2-express-nohook: ok typeof=function
--- d3-express-noop: RESULT d3-express-noop: FAIL SyntaxError: Unexpected token ':'  (stack: at Object.compileFunction (ext:core/01_core.js:1106:31) at wrapSafe (node:module:1666:21) at Module._compile (node:module:1691:23) ... at Object.<anonymous> (.../node_modules/statuses/index.js:15:13))
--- d-express: RESULT d-express: FAIL SyntaxError: Unexpected token ':'
--- e2-ctx: CTX x.json {"conditions":["node","require"],"importAttributes":{}} / RES {"shortCircuit":true,"srcType":"string","srcHead":"{ \"hello\": \"world\", \"n\": 1 }\n"}  (no `format` key at all)
--- e-format-json (hook sets r.format='json' for .json): RESULT e-format-json: ok
--- e3-workaround (hook returns commonjs 'module.exports='+json): RESULT e3-workaround: ok {"hello":"world","n":1}
--- e4-esm-json (ESM `import './x.json' with {type:'json'}` under no-op load hook): 2.9.0 ok; 2.8.3 FAIL SyntaxError: Unexpected token ':' at .../X03/develop/x.json:1:10  (e4b without hook: ok on both)
--- f-sentry-fixed: RESULT f-sentry-fixed: ok typeof=function injected=["express","express"]
--- g0-koa-nohook: ok typeof=function; g-koa(noop+jsonfix) and g2-koa-sentry: FAIL TypeError: Cannot resolve module "./index.js" from "file:///.../node_modules/generator-function/require.mjs" at loadESMFromCJS (node:module:1751:56)
--- flags on b-noop (each of --unstable-node-globals --unstable-sloppy-imports --unstable-detect-cjs --unstable-bare-node-builtins --unstable-npm-lazy-caching --unstable-unsafe-proto, all four combined, and --unstable): RESULT b-noop: FAIL SyntaxError: Unexpected token ':'
```

Recorded sink (trimmed):

```
{"type":"event","message":"sentinel c-sentry FAIL SyntaxError: Unexpected token ':'","sdk":"sentry.javascript.deno","runtime":{"name":"deno","version":"2.9.0"}}
{"type":"event","message":"sentinel d-express FAIL SyntaxError: Unexpected token ':'","runtime":{"name":"deno","version":"2.9.0"}}
{"type":"event","message":"sentinel f-sentry-fixed ok","runtime":{"name":"deno","version":"2.9.0"}}
```

## Observed on 2026-09-07

deno 2.9.0 and deno 2.8.3, sink on port 47731. Verbatim, trimmed (full output in `rerun.log` and
`rerun-283.log`):

```
--- a-nohook
JSON_OK {"hello":"world","n":1}
RESULT a-nohook: ok
--- b-noop
RESULT b-noop: FAIL SyntaxError: Unexpected token ':'
LOAD_SEEN ["req.cjs format=undefined source=string","x.json format=undefined source=string"]
--- b2-resolve-only
JSON_OK {"hello":"world","n":1}
RESULT b2-resolve-only: ok
--- c-sentry
RESULT c-sentry: FAIL SyntaxError: Unexpected token ':'
--- d2-express-nohook
RESULT d2-express-nohook: ok typeof=function
--- d3-express-noop
RESULT d3-express-noop: FAIL SyntaxError: Unexpected token ':'
    at Object.compileFunction (ext:core/01_core.js:1106:31)
    at wrapSafe (node:module:1666:21)
    at Module._compile (node:module:1691:23)
    at Object.<anonymous> (file://$REPRO/probes/X03/node_modules/statuses/index.js:15:13)
--- d-express
RESULT d-express: FAIL SyntaxError: Unexpected token ':'
--- e-format-json
JSON_OK {"hello":"world","n":1}
RESULT e-format-json: ok
--- e2-ctx
CTX x.json {"conditions":["node","require"],"importAttributes":{}}
RES {"shortCircuit":true,"srcType":"string","srcHead":"{ \"hello\": \"world\", \"n\": 1 }\n"}
RES_KEYS ["source","format","shortCircuit"]
RESULT e2-ctx: FAIL SyntaxError: Unexpected token ':'
--- e3-workaround
JSON_OK {"hello":"world","n":1}
RESULT e3-workaround: ok {"hello":"world","n":1}
--- e4-esm-json
RESULT e4-esm-json: ok {"hello":"world","n":1}                                                     (2.9.0)
RESULT e4-esm-json: FAIL SyntaxError: Unexpected token ':' at file:///.../probes/X03/x.json:1:10   (2.8.3)
--- e4b-esm-json-nohook
RESULT e4b-esm-json-nohook: ok {"hello":"world","n":1}
--- f-sentry-fixed
RESULT f-sentry-fixed: ok typeof=function injected=["express","express"]
--- g0-koa-nohook
RESULT g0-koa-nohook: ok typeof=function
--- g-koa
RESULT g-koa: FAIL TypeError: TypeError: Cannot resolve module "./index.js" from "file://$REPRO/probes/X03/node_modules/generator-function/require.mjs"
    at loadESMFromCJS (node:module:1751:56)
--- g2-koa-sentry
RESULT g2-koa-sentry: FAIL TypeError: TypeError: Cannot resolve module "./index.js" from "file://$REPRO/probes/X03/node_modules/generator-function/require.mjs"
--- unstable flags on b-noop
--unstable-node-globals -> RESULT b-noop: FAIL SyntaxError: Unexpected token ':'
--unstable-sloppy-imports -> RESULT b-noop: FAIL SyntaxError: Unexpected token ':'
--unstable-detect-cjs -> RESULT b-noop: FAIL SyntaxError: Unexpected token ':'
--unstable-bare-node-builtins -> RESULT b-noop: FAIL SyntaxError: Unexpected token ':'
--unstable-npm-lazy-caching -> RESULT b-noop: FAIL SyntaxError: Unexpected token ':'
--unstable-unsafe-proto -> RESULT b-noop: FAIL SyntaxError: Unexpected token ':'
--unstable -> RESULT b-noop: FAIL SyntaxError: Unexpected token ':'
all-four-combined -> RESULT b-noop: FAIL SyntaxError: Unexpected token ':'
--- sink
{"type": "event", "message": "sentinel c-sentry FAIL SyntaxError: Unexpected token ':'", "sdk": "sentry.javascript.deno", "runtime": "deno", "release": "x03"}
{"type": "event", "message": "sentinel d-express FAIL SyntaxError: Unexpected token ':'", "sdk": "sentry.javascript.deno", "runtime": "deno", "release": "x03"}
{"type": "event", "message": "sentinel f-sentry-fixed ok", "sdk": "sentry.javascript.deno", "runtime": "deno", "release": "x03"}
```

Every line above is identical on deno 2.9.0 and deno 2.8.3 except `e4-esm-json`, which is marked with
the version it came from; the three sink events were emitted once per leg.

Matches the recorded verdict (**broken**) on both Deno versions: every script lands on the recorded
result, including the `statuses/index.js:15` frame, the `format=undefined` load records, the recorded
2.9.0-ok / 2.8.3-fail split on `e4-esm-json`, the `injected=["express","express"]` proof that the
JSON fix restores Sentry injection, and the koa `loadESMFromCJS` failure.

Two differences, neither about the finding:

- **`e2-ctx` `format` key.** The recorded note "no `format` key at all" is about the JSON dump, which
  drops undefined values. `RES_KEYS` (added in this rebuild) shows the key is present as
  `format: undefined`, which is exactly what `b-noop`'s `LOAD_SEEN` already reported.
- **Sink shape.** The `sink.mjs` mirrored in `_toolbox/` records `runtime` as the plain string
  `"deno"` rather than the `{name, version}` object in the recorded lines. Same three sentinels, same
  messages, plus a `release: "x03"` field.

Cosmetic only: the port is 47731 (the recorded 53217 belonged to the lost run), the trace ids are
this run's own, and `b2-resolve-only` / `e-format-json` / `e3-workaround` also print the `JSON_OK`
line from `req.cjs`, which the recorded evidence trimmed away.

## Files

`x.json`, `req.cjs` (the CJS file doing `require('./x.json')`), `init.mjs` (Sentry init + sentinel
helper), `a-nohook.mjs`, `b-noop.mjs`, `b2-resolve-only.mjs`, `c-sentry.mjs`, `d-express.mjs`,
`d2-express-nohook.mjs`, `d3-express-noop.mjs`, `e-format-json.mjs`, `e2-ctx.mjs`, `e3-workaround.mjs`,
`e4-esm-json.mjs`, `e4b-esm-json-nohook.mjs`, `f-sentry-fixed.mjs`, `g0-koa-nohook.mjs`, `g-koa.mjs`,
`g2-koa-sentry.mjs`, `run.sh`, `sink.mjs`, `rerun.log` (deno 2.9.0), `rerun-283.log` (deno 2.8.3),
`sink-rerun.log`. `all.log` / `all-283.log` / `sink.log` are an earlier, identical pass on port 41877.
