# N10 - Debug IDs and source maps, verified without a Sentry account

Runtime: Cloudflare Workers (`wrangler dev` 4.129.0 / workerd 1.20260903.1, vite 8.2.2,
`@cloudflare/vite-plugin` 1.54.4), Bun 1.4.0, Deno 2.9.0 | SDK: `@sentry/cloudflare`, `@sentry/bun`,
`@sentry/deno` 10.67.0 (develop line, tarballs in `_toolbox/pack/`)

## What it reproduces

The whole documented "upload a source map so stack traces resolve" flow is exercised on the three
runtimes without a Sentry account, by pointing the SDK at a local envelope sink and reading what the
event actually carries. One app per runtime throws from a nested helper (`deepBoom`) on `GET /error`
and sends a `captureMessage('sentinel')` on `GET /sentinel`; the sink keeps `debug_meta.images` and
the per-frame `abs_path` / `filename` / `lineno` / `colno` / `debug_id` / `context_line` that the
compact toolbox sink drops. The Cloudflare Worker is built two ways (`vite build` with
`cloudflare()` + `sentryCloudflareVitePlugin()` and `build.sourcemap: true`, and plain
`wrangler dev` with `"upload_source_maps": true`), the Bun app two ways (`Bun.build` with
`sentryBunPlugin()`, and `bun build --compile`), the Deno app two ways (`deno run`, and
`deno compile`). A fourth Cloudflare variant is a positive control: the standard `_sentryDebugIds`
snippet is appended to the already-built Worker bundle by hand and a `debug_id` key added to its
`.map`, to separate "the runtime SDK cannot emit debug meta" from "nothing injects a debug ID".

## Install

From this directory, with `package.json` / `package-lock.json` as committed (both already pin the
tarballs by `file:` path):

```
npm install --no-audit --no-fund && (cd deno-pack && npm install --no-audit --no-fund)
```

Equivalently, spelling the tarballs out:

```
npm install --no-audit --no-fund \
  ../../_toolbox/pack/sentry-cloudflare-10.67.0.tgz \
  ../../_toolbox/pack/sentry-bun-10.67.0.tgz \
  ../../_toolbox/pack/sentry-deno-10.67.0.tgz \
  ../../_toolbox/pack/sentry-node-10.67.0.tgz \
  ../../_toolbox/pack/sentry-core-10.67.0.tgz \
  ../../_toolbox/pack/sentry-opentelemetry-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  vite @cloudflare/vite-plugin wrangler@4 @jridgewell/trace-mapping

cd deno-pack && npm install --no-audit --no-fund \
  ../../../_toolbox/pack/sentry-deno-10.67.0.tgz \
  ../../../_toolbox/pack/sentry-core-10.67.0.tgz \
  ../../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  ../../../_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  ../../../_toolbox/pack/sentry-opentelemetry-10.67.0.tgz && cd ..
```

`deno-pack/` needs its own `node_modules` next to its entry: `deno compile` from `deno/`, which
resolves `@sentry/deno` from the parent `node_modules`, fails with
`error: Import "@sentry/deno/import" not a dependency`. `bun/` and `deno/` themselves resolve up into
the root `node_modules` and need no install of their own.

## Run

The sink URL (`http://127.0.0.1:52911/`) is baked into both wrangler configs and defaults in the Bun
and Deno entries; override it with `SINK_URL`. From this directory:

