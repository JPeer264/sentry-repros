# B02 - Enrichment on Bun events

Runtime: bun 1.4.0 | SDK: `@sentry/bun` 10.67.0 (develop line, tarballs in `_toolbox/pack/`)

## What it reproduces

A plain `bun probe.ts` script (no server) initialises `@sentry/bun` against a local envelope sink,
sets every scope enrichment the SDK offers (`setUser`, `setTag`, `setContext`, `setExtra`,
`addBreadcrumb`), writes one `console.log`, then captures an `Error` thrown two frames deep and a
`captureMessage("sentinel")` sentinel before flushing. The point is to check that all of that
enrichment, plus the automatic console breadcrumb, the runtime/os/server_name contexts and full
`in_app` stack frames with source context, actually survive onto the event envelope on Bun.

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

Run it from this directory. `bun add` of the same tarballs fails with
`error: No version matching "10.67.0" found for specifier "@sentry/server-runtime-injection"`;
install with npm and run with bun.

## Run

From this directory:

```
PORT=41733 RAW=$PWD/raw.log node sink.mjs > sink.log 2>&1 & spid=$!
sleep 1
SINK_PORT=41733 bun probe.ts
for i in $(seq 1 20); do out=$(curl -s http://127.0.0.1:41733/__items); echo "$out" | grep -q sentinel && break; sleep 0.5; done
echo "$out" > items.json
kill $spid; wait $spid
python3 -m json.tool items.json
```

`sink.mjs` is `_toolbox/qs/sink.mjs` extended to keep `user`, `tags`, non-default `contexts`,
`extra`, `breadcrumbs`, `os`, `server_name` and per-frame `filename`/`in_app`/`context_line`/
pre+post context; `RAW=<file>` also appends the raw envelope bodies.

## Expected

Recorded verdict: **works**.

All enrichment (user, tag, context, extra, manual breadcrumb) and the console breadcrumb from
`console.log` arrive on the captured exception event; both stack frames are `in_app` with
`context_line` plus pre/post context; `contexts.runtime` is `{name: bun, version: 1.4.0}`,
`contexts.os` is populated (macOS 15.7.7, kernel 24.6.0) and `server_name` is set. Sentinel arrived
after the exception event.

Recorded evidence lines:

```
{"type":"event","exception":"B02 enrichment error","mechanism":"generic","handled":true,"sdk":"sentry.javascript.bun","sdkVersion":"10.67.0",
 "runtime":{"name":"bun","version":"1.4.0"},
 "os":{"kernel_version":"24.6.0","name":"macOS","version":"15.7.7","build":"24G720"},
 "server_name":"DJ90J9R5XC.local",
 "user":{"id":"u-42","email":"probe@example.com","username":"probe"},
 "tags":{"probe":"B02"},
 "contexts":{"order":{"id":"ord-7","total":12.5}},
 "contextKeys":["trace","order","runtime","app","os","device","culture","cloud_resource"],
 "extra":{"attempt":3},
 "breadcrumbs":[{"category":"manual","message":"manual breadcrumb","level":"info","data":{"step":1}},{"category":"console","message":"console log before captureException","level":"log","data":{"arguments":["console log before captureException"],"logger":"console"}}],
 "frames":[{"filename":".../deep/B02/develop/probe.ts","in_app":true,"function":"?","lineno":22,"colno":3,"context_line":"  innerThrow();","hasPre":true,"hasPost":true},{"filename":".../deep/B02/develop/probe.ts","in_app":true,"function":"innerThrow","lineno":18,"colno":13,"context_line":"  throw new Error(\"B02 enrichment error\");","hasPre":true,"hasPost":true}]}
{"type":"event","message":"sentinel","exception":"sentinel","mechanism":"generic","handled":true, ... "frames":[{"filename":".../develop/probe.ts","in_app":true,"lineno":26,"context_line":"Sentry.captureMessage(\"sentinel\");","hasPre":true,"hasPost":true}]}
```

Recorded side note: on develop `captureMessage` produces a synthetic exception with a stack trace
and context lines (`mechanism {type: generic, handled: true, synthetic: true}`), because develop
defaults `attachStacktrace` to true.

## Observed on 2026-09-07

Matches the recorded verdict. `items.json` (full output in this directory), trimmed:

```
{"type":"event","exception":"B02 enrichment error","mechanism":"generic","handled":true,
 "sdk":"sentry.javascript.bun","sdkVersion":"10.67.0",
 "runtime":{"name":"bun","version":"1.4.0"},
 "os":{"kernel_version":"24.6.0","name":"macOS","version":"15.7.7","build":"24G720"},
 "server_name":"DJ90J9R5XC.local",
 "user":{"id":"u-42","email":"probe@example.com","username":"probe"},
 "tags":{"probe":"B02"},
 "contexts":{"order":{"id":"ord-7","total":12.5}},
 "contextKeys":["trace","order","runtime","app","os","device","culture","cloud_resource"],
 "extra":{"attempt":3},
 "breadcrumbs":[{"category":"manual","message":"manual breadcrumb","level":"info","data":{"step":1}},
                {"category":"console","message":"console log before captureException","level":"log","data":{"arguments":["console log before captureException"],"logger":"console"}}],
 "frames":[{"filename":"$REPRO/probes/B02/probe.ts","in_app":true,"function":"?","lineno":22,"colno":3,"context_line":"  innerThrow();","hasPre":true,"hasPost":true},
           {"filename":"$REPRO/probes/B02/probe.ts","in_app":true,"function":"innerThrow","lineno":18,"colno":13,"context_line":"  throw new Error(\"B02 enrichment error\");","hasPre":true,"hasPost":true}]}
{"type":"event","message":"sentinel","exception":"sentinel","mechanism":"generic","handled":true,"synthetic":true,
 "sdk":"sentry.javascript.bun","sdkVersion":"10.67.0",
 "frames":[{"filename":"$REPRO/probes/B02/probe.ts","in_app":true,"function":"?","lineno":26,"colno":8,"context_line":"Sentry.captureMessage(\"sentinel\");","hasPre":true,"hasPost":true}]}
```

Every recorded field matches, including the frame line/column numbers (22:3 and 18:13) and the
synthetic sentinel stack trace. The only differences are the `filename` paths (this directory
instead of the original scratchpad `deep/B02/develop/`) and the install command: the record's
`bun add` of the tarballs is reported as having installed `node_modules` despite its resolver
error, but here it installed nothing, so npm was used as the toolbox prescribes.

## Files

- `probe.ts` - the probe (line numbers matter: they appear in the evidence)
- `sink.mjs` - extended envelope sink
- `items.json` - compacted sink output from the run above
- `raw2.log` - raw envelope bodies from the same run (`raw.log`/`sink.log` are from a first run
  whose sink crashed while mapping breadcrumbs; the mapping is fixed in `sink.mjs`)
