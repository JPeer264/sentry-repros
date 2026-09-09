# D11 - Deno.cron check-ins

Runtime: deno 2.9.0 (machine default) and deno 2.8.3 (CI pin) | SDK: `@sentry/deno` 10.67.0 (develop
line, tarballs in `_toolbox/pack/`)

## What it reproduces

`cron.ts` initialises `@sentry/deno` with `integrations: [Sentry.denoCronIntegration()]` against a
local envelope sink, registers `Deno.cron("probe", "* * * * *", handler)` with a handler that sleeps
200 ms, and after `RUN_MS` sends a `sentinel` message, flushes and exits, so a 70 s run always crosses
one minute boundary. It is run three ways: on Deno 2.9.0 with `--unstable-cron`, on Deno 2.8.3 with
`--unstable-cron`, and on Deno 2.9.0 without the flag. `desc-probe.ts` prints the property descriptor
of `Deno.cron` on the running Deno and tries both plain assignment and `Object.defineProperty`, which
is what separates the two Deno versions: the integration patches cron with
`Deno.cron = new Proxy(Deno.cron, ...)` inside `setupOnce`, i.e. inside `Sentry.init()`.
`offset-probe.ts` checks that `DENO_CRON_TEST_SCHEDULE_OFFSET` is honoured and is in milliseconds.

## Install

From this directory:

```
npm install --no-audit --no-fund
```

(equivalently: `npm install --no-audit --no-fund ../../_toolbox/pack/sentry-deno-10.67.0.tgz
../../_toolbox/pack/sentry-core-10.67.0.tgz ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz
../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz`)

`deno.json` sets `nodeModulesDir: "manual"`, so Deno uses that `node_modules` as-is.

The Deno 2.8.3 leg needs the CI-pinned binary, which is not in this repo. Fetch it into a scratch
directory (`SCRATCH` is any writable directory outside this repo):

```
mkdir -p $SCRATCH/deno283 && cd $SCRATCH/deno283 \
  && curl -sSL -o deno283.zip https://github.com/denoland/deno/releases/download/v2.8.3/deno-aarch64-apple-darwin.zip \
  && unzip -o -q deno283.zip && chmod +x deno && ./deno --version
```

## Run

From this directory (pick a free port; check it first with `lsof -nP -iTCP:<port>`):

```
PORT=39117 node sink.mjs > sink.log 2>&1 & spid=$!
sleep 1

# descriptor probes
deno run --unstable-cron --no-prompt desc-probe.ts
$SCRATCH/deno283/deno run --unstable-cron --no-prompt desc-probe.ts

# Deno 2.9.0 with --unstable-cron (crashes at init)
curl -s -X DELETE http://127.0.0.1:39117/__items > /dev/null
SINK_PORT=39117 RUN_MS=70000 deno run --unstable-cron --no-prompt --allow-net --allow-env --allow-read --allow-sys cron.ts; echo "exit=$?"
curl -s http://127.0.0.1:39117/__items

# Deno 2.8.3 with --unstable-cron (70 s, waits for the minute boundary)
curl -s -X DELETE http://127.0.0.1:39117/__items > /dev/null
SINK_PORT=39117 RUN_MS=70000 $SCRATCH/deno283/deno run --unstable-cron --no-prompt --allow-net --allow-env --allow-read --allow-sys cron.ts; echo "exit=$?"
curl -s http://127.0.0.1:39117/__items

# Deno 2.9.0 without the flag
curl -s -X DELETE http://127.0.0.1:39117/__items > /dev/null
SINK_PORT=39117 RUN_MS=3000 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys cron.ts; echo "exit=$?"
curl -s http://127.0.0.1:39117/__items

# cron test offset (no Sentry)
DENO_CRON_TEST_SCHEDULE_OFFSET=2000 deno run --unstable-cron --no-prompt --allow-env offset-probe.ts
DENO_CRON_TEST_SCHEDULE_OFFSET=2000 $SCRATCH/deno283/deno run --unstable-cron --no-prompt --allow-env offset-probe.ts

kill $spid; wait $spid
```

`./run.sh 39117 [path-to-deno]` runs the three `cron.ts`/`desc-probe.ts` legs for one Deno binary
against an already-listening sink. `sink.mjs` is `_toolbox/sink.mjs` with the compact mapping
extended to keep the `check_in` fields (`check_in_id`, `monitor_slug`, `status`, `duration`,
`monitor_config`, `contexts`).

## Expected

Recorded verdict: **partial**.

On Deno 2.9.0 (the machine default) with `--unstable-cron`, `Sentry.init()` itself crashes the
process: `denoCronIntegration` does `Deno.cron = new Proxy(...)` but Deno 2.9.0 exposes `Deno.cron`
as a getter-only accessor, so init throws
`TypeError: Cannot set property cron of #<Object> which has only a getter` and the app exits 1 before
any user code runs. On Deno 2.8.3 (CI pin, `Deno.cron` is a writable data property) the integration
works: one `in_progress` and one `ok` check-in with monitor slug `probe` and crontab schedule
`* * * * *` arrived after the cron fired at the minute boundary. Without `--unstable-cron`, init
succeeds (the integration no-ops because `Deno.cron` is undefined) and the user's own `Deno.cron(...)`
call throws `TypeError: Deno.cron is not a function`; no `check_in` envelopes.

