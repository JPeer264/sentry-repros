# D01 - Process-level errors in a Deno script

Runtime: deno 2.9.0 | SDK: `@sentry/deno` 10.67.0 (develop line, tarballs in `_toolbox/pack/`)

## What it reproduces

Six small Deno scripts initialise `@sentry/deno` against a local envelope sink and then let an error
escape the script instead of catching it: an uncaught `throw` from a `setTimeout` callback
(`throw.ts`), an unhandled promise rejection (`reject.ts`), the same two with the module hook
`import "@sentry/deno/import"` as the first line (`throw-hook.ts`, `reject-hook.ts`), a synchronous
`throw` at module top level (`toplevel-throw.ts`) and a rejection with a non-Error value
(`reject-primitive.ts`). Each script also arms a 2s `STILL ALIVE` timer so it is visible whether the
process survives the error, and `baseline-throw.ts` is the same uncaught throw with no Sentry at all,
to compare the exit code. The point is to check what the Deno `GlobalHandlers` integration captures
for process-level errors, with which mechanism and level, and whether wiring Sentry in changes how
the process dies.

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

From this directory (pick a free port; check it first with `lsof -nP -iTCP:<port>`):

```
PORT=52843 node sink.mjs > sink.log 2>&1 & spid=$!
sleep 1
for f in throw.ts reject.ts throw-hook.ts reject-hook.ts toplevel-throw.ts reject-primitive.ts; do ./run.sh $f 52843; done > all.log 2>&1
deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys baseline-throw.ts > baseline-throw.ts.out 2>&1; echo "baseline exit=$?"
kill $spid; wait $spid
grep -a -E '^(==|exit=|init done|about to|\{)' all.log | sed 's/\x1b\[[0-9;]*m//g'
```

`run.sh` clears the sink, runs one script with
`SINK_PORT=<port> deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys <script>`,
prints its exit code and stdout/stderr (also saved to `<script>.out`), and prints the sink items.
`sink.mjs` is `_toolbox/sink.mjs` with the event mapping extended to keep `level`, the exception
type and value separately, the SDK version and the full `contexts.runtime`.

## Expected

Recorded verdict: **works**.

Both an uncaught error thrown from a `setTimeout` callback and an unhandled promise rejection are
captured by the Deno `GlobalHandlers` integration as `level=fatal`, `handled=false` events with
mechanism `auto.deno.global_handlers.error` / `auto.deno.global_handlers.unhandledrejection`, with
context lines. Identical with and without `import "@sentry/deno/import"`. The SDK flushes the event,
then rethrows, so the process exits with code 1 (same as a plain Deno script without Sentry); the 2s
`STILL ALIVE` timer never fires. Only cosmetic difference: Deno prints
`Uncaught (in promise) Error: ...` instead of `Uncaught Error: ...` because the SDK rethrows from
inside `flush().then()`.

Recorded evidence lines:

```
== develop/throw.ts exit=1
init done, sdk 10.67.0
about to throw
error: Uncaught (in promise) Error: d01 uncaught throw
== sink:
{"type":"event","level":"fatal","excType":"Error","exception":"d01 uncaught throw","mechanism":"auto.deno.global_handlers.error","handled":false,"sdk":"sentry.javascript.deno","runtime":{"name":"deno","version":"2.9.0"},"hasContextLine":true}

== develop/reject.ts exit=1
error: Uncaught (in promise) Error: d01 unhandled rejection
== sink:
{"type":"event","level":"fatal","excType":"Error","exception":"d01 unhandled rejection","mechanism":"auto.deno.global_handlers.unhandledrejection","handled":false,"sdk":"sentry.javascript.deno","runtime":{"name":"deno","version":"2.9.0"},"hasContextLine":true}

== develop/throw-hook.ts exit=1  (with import "@sentry/deno/import")
{"type":"event","level":"fatal","excType":"Error","exception":"d01 uncaught throw","mechanism":"auto.deno.global_handlers.error","handled":false,...,"hasContextLine":true}
== develop/reject-hook.ts exit=1
{"type":"event","level":"fatal","excType":"Error","exception":"d01 unhandled rejection","mechanism":"auto.deno.global_handlers.unhandledrejection","handled":false,...,"hasContextLine":true}

== develop/toplevel-throw.ts exit=1  (synchronous `throw` at module top level)
{"type":"event","level":"fatal","excType":"Error","exception":"d01 toplevel throw","mechanism":"auto.deno.global_handlers.unhandledrejection","handled":false,...,"hasContextLine":true}
== develop/reject-primitive.ts exit=1  (Promise.reject("just a string"))
{"type":"event","level":"fatal","excType":"UnhandledRejection","exception":"Non-Error promise rejection captured with value: just a string","mechanism":"auto.deno.global_handlers.unhandledrejection","handled":false,...,"hasContextLine":false}

baseline (no Sentry) deno run baseline-throw.ts: exit=1
```

