# B08 — Short-lived Bun script: delivery without flush

Runtime: bun · SDK: `@sentry/bun` 10.67.0 (develop, `getsentry/sentry-javascript` @ `6f2da7483d`) · Recorded verdict: **partial**

## What it reproduces

A short-lived Bun script that captures an exception and then ends, in three shapes: letting the process exit naturally, calling `process.exit(0)` immediately after `captureException`, and awaiting `Sentry.flush(2000)` before `process.exit(0)`. The natural exit delivers the event (Bun keeps the event loop alive until the transport `fetch` completes) and the explicit flush delivers it, but `process.exit(0)` right after capture drops the event silently every time, with no transport error and no SDK warning even with `debug: true` — the last debug line is `Captured error event \`x-exit\``. Neither `@sentry/bun` nor `@sentry/core` registers a process `exit`/`beforeExit` hook, so nothing intercepts `process.exit`. This is the same as Node's behavior rather than a Bun-specific regression, but the Bun docs do not warn about it.

## Install

```
cd $REPRO/probes/B08
npm install ../../_toolbox/pack/sentry-bun-10.67.0.tgz ../../_toolbox/pack/sentry-core-10.67.0.tgz ../../_toolbox/pack/sentry-node-10.67.0.tgz ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz ../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz ../../_toolbox/pack/sentry-opentelemetry-10.67.0.tgz
```

## Run

```
cd $REPRO/probes/B08

# envelope sink (local copy of the toolbox sink, extended to report contexts.runtime.version)
PORT=37261 node ./sink.mjs > sink.log 2>&1 & pid=$!

# the three shapes
for s in natural exit flush; do
  curl -s -X DELETE http://127.0.0.1:37261/__items
  SINK_PORT=37261 bun run $s.ts
  sleep 3
  curl -s http://127.0.0.1:37261/__items; echo
done

# the dropped case with SDK debug logging
curl -s -X DELETE http://127.0.0.1:37261/__items
SENTRY_DEBUG=1 SINK_PORT=37261 bun run exit.ts
sleep 3; curl -s http://127.0.0.1:37261/__items; echo

kill $pid
```

## Expected

Recorded verdict: **partial** — natural exit and explicit flush deliver, but `process.exit(0)` immediately after capture silently drops the event (3 runs on Bun 1.4.0, 1 run on the CI pin Bun 1.3.14). Recorded evidence lines:

```
natural (sink after process exit): [{"type":"event","exception":"x-natural","mechanism":"generic","handled":true,"sdk":"sentry.javascript.bun","runtime":{"name":"bun","version":"1.4.0"},"hasContextLine":true}]
exit (stdout): captured, process.exit(0)   sink after 3s: []   (repeated 3x on bun 1.4.0, 1x on bun 1.3.14, always [])
exit with SENTRY_DEBUG=1, last SDK lines: Sentry Logger [log]: Captured error event `x-exit` / captured, process.exit(0) / sink: []
flush (stdout): captured, flushed: true process.exit(0)   sink: [{"type":"event","exception":"x-flush","mechanism":"generic","handled":true,"sdk":"sentry.javascript.bun","runtime":{"name":"bun","version":"1.4.0"},"hasContextLine":true}]
natural on bun 1.3.14: [{"type":"event","exception":"x-natural",...,"runtime":{"name":"bun","version":"1.3.14"},"hasContextLine":true}]
```

## Observed on 2026-09-07

Bun 1.4.0, `@sentry/bun` 10.67.0 from the develop tarballs:

```
=== natural ===
captured, natural exit
--- sink after 3s ---
[{"type":"event","exception":"Error: x-natural","mechanism":"generic","handled":true,"sdk":"sentry.javascript.bun","runtime":{"name":"bun","version":"1.4.0"},"hasContextLine":true,"trace_id":"2943b809303b417d8c5e99915e92afd6","environment":"production"}]
=== exit ===
captured, process.exit(0)
--- sink after 3s ---
[]
=== flush ===
captured, flushed: true
--- sink after 3s ---
[{"type":"event","exception":"Error: x-flush","mechanism":"generic","handled":true,"sdk":"sentry.javascript.bun","runtime":{"name":"bun","version":"1.4.0"},"hasContextLine":true,"trace_id":"4e26c98a88c344e58ebb9e5a2688ac96","environment":"production"}]

=== exit with SENTRY_DEBUG=1 (bun 1.4.0) ===
Sentry Logger [log]: SDK initialized from ESM
Sentry Logger [warn]: [Sentry] No diagnostics-channel injection detected. Channel-based integrations will not record spans. Make sure the diagnostics channels are injected via the runtime `--import` hook or a bundler plugin before the instrumented modules load.
Sentry Logger [log]: Captured error event `x-exit`
captured, process.exit(0)
--- sink ---
[]

captured, process.exit(0)
run 2 sink: []
captured, process.exit(0)
run 3 sink: []
```

**Matches the recorded verdict.** All three outcomes reproduce on Bun 1.4.0, including the silent drop across three `process.exit(0)` runs and the debug log ending at `Captured error event \`x-exit\``.

Two differences, neither affecting the verdict:

- The Bun 1.3.14 CI pin (`$SCRATCH/bun1314/bun-darwin-aarch64/bun`) no longer exists in the scratchpad, so the cross-version check is **not-run** (`no such file or directory`). Only Bun 1.4.0 was exercised.
- The sink prints the exception as `Error: x-natural` / `Error: x-flush` (`${type}: ${value}`); the record quotes the value alone (`x-natural`), and the local sink also emits `trace_id` and `environment`. Cosmetic sink-formatting differences.