Recorded evidence lines:

```
Deno 2.9.0 + --unstable-cron (app-develop-cron.log):
error: Uncaught (in promise) TypeError: Cannot set property cron of #<Object> which has only a getter
      Deno.cron = new Proxy(Deno.cron, {
    at Object.setupOnce (.../packages/deno/src/integrations/deno-cron.ts:23:12)
    at setupIntegration (.../packages/core/src/integration.ts:118:17)
    at DenoClient.init (.../packages/deno/src/client.ts:77:11)
    at Module.init (.../packages/deno/src/sdk.ts:110:18)
exit=1

Descriptor probe (desc-probe.ts): Deno 2.9.0 typeof Deno.cron=function descriptor={"hasGet":true,"hasSet":false,"hasValue":false,"configurable":true} / assign threw: TypeError: Cannot set property cron of #<Object> which has only a getter / defineProperty ok
Deno 2.8.3 descriptor={"hasGet":false,"hasSet":false,"hasValue":true,"writable":true,"configurable":true} / assign ok

Deno 2.8.3 + --unstable-cron, 70 s run: sdk=10.67.0 Deno.cron=function / Deno.cron registered / cron fired 2026-09-04T09:10:00.005Z / done / exit=0
{"type":"check_in","at":"2026-09-04T09:10:00.007Z","check_in_id":"ad838a9c0ce6431abdbd0f6278533df4","monitor_slug":"probe","status":"in_progress","monitor_config":{"schedule":{"type":"crontab","value":"* * * * *"},"checkin_margin":1,"max_runtime":720},"contexts":{"trace":{"trace_id":"dce249a3f49d4575a516915836543fbe","span_id":"be637ef1d4476541"}}}
{"type":"check_in","at":"2026-09-04T09:10:00.209Z","check_in_id":"ad838a9c0ce6431abdbd0f6278533df4","monitor_slug":"probe","status":"ok","duration":0.2026073932647705,"contexts":{"trace":{"trace_id":"dce249a3f49d4575a516915836543fbe","span_id":"b9c32e8b62675290"}}}
{"type":"event","message":"sentinel","exception":"sentinel","mechanism":"generic","handled":true,"sdk":"sentry.javascript.deno"}

Deno 2.9.0 without --unstable-cron: sdk=10.67.0 Deno.cron=undefined / Deno.cron threw: TypeError: Deno.cron is not a function / done / exit=0
sink: [{"type":"event","exception":"Deno.cron is not a function","mechanism":"generic","handled":true,"sdk":"sentry.javascript.deno"}, {"type":"event","message":"sentinel",...}] (no check_in items)
```

Recorded side notes: `Object.defineProperty(Deno, 'cron', { value, writable: true, configurable: true })`
succeeds on both Deno versions, so it is a drop-in fix; `DENO_CRON_TEST_SCHEDULE_OFFSET` exists on
both versions and is in milliseconds; without `--unstable-cron` the SDK gives no warning that the
integration is inert.

## Observed on 2026-09-07

Matches the recorded verdict (**partial**) on every point. Full output in `app-290-cron.log`,
`app-283-cron.log`, `app-290-noflag.log`, `desc-probe-290.log`, `desc-probe-283.log`,
`offset-probe.log` and the `sink-items-*.json` files; trimmed:

