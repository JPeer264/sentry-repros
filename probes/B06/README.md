# B06 — Metrics on Bun

## What it reproduces

`Sentry.metrics.count/gauge/distribution` on `@sentry/bun` 10.67.0 (the `develop` tarballs, v11 line)
running under plain `bun app.ts` with no bundler. The probe initializes the SDK with a `tunnel`
pointing at a local envelope sink, emits one counter, one gauge (unit `millisecond`) and one
distribution (unit `second`), each with a custom `route` attribute, waits out the ~5s metric flush
timer and prints what the sink received. No option is needed to turn metrics on: `develop` has no
`enableMetrics` option and `_INTERNAL_captureMetric` in
`node_modules/@sentry/core/build/cjs/metrics/internal.js` captures unconditionally.

## Install

```
npm install \
  $REPRO/_toolbox/pack/sentry-bun-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-node-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz
```

(`bun add` of these tarballs fails on the transitive `@sentry/server-runtime-injection@10.67.0`
specifier; install with npm and run with bun.)

## Run

From this directory, in one shell:

```
PORT=47291 node sink.mjs > sink.log 2>&1 & sp=$!
SINK_PORT=47291 bun app.ts          # prints SINK: [...] after its own 7s wait
kill $sp; wait $sp
```

`sink.mjs` is the toolbox sink plus a `trace_metric` branch that renders each metric as
`"<type> <name>=<value> [unit] attrs={...}"`, dropping the default `sentry.*` / `server.*`
attributes. `curl -s http://127.0.0.1:47291/__items` shows the same list while the sink runs.

## Expected

Recorded verdict: **works**.

Recorded evidence:

```
app.log (bun 1.4.0):
SDK 10.67.0 bun 1.4.0 metrics keys: count,distribution,gauge
SINK: [{"type":"trace_metric","items":["counter probe.count=1 attrs={\"route\":\"/x\"}","gauge probe.gauge=42 millisecond attrs={\"route\":\"/x\"}","distribution probe.distribution=3.5 second attrs={\"route\":\"/x\"}"]}]

app1314.log (bun 1.3.14):
SDK 10.67.0 bun 1.3.14 metrics keys: count,distribution,gauge
SINK: [{"type":"trace_metric","items":["counter probe.count=1 attrs={\"route\":\"/x\"}","gauge probe.gauge=42 millisecond attrs={\"route\":\"/x\"}","distribution probe.distribution=3.5 second attrs={\"route\":\"/x\"}"]}]
```

All three metrics arrive in a single `trace_metric` envelope, with unit and the custom `route`
attribute preserved. Note the envelope metric type for `metrics.count` is `counter`, not `count`.

## Observed on 2026-09-07

Bun 1.4.0, `SINK_PORT=47291 bun app.ts`:

```
SDK 10.67.0 bun 1.4.0 metrics keys: count,distribution,gauge
SINK: [{"type":"trace_metric","items":["counter probe.count=1 attrs={\"route\":\"/x\"}","gauge probe.gauge=42 millisecond attrs={\"route\":\"/x\"}","distribution probe.distribution=3.5 second attrs={\"route\":\"/x\"}"]}]
```

Matches the recorded verdict and the recorded `app.log` evidence byte for byte.

Not re-run: the CI-pinned Bun 1.3.14 half. The binary the record used
(`$S/bun1314/bun-darwin-aarch64/bun`) no longer exists in the scratchpad and is not mirrored in
`_toolbox/`, so only the Bun 1.4.0 line could be reproduced. To re-run it, drop a 1.3.14 bun binary
somewhere and use `SINK_PORT=33417 <path>/bun app.ts` against a sink on `PORT=33417`.

One deviation from the record's rationale, not its verdict: the record cites
`metrics/internal.js:88` resolving `enableMetrics ?? _experiments?.enableMetrics ?? true`. In the
10.67.0 build actually installed here there is no `enableMetrics` string anywhere in
`@sentry/core/build/cjs`; metrics are captured with no gate at all, which is a stronger form of the
same "on by default" conclusion.