```
PORT=52911 node sink.mjs > sink.log 2>&1 & spid=$!

# 1) Cloudflare, vite build with sourcemap:true + sentryCloudflareVitePlugin()
npx vite build > vite-build.log 2>&1
grep -c '_sentryDebugIds\[' dist/n10_cf/index.js
grep -c '//# debugId' dist/n10_cf/index.js
node -e "const m=JSON.parse(require('fs').readFileSync('dist/n10_cf/index.js.map','utf8'));console.log('map keys=',Object.keys(m).join(','),' debug_id=',m.debug_id)"
npx wrangler dev --config dist/n10_cf/wrangler.json --port 33217 --inspector-port 0 > app-vite.log 2>&1 & apid=$!
for i in $(seq 1 60); do grep -q "Ready on http://localhost:33217" app-vite.log && break; sleep 1; done
node drive.mjs 33217 52911 > result-cf-vite.json 2>&1
node resolve.mjs dist/n10_cf/index.js.map 10029:8 10040:33     # hand-applies the emitted map
kill $apid; wait $apid

# 2) Cloudflare, positive control: hand-injected _sentryDebugIds snippet + debug_id in the .map
node make-control.mjs
npx wrangler dev --config dist-control/wrangler.json --port 33218 --inspector-port 0 > app-control.log 2>&1 & apid=$!
for i in $(seq 1 60); do grep -q "Ready on http://localhost:33218" app-control.log && break; sleep 1; done
node drive.mjs 33218 52911 > result-cf-control.json 2>&1
kill $apid; wait $apid

# 3) Cloudflare, plain wrangler with "upload_source_maps": true
npx wrangler deploy --config wrangler.plain.jsonc --dry-run --outdir=dryrun > dryrun.log 2>&1
grep -c '_sentryDebugIds\[' dryrun/index.js
node -e "const m=JSON.parse(require('fs').readFileSync('dryrun/index.js.map','utf8'));console.log('map keys=',Object.keys(m).join(','),' debug_id=',m.debug_id)"
npx wrangler dev --config wrangler.plain.jsonc --port 33219 --inspector-port 0 > app-plain.log 2>&1 & apid=$!
for i in $(seq 1 90); do grep -q "Ready on http://localhost:33219" app-plain.log && break; sleep 1; done
node drive.mjs 33219 52911 > result-cf-plain.json 2>&1
kill $apid; wait $apid

# 4) Bun, Bun.build with sentryBunPlugin()
(cd bun && bun run build-n10.ts)
tail -c 120 bun/dist-n10/n10.js
grep -c '_sentryDebugIds\[' bun/dist-n10/n10.js
node -e "const m=JSON.parse(require('fs').readFileSync('bun/dist-n10/n10.js.map','utf8'));console.log('map keys=',Object.keys(m).join(','),'| debugId=',m.debugId,'| debug_id=',m.debug_id)"
(cd bun && PORT=44923 MARKER=bun-bundle SINK_URL=http://127.0.0.1:52911/ bun run dist-n10/n10.js > ../app-bun-bundle.log 2>&1 &) ; sleep 3
node drive.mjs 44923 52911 > result-bun-bundle.json 2>&1
# kill the bun pid you captured

# 5) Bun, single-file binary
(cd bun && bun build --compile --target=bun --sourcemap=external --outfile=n10-compiled ./n10.ts)
strings -a bun/n10-compiled | grep -o 'debugId=[0-9A-F]*' | head -3
(cd bun && PORT=44925 MARKER=bun-compiled SINK_URL=http://127.0.0.1:52911/ ./n10-compiled > ../app-bun-compiled.log 2>&1 &) ; sleep 3
node drive.mjs 44925 52911 > result-bun-compiled.json 2>&1

# 6) Deno, deno run
(cd deno && PORT=44927 MARKER=deno-run SINK_URL=http://127.0.0.1:52911/ deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys n10.ts > ../app-deno.log 2>&1 &) ; sleep 5
node drive.mjs 44927 52911 > result-deno-run.json 2>&1

# 7) Deno, deno compile
(cd deno-pack && deno compile --no-check --no-prompt --allow-net --allow-env --allow-read --allow-sys --output n10-bin n10.ts)
(cd deno-pack && PORT=44937 MARKER=deno-compiled SINK_URL=http://127.0.0.1:52911/ ./n10-bin > ../app-deno-compiled.log 2>&1 &) ; sleep 6
node drive.mjs 44937 52911 > result-deno-compiled.json 2>&1

kill $spid; wait $spid
```

`drive.mjs <appPort> <sinkPort>` clears the sink, calls `/error`, then `/sentinel`, polls the sink
until the sentinel event has arrived and prints every sink item as one JSON line each. `sink.mjs` is
`_toolbox/qs/sink.mjs` with the event mapping extended to keep `debug_meta.images` and, per stack
frame, `fn` / `abs_path` / `filename` / `module` / `lineno` / `colno` / `in_app` / `debug_id` /
`context_line`.

The claim about the shipped plugins is a source-level grep, not a runtime observation:

```
grep -rEn "debug.?[Ii]d|debugId|sentry-debug-id|debug_id" \
  ~/dev/sentry-worktrees/audit-runtime-docs/packages/cloudflare/src/vite/
grep -rEn "debug.?[Ii]d|debugId|sentry-debug-id|debug_id" \
  ~/dev/sentry-worktrees/audit-runtime-docs/packages/bun/src/plugin.ts
```

## Expected

Recorded verdict: **partial**.

No debug ID is produced anywhere in the documented flow on any of the three runtimes:
`sentryCloudflareVitePlugin()` and `sentryBunPlugin()` contain no debug-ID code at all, the emitted
`.map` has no `debug_id` key, the bundle has no `_sentryDebugIds` registration snippet, and every
runtime event arrives with `debug_meta.images: []` and no `debug_id` on any frame. The runtime half
of the SDK is fine: hand-injecting the standard `_sentryDebugIds` snippet into the built Worker
bundle makes the very next event carry a matching `debug_meta` image, so the missing piece is purely
injection. The consequence differs per runtime. Cloudflare is the broken case: frames point at the
built bundle with no `context_line` (workerd has no filesystem), so without a debug ID the wizard
flow has to fall back to release + path matching. Bun and Deno are effectively unaffected: their
runtimes already resolve frames to the original sources with `context_line` populated, even from a
`bun build --compile` / `deno compile` single-file binary, so uploading a source map for the bundle
would have nothing to match against. The `.map` Vite emits is correct; applying it by hand resolves
the top frame exactly.

Recorded evidence lines:

```
CLOUDFLARE, vite build with sourcemap:true + sentryCloudflareVitePlugin()
  $ grep -c "_sentryDebugIds\[" dist/qs_cloudflare/index.js        -> 0
  $ grep -c "//# debugId" dist/qs_cloudflare/index.js              -> 0
  $ node -e JSON.parse(index.js.map) -> keys= version,file,sources,sourcesContent,names,mappings,x_google_ignoreList
                                        debug_id= ABSENT
sink (GET /error, then /sentinel):
 {"type":"event","exception":"nested boom cf-vite","sdk":"sentry.javascript.cloudflare",
  "debug_meta_images":[],
  "frames":[ ... {"fn":"deepBoom",
     "abs_path":".../deep/N10/develop/cf-vite/dist/qs_cloudflare/index.js",
     "filename":".../deep/N10/develop/cf-vite/dist/qs_cloudflare/index.js",
     "lineno":11569,"colno":9,"in_app":true}]}
(no debug_id key on any frame, no context_line on any frame)
map applied by hand (@jridgewell/trace-mapping):
  11569:9 -> ../../src/boom.ts:2:8
  11580:38 -> ../../src/index.ts:13:37

POSITIVE CONTROL, same bundle with the standard snippet appended by hand
(e._sentryDebugIds[n]="1234abcd-0000-4000-8000-0000deadbeef" + //# debugId= + debug_id added to the .map):
 {"ex":"nested boom cf-vite",
  "images":[{"type":"sourcemap",
    "code_file":".../dist/qs_cloudflare/index.js",
    "debug_id":"1234abcd-0000-4000-8000-0000deadbeef"}],
  "top":[{"fn":"deepBoom","lineno":11569,"colno":9}]}
=> the SDK emits debug_meta correctly once something registers the global; nothing in the shipped plugins does.

CLOUDFLARE, plain `npx wrangler dev` with "upload_source_maps": true
  $ npx wrangler deploy --dry-run --outdir=dryrun -> dryrun/index.js + dryrun/index.js.map
  $ grep -c "_sentryDebugIds\[" dryrun/index.js  -> 0
  $ grep -c "//# debugId" dryrun/index.js        -> 0
  map keys= version,sources,sourceRoot,sourcesContent,mappings,names   debug_id= ABSENT
sink:
 {"ex":"nested boom cf-plain2","images":[],
  "top":[{"fn":"deepBoom",
    "abs_path":".../cf-plain2/.wrangler/tmp/dev-8tE7j7/index.js",
    "lineno":14228,"colno":9,"in_app":true}]}

BUN, Bun.build({target:"bun", sourcemap:"external", plugins:[sentryBunPlugin()]})
  bundle tail: //# debugId=47B8537C6EBB510364756E2164756E21   (Bun's own id, NOT a hyphenated UUID;
  and no sourceMappingURL comment at all with sourcemap:"external")
  $ grep -c "_sentryDebugIds\[" dist-n10/n10.js -> 0
  map keys= version,sources,sourcesContent,mappings,debugId,names | debugId= 47B8537C6EBB510364756E2164756E21 | debug_id= ABSENT
sink (bun run dist-n10/n10.js):
 {"ex":"nested boom bun-bundle","images":[],
  "top":[{"fn":"fetch","filename":".../develop/bun/n10.ts","lineno":9,"colno":36,"in_app":true,
          "ctx":"    if (url.pathname === \"/error\") deepBoom(process.env.MARK"},
         {"fn":"deepBoom","filename":".../develop/bun/lib/boom.ts","lineno":2,"colno":13,"in_app":true,
          "ctx":"  throw new Error(`nested boom ${marker}`);"}]}
=> already original-source, no upload needed; nothing for a debug ID to match.

DENO: frames resolve to app:///lib/boom.ts:2:9 with context_line populated, images [].

SOURCE GREP on develop:
  grep -rn "debug.?[Ii]d|debugId|sentry-debug-id|debug_id" over
    packages/cloudflare/src/vite/  -> 0 hits
    packages/bun/src/plugin.ts     -> 0 hits
```

