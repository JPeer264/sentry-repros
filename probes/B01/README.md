# B01 - Process-level errors in a Bun script

Runtime: bun 1.4.2 | SDK: `@sentry/bun` 10.67.0 (develop line, tarballs in `_toolbox/pack/`)

## What it reproduces

A plain Bun script (no server, no bundle) initialises `@sentry/bun` against a local envelope sink and
then triggers the two process-level error paths the Node integrations own: an uncaught exception
(thrown from a `setTimeout` callback and, in a second case, at top level) and an unhandled promise
rejection. Each case is run again with the options that change the outcome - `mode: 'strict'` on
`onUnhandledRejectionIntegration`, a user-registered `process.on('uncaughtException')` handler, and
`exitEvenIfOtherHandlersAreRegistered: true` on `onUncaughtExceptionIntegration` - and the same
scripts are run once with no SDK at all as a baseline. The point is to check which event the SDK
sends (mechanism, `level`, `handled`, `extra`) and what the process exit code becomes compared with
plain Bun, since Bun crashes on unhandled rejections by default while the SDK's default `warn` mode
keeps the process alive.

## Install

```
npm install --no-audit --no-fund \
  ../../_toolbox/pack/sentry-bun-10.67.0.tgz \
  ../../_toolbox/pack/sentry-core-10.67.0.tgz \
  ../../_toolbox/pack/sentry-node-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  ../../_toolbox/pack/sentry-opentelemetry-10.67.0.tgz
```

Run it from this directory. `bun add` cannot resolve the tarballs' transitive `@sentry/*@10.67.0`
dependencies; install with npm and run with bun.

## Run

From this directory. `run.sh` starts the sink itself, runs the six SDK cases, clears the sink between
cases and writes `results.log`; `run-baseline.sh` runs the same scripts without the SDK and writes
`results-baseline.log`.

```
./run.sh 52487 bun
./run-baseline.sh bun
```

The arguments are the sink port and the bun binary. Pick a port nothing else is listening on
(`lsof -nP -iTCP:<port>`): `run.sh` does not check, and if the port is taken the cases post into the
other listener and the results come back missing fields. `sink.mjs` is `_toolbox/sink.mjs` with `level`
and `extra` added to the compacted `event` shape. To run one case by hand:

```
PORT=52487 node sink.mjs > sink.log 2>&1 & spid=$!
SINK_PORT=52487 bun throw.ts                              # throw-timer
SINK_PORT=52487 WHERE=toplevel bun throw.ts               # throw-toplevel
SINK_PORT=52487 bun reject.ts                             # reject-default
SINK_PORT=52487 REJECTION_MODE=strict bun reject.ts       # reject-strict
SINK_PORT=52487 USER_HANDLER=1 bun throw.ts               # userhandler-default
SINK_PORT=52487 USER_HANDLER=1 EXIT_EVEN=1 bun throw.ts   # userhandler-exiteven
curl -s http://127.0.0.1:52487/__items
kill $spid; wait $spid
```

## Expected

Recorded verdict: **works**.

Uncaught exception (timer or top level): one event, mechanism `auto.node.onuncaughtexception`,
`handled=false`, level `fatal`, exit code 1 - the same as the no-SDK baseline, because the SDK prints
the error and calls `process.exit(1)` after flushing. Unhandled rejection: one event, mechanism
`auto.node.onunhandledrejection`, `handled=false`, level `error`,
`extra.unhandledPromiseRejection=true`; with the default mode `warn` the SDK prints the Node-style
warning and the process keeps running and exits 0, whereas the no-SDK baseline exits 1 (Bun crashes
on unhandled rejections by default). With mode `strict` the event is `fatal` and the process exits 1.
With a user `process.on('uncaughtException')` handler and the default
`exitEvenIfOtherHandlersAreRegistered=false` the event is captured but the SDK does not exit (exit 0,
same as the baseline with a handler); with `exitEvenIfOtherHandlersAreRegistered: true` it exits 1.

Recorded evidence lines:

```
throw-timer: {"type":"event","exception":"B01 uncaught exception (timer)","mechanism":"auto.node.onuncaughtexception","level":"fatal","handled":false,...} EXIT_CODE=1
reject-default: {"mechanism":"auto.node.onunhandledrejection","level":"error","extra":{"unhandledPromiseRejection":true},"handled":false} then warning printed, EXIT_CODE=0
BASELINE no SDK: reject-default EXIT_CODE=1
reject-strict: level fatal, EXIT_CODE=1
userhandler default: event + sentinel, EXIT_CODE=0
userhandler + exitEven: event, EXIT_CODE=1
```

