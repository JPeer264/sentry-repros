# D06 - Metrics on Deno

## What it reproduces

`@sentry/deno` 10.67.0 (built from `develop`, `getsentry/sentry-javascript` at `6f2da7483d`) exposes
`Sentry.metrics` with `count`, `gauge` and `distribution` in a plain Deno script. The probe emits five
metrics (two counters carrying user attributes, a gauge with unit `none`, a distribution with unit
`second`, and a counter recorded inside `Sentry.startSpan`), then reads the local envelope sink after
7 seconds without calling `Sentry.flush()` first. It checks that all five arrive in a single
`trace_metric` envelope with `item_count: 5`, that each item carries name, type, value, unit and the
user attributes plus the SDK-added `server.address`, `sentry.sdk.name`, `sentry.sdk.version` and
`sentry.timestamp.sequence`, and that every metric has a `trace_id` even when captured outside a span.

## Install

```
cd $REPRO/probes/D06 && npm install --no-audit --no-fund
```

(The `@sentry/*` deps are `file:` tarballs in `../../_toolbox/pack/`; `deno.json` has
`nodeModulesDir: "manual"`, so Deno uses that `node_modules` as-is.)

## Run

```
cd $REPRO/probes/D06
PORT=44118 node ./sink.mjs > sink.log 2>&1 & SP=$!
for i in $(seq 1 50); do grep -q "sink listening" sink.log && break; done
SINK_PORT=44118 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main.ts > app.log 2>&1
kill $SP; wait $SP
cat app.log
```

`sink.mjs` is the shared toolbox sink plus a `trace_metric` mapping that renders each item as
`<type> <name>=<value> <unit> attrs={...} trace_id=yes|no`. The probe prints `AFTER_7S` (before any
flush) and `AFTER_FLUSH` (after a `sentinel` message and `Sentry.flush()`), then exits with code 0.

## Expected

Recorded verdict: **works**.

Recorded evidence:

```
SDK_VERSION 10.67.0 metrics keys: count,distribution,gauge
AFTER_7S [{"type":"span"},{"type":"trace_metric","item_count":5,"content_type":"application/vnd.sentry.items.trace-metric+json","items":["counter d06.requests=1 attrs={\"server.address\":\"DJ90J9R5XC.local\",\"runtime\":\"deno\",\"route\":\"/a\",\"sentry.sdk.name\":\"sentry.javascript.deno\",\"sentry.sdk.version\":\"10.67.0\",\"sentry.timestamp.sequence\":0} trace_id=yes","counter d06.requests=2 attrs={...\"route\":\"/b\"...} trace_id=yes","gauge d06.queue_depth=42 none attrs={...\"runtime\":\"deno\"...} trace_id=yes","distribution d06.duration=3.5 second attrs={...\"runtime\":\"deno\"...} trace_id=yes","counter d06.in_span=1 attrs={\"server.address\":\"DJ90J9R5XC.local\",\"sentry.sdk.name\":\"sentry.javascript.deno\",\"sentry.sdk.version\":\"10.67.0\",\"sentry.timestamp.sequence\":3} trace_id=yes"]}]
AFTER_FLUSH [... same trace_metric item ..., {"type":"event","message":"sentinel","exception":"sentinel","sdk":"sentry.javascript.deno"}]
```

## Observed on 2026-09-07

Verbatim from `app.log`, trimmed:

```
SDK_VERSION 10.67.0 metrics keys: count,distribution,gauge
AFTER_7S [{"type":"span","trace_id":"d1c7542addd540c6ae0ec3f0db65c5f3","items":["probe d06-span"],...},{"type":"trace_metric","item_count":5,"content_type":"application/vnd.sentry.items.trace-metric+json","items":["counter d06.requests=1 attrs={\"server.address\":\"DJ90J9R5XC.local\",\"runtime\":\"deno\",\"route\":\"/a\",\"sentry.sdk.name\":\"sentry.javascript.deno\",\"sentry.sdk.version\":\"10.67.0\",\"sentry.timestamp.sequence\":0} trace_id=yes","counter d06.requests=2 attrs={\"server.address\":\"DJ90J9R5XC.local\",\"runtime\":\"deno\",\"route\":\"/b\",\"sentry.sdk.name\":\"sentry.javascript.deno\",\"sentry.sdk.version\":\"10.67.0\",\"sentry.timestamp.sequence\":1} trace_id=yes","gauge d06.queue_depth=42 none attrs={\"server.address\":\"DJ90J9R5XC.local\",\"runtime\":\"deno\",\"sentry.sdk.name\":\"sentry.javascript.deno\",\"sentry.sdk.version\":\"10.67.0\",\"sentry.timestamp.sequence\":2} trace_id=yes","distribution d06.duration=3.5 second attrs={\"server.address\":\"DJ90J9R5XC.local\",\"runtime\":\"deno\",\"sentry.sdk.name\":\"sentry.javascript.deno\",\"sentry.sdk.version\":\"10.67.0\",\"sentry.timestamp.sequence\":3} trace_id=yes","counter d06.in_span=1 attrs={\"server.address\":\"DJ90J9R5XC.local\",\"sentry.sdk.name\":\"sentry.javascript.deno\",\"sentry.sdk.version\":\"10.67.0\",\"sentry.timestamp.sequence\":0} trace_id=yes"]}]
AFTER_FLUSH [... same span and trace_metric items ..., {"type":"event","message":"sentinel","exception":"undefined: sentinel","mechanism":"generic","handled":true,"sdk":"sentry.javascript.deno","runtime":"deno","hasContextLine":true,"trace_id":"d1c7542addd540c6ae0ec3f0db65c5f3","environment":"production"}]
```

Matches the recorded verdict: `works`. Five metrics, one `trace_metric` envelope with `item_count: 5`,
present before any explicit flush, all with attributes and a `trace_id`; the `startSpan` call produced a
`span` (stream lifecycle) envelope, as expected on develop.

Two cosmetic differences from the recorded lines, neither about metric behaviour: the
`sentry.timestamp.sequence` values are per-scope counters and land as 0,1,2,3 on the four
top-level metrics and 0 on the in-span one (the record shows 0,0,1,2,3); and the sink renders the
sentinel event's exception as `undefined: sentinel` because the event has no exception type, where the
record shows the trimmed `sentinel`.