## Observed on 2026-09-07

Matches the recorded verdict (**partial**) in every part, including the positive control and the
source grep. Verbatim trimmed output of the run above (full sink dumps in `result-*.json`):

```
[1] CLOUDFLARE, vite build (build.sourcemap:true + sentryCloudflareVitePlugin()), wrangler dev on dist/n10_cf
$ grep -c '_sentryDebugIds\[' dist/n10_cf/index.js   -> 0
$ grep -c '//# debugId' dist/n10_cf/index.js         -> 0
$ map keys= version,file,names,sources,sourcesContent,x_google_ignoreList,mappings  debug_id= undefined  debugId= undefined
$ tail of dist/n10_cf/index.js:
    export { worker_entry_default as default };
    //# sourceMappingURL=index.js.map
sink:
{"type":"event","exception":"Error: nested boom cf-vite","mechanism":"auto.http.cloudflare","handled":false,"sdk":"sentry.javascript.cloudflare","runtime":"cloudflare","hasContextLine":false,"release":"n10-cf","debug_meta_images":[],"frames":[ ... {"fn":"Object.fetch","abs_path":"$REPRO/probes/N10/dist/n10_cf/index.js","filename":"$REPRO/probes/N10/dist/n10_cf/index.js","module":"index","lineno":10040,"colno":33,"in_app":true},{"fn":"deepBoom","abs_path":"$REPRO/probes/N10/dist/n10_cf/index.js","filename":"$REPRO/probes/N10/dist/n10_cf/index.js","module":"index","lineno":10029,"colno":8,"in_app":true}]}
(no debug_id key on any frame, no context_line on any frame; the sentinel event is identical in shape)
$ node resolve.mjs dist/n10_cf/index.js.map 10029:8 10040:33
10029:8 -> ../../src/boom.ts:2:8
10040:33 -> ../../src/index.ts:19:37

[2] POSITIVE CONTROL, same bundle + hand-appended snippet, wrangler dev on dist-control
$ grep -c '_sentryDebugIds\[' dist-control/index.js  -> 1
$ grep -c '//# debugId' dist-control/index.js        -> 1
sink:
{"ex": "Error: nested boom cf-control", "images": [{"type": "sourcemap", "code_file": "$REPRO/probes/N10/dist-control/index.js", "debug_id": "1234abcd-0000-4000-8000-0000deadbeef"}], "top": [{"fn": "deepBoom", "lineno": 10029, "colno": 8}]}
{"ex": "undefined: sentinel", "images": [{"type": "sourcemap", "code_file": "$REPRO/probes/N10/dist-control/index.js", "debug_id": "1234abcd-0000-4000-8000-0000deadbeef"}], "top": [{"fn": "Object.fetch", "lineno": 10042, "colno": 3}]}

[3] CLOUDFLARE, plain wrangler dev with "upload_source_maps": true
$ npx wrangler deploy --config wrangler.plain.jsonc --dry-run --outdir=dryrun -> dryrun/index.js (487319 B) + dryrun/index.js.map (2493080 B)
$ grep -c '_sentryDebugIds\[' dryrun/index.js  -> 0
$ grep -c '//# debugId' dryrun/index.js        -> 0
$ map keys= version,sources,sourceRoot,sourcesContent,mappings,names  debug_id= undefined
sink:
{"ex": "Error: nested boom cf-plain", "images": [], "top": [{"fn": "deepBoom", "abs_path": "$REPRO/probes/N10/.wrangler/tmp/dev-lOvFhz/index.js", "lineno": 14228, "colno": 9, "in_app": true, "ctx": null}]}

[4] BUN, Bun.build({target:"bun", sourcemap:"external", plugins:[sentryBunPlugin()]})
$ tail of bun/dist-n10/n10.js:
    });

    //# debugId=6B3F09FDC1EF8ED764756E2164756E21
$ grep -c '_sentryDebugIds\[' bun/dist-n10/n10.js  -> 0
$ grep -c 'sourceMappingURL' bun/dist-n10/n10.js   -> 0
$ map keys= version,sources,sourcesContent,mappings,debugId,names | debugId= 6B3F09FDC1EF8ED764756E2164756E21 | debug_id= undefined
sink (bun run dist-n10/n10.js):
{"ex": "Error: nested boom bun-bundle", "images": [], "top": [{"fn": "fetch", "filename": "$REPRO/probes/N10/bun/n10.ts", "lineno": 9, "colno": 36, "in_app": true, "ctx": "    if (url.pathname === '/error') deepBoom(process.env.MARKER ?? 'bun');"}, {"fn": "deepBoom", "filename": "$REPRO/probes/N10/bun/lib/boom.ts", "lineno": 2, "colno": 13, "in_app": true, "ctx": "  throw new Error(`nested boom ${marker}`);"}]}

[5] BUN, bun build --compile --target=bun --sourcemap=external
$ strings -a bun/n10-compiled | grep -o 'debugId=[0-9A-F]*'
debugId=
debugId=3BC2107EC3CCBF9D64756E2164756E21
sink:
{"ex": "Error: nested boom bun-compiled", "images": [], "top": [{"fn": "fetch", "filename": "n10.ts", "lineno": 9, "colno": 36, "in_app": false, "ctx": "    if (url.pathname === '/error') deepBoom(process.env.MARKER ?? 'bun');"}, {"fn": "deepBoom", "filename": "lib/boom.ts", "lineno": 2, "colno": 13, "in_app": false, "ctx": "  throw new Error(`nested boom ${marker}`);"}]}

[6] DENO, deno run
{"ex": "Error: nested boom deno-run", "images": [], "top": [{"fn": "?", "filename": "app:///n10.ts", "lineno": 14, "colno": 34, "in_app": true, "ctx": "  if (url.pathname === '/error') deepBoom(Deno.env.get('MARKER') ?? 'deno');"}, {"fn": "deepBoom", "filename": "app:///lib/boom.ts", "lineno": 2, "colno": 9, "in_app": true, "ctx": "  throw new Error(`nested boom ${marker}`);"}]}

[7] DENO, deno compile
{"ex": "Error: nested boom deno-compiled", "images": [], "top": [{"fn": "?", "filename": "/var/folders/.../T/deno-compile-n10-bin/n10.ts", "lineno": 14, "colno": 34, "in_app": true, "ctx": "  if (url.pathname === '/error') deepBoom(Deno.env.get('MARKER') ?? 'deno');"}, {"fn": "deepBoom", "filename": "/var/folders/.../T/deno-compile-n10-bin/lib/boom.ts", "lineno": 2, "colno": 9, "in_app": true, "ctx": "  throw new Error(`nested boom ${marker}`);"}]}

[8] SOURCE GREP on develop (~/dev/sentry-worktrees/audit-runtime-docs)
packages/cloudflare/src/vite/  -> 0 hits   (files: agentClass.ts autoInstrument.ts index.ts instrumentFile.ts moduleShape.ts transform.ts workerEntrypoint.ts wranglerConfig.ts)
packages/bun/src/plugin.ts     -> 0 hits   (its whole body is
  export { sentryOrchestrionPlugin as sentryBunPlugin } from '@sentry/server-utils/orchestrion/bun';)
```

