# D08 — Short-lived Deno script: delivery without flush

## What it reproduces

Three short-lived Deno scripts each call `Sentry.captureException` once against the develop
(v11 line, package version 10.67.0) `@sentry/deno` SDK, and differ only in how the process ends.
`natural.ts` lets the script end on its own and the event is delivered without any explicit flush,
because Deno keeps the process alive until the transport's `fetch` settles. `denoexit.ts` calls
`Deno.exit(0)` immediately after capturing and the event is silently lost every time — no warning,
exit code 0, nothing in the sink. `flush.ts` awaits `Sentry.flush()` before `Deno.exit(0)`, the
flush resolves `true`, and the event arrives. The SDK does register a `globalThis` `unload`
listener (`packages/deno/src/client.ts`), but it only calls `_INTERNAL_flushLogsBuffer`, and
`Deno.exit` is synchronous, so a pending transport `fetch` cannot complete — error events are not
covered by it.

## Install

```
npm install
```

(`package.json` points at the develop tarballs in `../../_toolbox/pack/`; `deno.json` sets
`nodeModulesDir: "manual"` so Deno uses that `node_modules`.)

## Run

Pick a free port for the sink and use the same one for `SINK_PORT`.

```
S=$SCRATCH
PORT=52843 node $REPRO/_toolbox/sink.mjs > sink.log 2>&1 &

cd $REPRO/probes/D08

SINK_PORT=52843 TAG=dev deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys natural.ts
sleep 1; curl -s http://127.0.0.1:52843/__items

SINK_PORT=52843 TAG=dev deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys denoexit.ts
sleep 2; curl -s http://127.0.0.1:52843/__items

SINK_PORT=52843 TAG=dev deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys flush.ts
sleep 1; curl -s http://127.0.0.1:52843/__items
```

Optional cross-check on the CI-pinned Deno (only if `$SCRATCH/deno283/deno` exists):

```
SINK_PORT=52843 TAG=dev-283 $SCRATCH/deno283/deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys denoexit.ts
```

## Expected

Recorded verdict: **partial**.

Natural exit: the event is delivered without any flush (Deno keeps the process alive until the
transport's fetch settles). `Deno.exit(0)` right after `captureException`: the event is lost every
time (3 runs on deno 2.9.0 plus 1 on 2.8.3, sink stayed empty). `await Sentry.flush()` before
`Deno.exit(0)`: flush resolves `true` and the event is delivered.

Recorded evidence lines:

```
natural.ts -> sink: [{"type":"event","exception":"natural-exit-dev","mechanism":"generic","handled":true,"sdk":"sentry.javascript.deno","runtime":{"name":"deno","version":"2.9.0"},"hasContextLine":true}]
denoexit.ts (stdout: "captured, Deno.exit(0)", exit=0) -> sink unchanged, no "deno-exit-dev" item; after 3x denoexit + deno 2.8.3 run and 4 s wait: []
flush.ts (stdout: "captured, flushing" / "flush result: true") -> sink: {"type":"event","exception":"flush-exit-dev","mechanism":"generic","handled":true,"sdk":"sentry.javascript.deno","runtime":{"name":"deno","version":"2.9.0"},"hasContextLine":true}
```

## Observed on 2026-09-07

deno 2.9.0 (stable, aarch64-apple-darwin), sink on port 52843.

`natural.ts`:

```
captured, natural exit
exit=0
--- items:
[{"type":"event","exception":"Error: natural-exit-dev","mechanism":"generic","handled":true,"sdk":"sentry.javascript.deno","runtime":"deno","hasContextLine":true,"trace_id":"25d9cd3f91834cd9929b0323ffbded54","environment":"production"}]
```

`denoexit.ts`, first run:

```
captured, Deno.exit(0)
exit=0
--- items:
[{"type":"event","exception":"Error: natural-exit-dev","mechanism":"generic","handled":true,"sdk":"sentry.javascript.deno","runtime":"deno","hasContextLine":true,"trace_id":"25d9cd3f91834cd9929b0323ffbded54","environment":"production"}]
```

`denoexit.ts`, runs 2 and 3, then a 4 s wait (exception list only):

```
captured, Deno.exit(0)
exit=0
captured, Deno.exit(0)
exit=0
--- items:
["Error: natural-exit-dev"]
```

`flush.ts`:

```
captured, flushing
flush result: true
exit=0
--- items:
[{"type":"event","exception":"Error: natural-exit-dev","mechanism":"generic","handled":true,"sdk":"sentry.javascript.deno","runtime":"deno","hasContextLine":true,"trace_id":"25d9cd3f91834cd9929b0323ffbded54","environment":"production"},{"type":"event","exception":"Error: flush-exit-dev","mechanism":"generic","handled":true,"sdk":"sentry.javascript.deno","runtime":"deno","hasContextLine":true,"trace_id":"7a049ba0002f4c979ceb8d9ccdcea0c9","environment":"production"}]
```

**Matches the recorded verdict.** All three outcomes reproduce on deno 2.9.0: natural exit
delivers, three consecutive `Deno.exit(0)` runs deliver nothing (no `deno-exit-dev` item ever
appears), and the flush variant resolves `true` and delivers.

Two differences, neither behavioral:

- The CI-pinned deno 2.8.3 binary (`$SCRATCH/deno283/deno`) no longer exists in the scratchpad, so the
  2.8.3 cross-check recorded in the original run could not be repeated. Only 2.9.0 was exercised.
- The sink's compact mapping has changed since the record was written: `exception` now carries the
  `Error: ` prefix, `runtime` is the string `"deno"` instead of `{"name":"deno","version":"2.9.0"}`,
  and `trace_id`/`environment` are new fields. The event identity and the presence/absence pattern
  are unaffected.
