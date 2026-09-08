# D16 - deno compile binary with the hook

Runtime: Deno 2.9.0. SDK: `develop` (`@sentry/*` 10.67.0 tarballs from `_toolbox/pack`).

## What it reproduces

Whether a Deno app that uses the `@sentry/deno/import` hook still works after `deno compile`.
The app is a `Deno.serve` server with a module-scope `mysql@2` connection and three routes
(`/db`, `/error`, `/log`) plus a `/sentinel` route the driver uses to know that everything sent
before it has reached the sink. The same app is driven twice, once with `deno run` and once as the
compiled binary started from a directory that contains nothing but the binary, and the two sink
dumps are diffed.

The point of the probe is that `deno compile` embeds `node_modules`, so the run-time injection hook
(`__SENTRY_ORCHESTRION__`) has to keep instrumenting `mysql` inside the binary. It also checks that
type-checking, which `deno compile` does by default, passes with the SDK's types.

## Install

```
cd probes/D16
npm install                 # tarballs via file: paths in package.json, plus mysql@2
```

`node_modules` must be a real directory. `deno compile` embeds a symlinked `node_modules` as 0-byte
files, which is what made the first attempt at this probe fail.

`mysql@2` ships no types, so `mysql.d.ts` declares the small surface `main.ts` uses and `main.ts`
points at it with `// @ts-types="./mysql.d.ts"`. Without it the default type-check of
`deno compile` fails.

## Run

MariaDB must be up on `127.0.0.1:3307` (root, no password, database `app`, table `users`).
Pick two free ports; 52117/52118 were used below.

```
cd probes/D16
export APP_PORT=52117 SINK_PORT=52118
PORT=$SINK_PORT node sink.mjs > sink.log 2>&1 &   # same file as _toolbox/sink.mjs

deno check main.ts

# baseline
./run-phase.sh run . deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main.ts

# compile, then run the binary from a directory that has no node_modules
mkdir -p /tmp/d16-bin
deno compile --allow-net --allow-env --allow-read --allow-sys --output /tmp/d16-bin/app main.ts
./run-phase.sh binary /tmp/d16-bin ./app

./normalize.sh items-run.json    > norm-run.txt
./normalize.sh items-binary.json > norm-binary.txt
diff norm-run.txt norm-binary.txt
```

The plain form the record uses is `deno compile --allow-net --allow-env --allow-read --allow-sys
--output app main.ts`, which writes the binary next to the sources; the `--output /tmp/d16-bin/app`
above only moves it to a directory without a `node_modules` so the "runs standalone" half of the
claim is actually exercised.

`run-phase.sh <label> <workdir> <cmd...>` starts the app in `<workdir>`, waits for it to answer,
runs `drive.mjs`, and writes `run-<label>.log`, `drive-<label>.log` and `items-<label>.json`.

The binary is ~99 MB, so it is not kept in this directory; `app` here is an emptied placeholder and
the `deno compile` line above recreates it. `node_modules` is removed after a run
(`rm -rf node_modules`); `npm install` brings it back.

## Expected

- `deno check main.ts` passes, and `deno compile`'s built-in type-check passes.
- The binary prints `injected at startup: {"runtime":["mysql"]}`, so the hook is active inside it.
- `GET /db` produces a `GET /db` transaction with a nested `db SELECT * FROM users` span.
- `GET /error` produces an unhandled event, mechanism `auto.http.deno`, with a context line.
- `GET /log` delivers an `info: hello from deno` log.
- The binary runs from a directory that has no `node_modules`.
- The binary's sink output is identical to `deno run`'s after trace ids are normalized.

## Observed on 2026-09-07

Rebuild matches the record: **works**.

`deno check main.ts` passes. `deno compile --allow-net --allow-env --allow-read --allow-sys
--output <dir>/app main.ts` succeeds (`Check main.ts`, `Embedded Files: node_modules/*
(37.55MB - 33.5MB unique)`, `Files: 33.82MB`) and writes a 104,018,498 byte (99.2 MiB) binary. The
binary was started from a directory whose only entry is `app`.

`run-binary.log`:

```
injected at startup: {"runtime":["mysql"]}
Listening on http://127.0.0.1:52117/
Error: route boom
    at file:///var/folders/.../T/deno-compile-app/main.ts:46:11
    at file:///var/folders/.../T/deno-compile-app/node_modules/@sentry/deno/build/esm/integrations/deno-serve.js:72:13
```

`drive-binary.log`:

```
/db -> 200 "[\"ada\",\"linus\"]\n"
/error -> 500 "Internal Server Error"
/log -> 200 "logged\n"
{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.deno","spans":["db SELECT * FROM users"]}
{"type":"event","exception":"Error: route boom","mechanism":"auto.http.deno","handled":false,"sdk":"sentry.javascript.deno","runtime":"deno","hasContextLine":true}
{"type":"log","items":["info: hello from deno"]}
```

`diff norm-run.txt norm-binary.txt` is empty (`diff-run-vs-binary.txt`, 0 bytes): the compiled binary
and `deno run` produce the same seven sink items in the same order. The only observable difference is
outside the payloads, in the stack-frame paths, which point at Deno's compile vfs
(`/var/folders/.../T/deno-compile-app/...`) instead of the source directory.

Notes:

- `enableLogs: true` is still not a valid `DenoOptions` key on `develop`. `deno check` fails with
  `TS2353: Object literal may only specify known properties, and 'enableLogs' does not exist in type
  'DenoOptions'`, so a quick start copied from v10 would break `deno compile`'s default type-check,
  even though logs are delivered without the option.
- Size is with the minimal tarball set (`@sentry/deno`, `@sentry/core`, `@sentry/server-utils`,
  `@sentry/server-runtime-injection`, and `mysql`); `@sentry/conventions` comes along as a transitive
  dependency. The record measured ~160 MB when all ten runtime tarballs are installed. The denort
  base is ~70 MB.