Differences from the record, none of which change the verdict:

- Bundle line numbers and the emitted Bun/`.map` debug ids differ, as they must: this app is not the
  `qs` template. Cloudflare vite: `deepBoom` at `10029:8` here vs `11569:9` in the record, and the
  hand-applied map resolves it to the same `../../src/boom.ts:2:8`. Bun's own `debugId` is
  `6B3F09FDC1EF8ED764756E2164756E21` here vs `47B8537C6EBB510364756E2164756E21`, and the compiled
  binary's is `3BC2107EC3CCBF9D64756E2164756E21`; in both runs it is 32 hex characters ending in
  `64756E2164756E21`, not a hyphenated UUID. The plain-wrangler frame lands on exactly the recorded
  `14228:9`.
- The record's Cloudflare vite `.map` key order is `version,file,sources,sourcesContent,names,mappings,x_google_ignoreList`;
  vite 8.2.2 emits the same seven keys in the order `version,file,names,sources,sourcesContent,x_google_ignoreList,mappings`.
  `debug_id` is absent in both.
- `deno compile` had to be run from `deno-pack/`, which carries its own `node_modules`; running it
  from `deno/` (which resolves the SDK from the parent `node_modules`) fails with
  `error: Import "@sentry/deno/import" not a dependency`. The record's file list already had a
  separate `deno-pack/`, so this is presumably the same reason.