```
== desc-probe, deno 2.9.0
deno 2.9.0 typeof Deno.cron=function descriptor={"hasGet":true,"hasSet":false,"hasValue":false,"configurable":true}
assign threw: TypeError: Cannot set property cron of #<Object> which has only a getter
defineProperty ok

== desc-probe, deno 2.8.3
deno 2.8.3 typeof Deno.cron=function descriptor={"hasGet":false,"hasSet":false,"hasValue":true,"writable":true,"configurable":true}
assign ok
defineProperty ok

== cron.ts, deno 2.9.0, --unstable-cron
error: Uncaught (in promise) TypeError: Cannot set property cron of #<Object> which has only a getter
    at Object.setupOnce (file:///.../probes/D11/node_modules/@sentry/deno/build/esm/integrations/deno-cron.js:23:12)
    at setupIntegration (file:///.../probes/D11/node_modules/@sentry/core/build/esm/integration.js:118:17)
    at DenoClient.init (file:///.../probes/D11/node_modules/@sentry/core/build/esm/client.js:524:12)
    at DenoClient.init (file:///.../probes/D11/node_modules/@sentry/deno/build/esm/client.js:77:11)
    at Module.init (file:///.../probes/D11/node_modules/@sentry/deno/build/esm/sdk.js:110:18)
exit=1
sink: [{"type":"event","exception":"TypeError: Cannot set property cron of #<Object> which has only a getter","mechanism":"auto.deno.global_handlers.unhandledrejection","handled":false,"sdk":"sentry.javascript.deno","runtime":"deno","hasContextLine":false,...}]

== cron.ts, deno 2.8.3, --unstable-cron, RUN_MS=70000 (started 09:33:01Z)
sdk=10.67.0 Deno.cron=function
Deno.cron registered
cron fired 2026-09-07T09:34:00.020Z
done
exit=0
sink:
{"type":"check_in","at":"2026-09-07T09:34:00.021Z","check_in_id":"ecbcddd5b6b042f0a80b95a6a08af0ee","monitor_slug":"probe","status":"in_progress","monitor_config":{"schedule":{"type":"crontab","value":"* * * * *"},"checkin_margin":1,"max_runtime":720},"contexts":{"trace":{"trace_id":"5aa69a7441a947b7bd856aa0a681de2b","span_id":"b24056904316f505"}}}
{"type":"check_in","at":"2026-09-07T09:34:00.227Z","check_in_id":"ecbcddd5b6b042f0a80b95a6a08af0ee","monitor_slug":"probe","status":"ok","duration":0.2032642364501953,"contexts":{"trace":{"trace_id":"5aa69a7441a947b7bd856aa0a681de2b","span_id":"afbd430857a84a20"}}}
{"type":"event","message":"sentinel","exception":"undefined: sentinel","mechanism":"generic","handled":true,"sdk":"sentry.javascript.deno","runtime":"deno","hasContextLine":true,"trace_id":"5aa69a7441a947b7bd856aa0a681de2b","environment":"production"}

== cron.ts, deno 2.9.0, no --unstable-cron, RUN_MS=3000
sdk=10.67.0 Deno.cron=undefined
Deno.cron threw: TypeError: Deno.cron is not a function
done
exit=0
sink:
{"type":"event","exception":"TypeError: Deno.cron is not a function","mechanism":"generic","handled":true,"sdk":"sentry.javascript.deno","runtime":"deno","hasContextLine":true,...}
{"type":"event","message":"sentinel","exception":"undefined: sentinel","mechanism":"generic","handled":true,...}

== offset-probe (no Sentry)
deno 2.9.0 DENO_CRON_TEST_SCHEDULE_OFFSET=2000 -> cron fired after 2006 ms
deno 2.8.3 DENO_CRON_TEST_SCHEDULE_OFFSET=2000 -> cron fired after 2002 ms
```

Everything in the record reproduces: the getter-only `Deno.cron` on 2.9.0 and the writable data
property on 2.8.3, the init-time crash with exit 1 and the same frames and line numbers, the working
`in_progress` + `ok` pair on 2.8.3 sharing one `check_in_id` with `monitor_slug` `probe`, schedule
`{crontab, "* * * * *"}`, `checkin_margin` 1, `max_runtime` 720 and a duration of ~0.203 s matching
the 200 ms handler, the silent no-op plus `Deno.cron is not a function` without the flag, and
`DENO_CRON_TEST_SCHEDULE_OFFSET` in milliseconds on both versions.

Three differences from the record, none of which changes the verdict:

- The record installed the SDK by symlinking the build worktree (its stack frames point at
  `packages/deno/src/*.ts`); this rebuild installs the same 10.67.0 tarballs from `_toolbox/pack/`,
  so the frames point at `node_modules/@sentry/deno/build/esm/*.js`. Line numbers still match
  (`deno-cron:23`, `integration:118`, deno `client:77`, deno `sdk:110`).
- The record does not say so explicitly, but `denoCronIntegration` is *not* a default integration of
  `@sentry/deno` (its own JSDoc claims "Enabled by default in the Deno SDK"), so `cron.ts` must pass
  it in `integrations: []`. A run without that line neither crashes on 2.9.0 nor sends any check-in,
  which is what pinned the omission down.
- On 2.9.0 the crash itself also reaches the sink, as one `handled: false`,
  `auto.deno.global_handlers.unhandledrejection` event before the process exits; the recorded
  evidence only shows the stderr trace. The client is already usable at that point because the
  integration setup that throws runs after the transport is wired.

## Files

- `cron.ts` - `Sentry.init` with `denoCronIntegration()`, one `Deno.cron("probe", "* * * * *", ...)`
  with a 200 ms handler, then sentinel + flush + exit after `RUN_MS`
- `desc-probe.ts` - property descriptor of `Deno.cron`, plain assignment and `Object.defineProperty`
- `offset-probe.ts` - `DENO_CRON_TEST_SCHEDULE_OFFSET` timing, no Sentry
- `sink.mjs` - envelope sink with the `check_in` mapping added
- `run.sh` - the three `cron.ts`/`desc-probe.ts` legs for one Deno binary
- `app-290-cron.log`, `app-283-cron.log`, `app-290-noflag.log`, `desc-probe-290.log`,
  `desc-probe-283.log`, `offset-probe.log`, `sink-items-290.json`, `sink-items-283.json`,
  `sink-items-290-noflag.json`, `sink.log` - output of the run above