Recorded side notes: a synchronous top-level `throw` is reported as
`.unhandledrejection`, not `.error`, because Deno evaluates ES modules as a promise; non-Error
rejections become `excType UnhandledRejection` with no context line; no session envelope is sent
(the Deno SDK has no `autoSessionTracking`).

## Observed on 2026-09-07

Matches the recorded verdict. Full output in `all.log` and the per-script `*.out` files; trimmed:

```
== throw.ts
exit=1
init done, sdk 10.67.0
about to throw
error: Uncaught (in promise) Error: d01 uncaught throw
== sink:
{"type": "event", "level": "fatal", "excType": "Error", "exception": "d01 uncaught throw", "mechanism": "auto.deno.global_handlers.error", "handled": false, "sdk": "sentry.javascript.deno", "sdkVersion": "10.67.0", "runtime": {"name": "deno", "version": "2.9.0"}, "hasContextLine": true}
== reject.ts
exit=1
error: Uncaught (in promise) Error: d01 unhandled rejection
== sink:
{"type": "event", "level": "fatal", "excType": "Error", "exception": "d01 unhandled rejection", "mechanism": "auto.deno.global_handlers.unhandledrejection", "handled": false, "sdk": "sentry.javascript.deno", "sdkVersion": "10.67.0", "runtime": {"name": "deno", "version": "2.9.0"}, "hasContextLine": true}
== throw-hook.ts
exit=1
{"type": "event", "level": "fatal", "excType": "Error", "exception": "d01 uncaught throw", "mechanism": "auto.deno.global_handlers.error", "handled": false, "sdk": "sentry.javascript.deno", "sdkVersion": "10.67.0", "runtime": {"name": "deno", "version": "2.9.0"}, "hasContextLine": true}
== reject-hook.ts
exit=1
{"type": "event", "level": "fatal", "excType": "Error", "exception": "d01 unhandled rejection", "mechanism": "auto.deno.global_handlers.unhandledrejection", "handled": false, "sdk": "sentry.javascript.deno", "sdkVersion": "10.67.0", "runtime": {"name": "deno", "version": "2.9.0"}, "hasContextLine": true}
== toplevel-throw.ts
exit=1
error: Uncaught (in promise) Error: d01 toplevel throw
{"type": "event", "level": "fatal", "excType": "Error", "exception": "d01 toplevel throw", "mechanism": "auto.deno.global_handlers.unhandledrejection", "handled": false, "sdk": "sentry.javascript.deno", "sdkVersion": "10.67.0", "runtime": {"name": "deno", "version": "2.9.0"}, "hasContextLine": true}
== reject-primitive.ts
exit=1
error: Uncaught (in promise) "just a string"
{"type": "event", "level": "fatal", "excType": "UnhandledRejection", "exception": "Non-Error promise rejection captured with value: just a string", "mechanism": "auto.deno.global_handlers.unhandledrejection", "handled": false, "sdk": "sentry.javascript.deno", "sdkVersion": "10.67.0", "runtime": {"name": "deno", "version": "2.9.0"}, "hasContextLine": false}

== baseline-throw.ts (no Sentry)
exit=1
error: Uncaught Error: d01 uncaught throw
```

Every recorded field matches: level, mechanism, handled, context lines, the hook making no
difference, the top-level throw arriving as `.unhandledrejection`, the non-Error rejection, and
exit code 1 everywhere including the Sentry-less baseline. `STILL ALIVE` never printed in any run,
and the sink held exactly one item per run (no session envelope). The only difference from the
record is how the SDK is installed: the record symlinked `node_modules/@sentry/*` into the build
worktree, this rebuild installs the same 10.67.0 tarballs from `_toolbox/pack/` so the install is
reproducible.

## Files

- `init.ts` - `Sentry.init` against the sink plus the 2s `STILL ALIVE` timer
- `throw.ts`, `reject.ts` - uncaught throw / unhandled rejection
- `throw-hook.ts`, `reject-hook.ts` - the same with `import "@sentry/deno/import"` first
- `toplevel-throw.ts` - synchronous throw at module top level
- `reject-primitive.ts` - `Promise.reject("just a string")`
- `baseline-throw.ts` - no Sentry, for the exit-code comparison
- `run.sh` - clears the sink, runs one script, prints exit code, output and sink items
- `sink.mjs` - envelope sink with an extended event mapping
- `all.log`, `*.ts.out`, `sink.log` - output of the run above