- The positive control only works when the snippet starts on its own line. The vite bundle ends with
  `//# sourceMappingURL=index.js.map` and no trailing newline, so a snippet appended directly lands
  inside that line comment and never runs; `make-control.mjs` prepends a newline. The first attempt
  without it reported `"images": []`, which is a trap worth knowing when reproducing this by hand.
- Ports 33217 / 33218 / 33219 / 44923 / 44925 / 44927 / 44937 and sink 52911, as in the record.

## Files

- `src/index.ts`, `src/boom.ts` - the Cloudflare Worker (`withSentry`, `tunnel` from the `SINK_URL`
  var, `/error` throws through `deepBoom`, `/sentinel` captures the sentinel)
- `vite.config.ts` - `cloudflare()` + `sentryCloudflareVitePlugin()`, `build.sourcemap: true`
- `wrangler.jsonc` - `n10_cf`, input config for the vite build
- `wrangler.plain.jsonc` - `n10_cf_plain`, `"upload_source_maps": true`, no vite
- `make-control.mjs` - writes `dist-control/` from `dist/n10_cf/`: bundle + newline + standard
  `_sentryDebugIds` snippet and `//# debugId=`, `.map` + `debug_id`, wrangler config renamed
- `resolve.mjs` - applies a `.map` to `line:column` pairs with `@jridgewell/trace-mapping`
- `bun/n10.ts`, `bun/instrument.ts`, `bun/lib/boom.ts`, `bun/build-n10.ts` - the Bun app and its
  `Bun.build` script with `sentryBunPlugin()`
- `deno/n10.ts`, `deno/lib/boom.ts`, `deno/deno.json` - the Deno app for `deno run`
- `deno-pack/` - the same Deno app with its own `package.json` / `node_modules`, for `deno compile`
- `sink.mjs` - envelope sink, event mapping extended with `debug_meta_images` and per-frame detail
- `drive.mjs` - clears the sink, calls `/error` and `/sentinel`, polls for the sentinel, prints the sink
- `dist/n10_cf/`, `dist-control/`, `dryrun/` - the three Cloudflare build outputs of the run above
  (kept: they carry the greps in the evidence), `bun/dist-n10/` likewise for Bun
- `bun/n10-compiled`, `bun/n10.js.map`, `deno/n10-bin`, `deno-pack/n10-bin` - truncated to 0 bytes
  after the run (65-103 MB each); step 5 and step 7 above rebuild them
- `result-*.json`, `app-*.log`, `sink.log`, `vite-build.log`, `dryrun.log` - output of the run above