The record also notes the same seven cases behaved identically on Bun 1.4.0 and on the CI pin 1.3.14.

## Observed on 2026-09-07

Matches the recorded verdict. Full output in `results.log` and `results-baseline.log`; trimmed:

```
=== throw-timer ===
EXIT_CODE=1
{"type": "event", "exception": "Error: B01 uncaught exception (timer)", "mechanism": "auto.node.onuncaughtexception", "handled": false, "level": "fatal", "sdk": "sentry.javascript.bun", "runtime": "bun", "hasContextLine": true}

=== throw-toplevel ===
EXIT_CODE=1
{"type": "event", "exception": "Error: B01 uncaught exception (top level)", "mechanism": "auto.node.onuncaughtexception", "handled": false, "level": "fatal", "sdk": "sentry.javascript.bun", "runtime": "bun", "hasContextLine": true}

=== reject-default ===
This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). The promise rejected with the reason:
Error: B01 unhandled rejection
EXIT_CODE=0
{"type": "event", "exception": "Error: B01 unhandled rejection", "mechanism": "auto.node.onunhandledrejection", "handled": false, "level": "error", "extra": {"unhandledPromiseRejection": true}, "sdk": "sentry.javascript.bun", "runtime": "bun", "hasContextLine": true}
{"type": "event", "message": "sentinel", "mechanism": "generic", "handled": true, "level": "info", ...}

=== reject-strict ===
error: B01 unhandled rejection
EXIT_CODE=1
{"type": "event", "exception": "Error: B01 unhandled rejection", "mechanism": "auto.node.onunhandledrejection", "handled": false, "level": "fatal", "extra": {"unhandledPromiseRejection": true}, "sdk": "sentry.javascript.bun", "runtime": "bun", "hasContextLine": true}

=== userhandler-default ===
USER_HANDLER saw: B01 uncaught exception (timer)
EXIT_CODE=0
{"type": "event", "exception": "Error: B01 uncaught exception (timer)", "mechanism": "auto.node.onuncaughtexception", "handled": false, "level": "fatal", ...}
{"type": "event", "message": "sentinel", "mechanism": "generic", "handled": true, "level": "info", ...}

=== userhandler-exiteven ===
error: B01 uncaught exception (timer)
USER_HANDLER saw: B01 uncaught exception (timer)
EXIT_CODE=1
{"type": "event", "exception": "Error: B01 uncaught exception (timer)", "mechanism": "auto.node.onuncaughtexception", "handled": false, "level": "fatal", ...}

=== BASELINE throw-timer ===        EXIT_CODE=1
=== BASELINE throw-toplevel ===     EXIT_CODE=1
=== BASELINE reject-default ===     EXIT_CODE=1
=== BASELINE userhandler-default === USER_HANDLER saw: ... / baseline still alive / EXIT_CODE=0
```

Every recorded mechanism, level, `extra` field and exit code matches, including the sentinel arriving
only in the two cases where the process survives (`reject-default`, `userhandler-default`) and the
baseline/SDK exit-code divergence on the unhandled rejection (baseline 1, SDK 0).

Differences from the record, none behavioural:

- The bun on this machine is 1.4.2, not the 1.4.0 the record ran, and the CI-pinned 1.3.14 the record
  also ran (`$SCRATCH/bun1314/`) is no longer here, so this rebuild ran only bun 1.4.2. All seven cases
  behave as recorded on it; the record reports 1.4.0 and 1.3.14 as identical to each other.
- This `sink.mjs` prints `exception` as `"<type>: <value>"` (`"Error: B01 uncaught exception
  (timer)"`), where the recorded excerpt shows the value alone. That is the sink's formatting, not
  the event.
- `reject-strict` on develop prints Bun's own crash output, not the "This error originated either
  by..." warning. The record notes exactly this as the one cosmetic difference between develop and
  10.73.0 (10.73.0 always prints the warning in strict mode), so develop behaving this way is what
  the record expects.

## Files

- `instrument.ts` - `Sentry.init` against the sink; `REJECTION_MODE` and `EXIT_EVEN` switch the two
  integration options
- `throw.ts` - uncaught exception, timer by default, top level with `WHERE=toplevel`, optional user
  `uncaughtException` handler with `USER_HANDLER=1`; a later timer captures a `sentinel` message so a
  surviving process is visible in the sink
- `reject.ts` - unhandled promise rejection plus the same sentinel timer
- `baseline/throw.ts`, `baseline/reject.ts` - the same scripts with no SDK
- `run.sh`, `run-baseline.sh` - the runners described above
- `results.log`, `results-baseline.log` - output of the run above
- `sink.mjs` - envelope sink with `level` and `extra` kept on events
