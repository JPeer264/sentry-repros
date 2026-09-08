# N6 - The optional integrations the docs list for all three runtimes

Runtime: bun 1.4.0 (app), plus an export-surface check over `@sentry/deno` and `@sentry/cloudflare`
SDK: `@sentry/bun` 10.67.0 (develop line, tarballs in `_toolbox/pack/`)

## What it reproduces

A `Bun.serve` app initialises `@sentry/bun` against a local envelope sink with all six optional
integrations the docs list for Bun, Deno and Cloudflare enabled explicitly in one `Sentry.init`:
`captureConsoleIntegration`, `dedupeIntegration`, `extraErrorDataIntegration`,
`rewriteFramesIntegration`, `contextLinesIntegration({ frameContextLines: 3 })` and
`featureFlagsIntegration`. One request to `/probe` drives the whole sequence: `console.log('crumb')`
-> `fetch` a local echo server -> `addFeatureFlag('my-flag', true)` on the FeatureFlags integration
instance -> `console.error('captured?')` -> throw an `Error` with own properties from `src/boom.ts`
-> `captureException(err)` **twice** -> `captureMessage('sentinel')` -> `await Sentry.flush(4000)`.
The sink keeps breadcrumbs, `extra`, `contexts.Error`, `contexts.flags` and each frame's
filename/pre_context/post_context/context_line, so one read of `/__items` after the sentinel shows
what every integration did. `exports.mjs` then checks which of these integrations are actually
exported by `@sentry/bun`, `@sentry/deno` and `@sentry/cloudflare`.

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

Run it from this directory. Install with npm, run with bun (`bun add` cannot resolve the tarballs'
transitive `@sentry/*@10.67.0` deps).

## Run

From this directory:

```
PORT=52611 RAW=$PWD/raw.ndjson node sink6.mjs > sink.log 2>&1 & spid=$!
PORT=41400 node echo.mjs > echo.log 2>&1 & epid=$!
SINK_PORT=52611 ECHO_PORT=41400 PORT=52612 bun app6.ts > app.log 2>&1 & apid=$!
for i in $(seq 1 60); do curl -s -o /dev/null http://127.0.0.1:52612/ && break; done
curl -s http://127.0.0.1:52612/probe > probe-response.json
for i in $(seq 1 40); do out=$(curl -s http://127.0.0.1:52611/__items); echo "$out" | grep -q sentinel && break; done
echo "$out" > items.json
kill $apid; kill $spid; kill $epid; wait $apid 2>/dev/null; wait $spid 2>/dev/null; wait $epid 2>/dev/null
python3 -m json.tool items.json
```

Export surface (bun from the installed tarball, deno and cloudflare from the worktree build):

```
W=$HOME/dev/sentry-worktrees/audit-runtime-docs
node exports.mjs ./node_modules/@sentry/bun/build/esm/index.js
node exports.mjs $W/packages/deno/build/esm/index.js
node exports.mjs $W/packages/cloudflare/build/esm/prod/index.js
```

## Expected

Recorded verdict: **works**.

All six documented integrations load and work on `@sentry/bun`: `captureConsole` turns
`console.log`/`console.error` into events, `dedupe` drops the second capture of the same `Error`,
`extraErrorData` picks up the own properties, `rewriteFrames` rewrites to `app:///`,
`contextLines({frameContextLines:3})` yields pre_context/post_context of exactly 3, `featureFlags`
lands the flag under `contexts.flags`. Console and fetch breadcrumbs are attached; there is no
`sentry` breadcrumb because `@sentry/bun` has no `breadcrumbsIntegration`. One wording mismatch:
`extraErrorData` writes to `contexts.Error`, not to `extra`. Bun also exports
`launchDarkly`/`openFeature`/`statsig`/`unleash` integrations even though the docs list all four as
`notSupported` for `javascript.bun`.

Recorded evidence lines:

```
probe response: {"flagIntegration":true,"addFeatureFlagOnIntegration":"function","sentryAddFeatureFlag":"undefined","integrations":[... "ContextLines", ... "CaptureConsole","Dedupe","ExtraErrorData","RewriteFrames","FeatureFlags","SpanStreaming"]}

sink, 4 events total (crumb, captured?, nested boom ONCE, sentinel):
EVENT msg= crumb exc= crumb   extra= {"arguments":["crumb"]}  flags= null
  crumbs= ["-|console|crumb|"]
EVENT msg= captured? exc= captured?  flags= {"values":[{"flag":"my-flag","result":true}]}
  crumbs= ["-|console|crumb|","http|fetch||http://127.0.0.1:41400/echo-endpoint","-|console|captured?|"]
EVENT exc= nested boom
  frames= [{"filename":"app:///bunserver.js","pre":3,"post":3,...},{"filename":"app:///app6.ts","pre":3,"post":3,"ctx":"    try { boom(); } catch (e) { err = e; }"},{"filename":"app:///boom.ts","pre":3,"post":3,"ctx":"  const e = new Error(\"nested boom\") as Error & Record<string, unknown>;"}]
  flags= {"values":[{"flag":"my-flag","result":true}]}
  crumbs= ["-|console|crumb|","http|fetch||http://127.0.0.1:41400/echo-endpoint","-|console|captured?|"]
raw: contexts.Error= {"detailCode":"N6-detail","payload":{"a":1,"b":[1,2,3]}} extra= undefined
raw breadcrumbs= [{"category":"console","message":"crumb"},{"category":"fetch","data":{"method":"GET","url":"http://127.0.0.1:41400/echo-endpoint","status_code":200},"type":"http"},{"category":"console","level":"error","message":"captured?"}]
(second captureException of the same object produced NO second envelope -> dedupe confirmed; captureException still returned a fresh id: id1=50ce7bc4... id2=dbd2a510...)

export surface, node over packages/bun/build/esm/index.js:
  YES contextLinesIntegration / dedupeIntegration / extraErrorDataIntegration / rewriteFramesIntegration / captureConsoleIntegration / featureFlagsIntegration / launchDarklyIntegration / openFeatureIntegration / statsigIntegration / unleashIntegration
  no  addFeatureFlag (Sentry.addFeatureFlag does not exist; the docs' getIntegrationByName('FeatureFlags').addFeatureFlag path is the only one)
  no  breadcrumbsIntegration
```

Recorded cross-cutting findings this probe also carried: (1) `Sentry.contextLinesIntegration` does
not exist on `@sentry/cloudflare` although a Cloudflare include for it ships; (2)
`extraErrorDataIntegration` writes to `contexts.Error`, not `event.extra`, on every runtime tested;
(3) there is no `Sentry.addFeatureFlag` export on any of the three packages, only the integration
instance method.

## Observed on 2026-09-07

Matches. Verbatim trimmed output of the verification run (ports 52611 sink / 41400 echo / 52612 app,
artifacts `probe-response-rerun.json`, `items-rerun.json`, `raw-rerun.ndjson`, `exports-rerun.log`):

```
probe response: {"flagIntegration":true,"addFeatureFlagOnIntegration":"function","sentryAddFeatureFlag":"undefined","id1":"c47787a1955d4bfea2ad991715ec7cbc","id2":"12533e43afee49e09074f2280b17c2b0","integrations":["EventFilters","FunctionToString","LinkedErrors","RequestData","Console","Http","Fetch","OnUncaughtException","OnUnhandledRejection","ContextLines","Context","Modules","ProcessSession","Express","Fastify","Hapi","Koa","BunServer","BunHttpServer","Graphql","Mongo","Mongoose","Mysql","Mysql2","Redis","Postgres","Prisma","Tedious","GenericPool","Kafka","Amqplib","LruMemoizer","Aws","LangChain","LangGraph","VercelAI","OpenAI","Anthropic_AI","Google_GenAI","PostgresJs","Firebase","CaptureConsole","Dedupe","ExtraErrorData","RewriteFrames","FeatureFlags","SpanStreaming"]}

total items 6 events 4
EVENT msg= crumb exc= crumb  extra= {"arguments": ["crumb"]}  flags= null
  crumbs= ["-|console|crumb|"]
EVENT msg= captured? exc= captured?  extra= {"arguments": ["captured?"]}  flags= {"values": [{"flag": "my-flag", "result": true}]}
  crumbs= ["-|console|crumb|", "http|fetch||http://127.0.0.1:41400/echo-endpoint", "-|console|captured?|"]
EVENT msg= None exc= nested boom  extra=   flags= {"values": [{"flag": "my-flag", "result": true}]}
  crumbs= ["-|console|crumb|", "http|fetch||http://127.0.0.1:41400/echo-endpoint", "-|console|captured?|"]
  frames= [{"filename": "native", "pre": 0, "post": 0}, {"filename": "app:///bunserver.js", "pre": 3, "post": 3, "ctx": "            const response = await target.apply(thisArg, args);"}, {"filename": "app:///app6.ts", "pre": 3, "post": 3, "ctx": "    try { boom(); } catch (e) { err = e; }"}, {"filename": "app:///boom.ts", "pre": 3, "post": 3, "ctx": "  const e = new Error(\"nested boom\") as Error & Record<string, unknown>;"}]
  contexts.Error= {"detailCode": "N6-detail", "payload": {"a": 1, "b": [1, 2, 3]}} extra= None
EVENT msg= sentinel exc= sentinel  extra=   flags= {"values": [{"flag": "my-flag", "result": true}]}
  crumbs= ["-|console|crumb|", "http|fetch||http://127.0.0.1:41400/echo-endpoint", "-|console|captured?|"]

raw breadcrumbs= [{"timestamp": 1788773629.77, "category": "console", "data": {"arguments": ["crumb"], "logger": "console"}, "level": "log", "message": "crumb"}, {"timestamp": 1788773629.787, "category": "fetch", "data": {"method": "GET", "url": "http://127.0.0.1:41400/echo-endpoint", "status_code": 200}, "type": "http"}, {"timestamp": 1788773629.788, "category": "console", "data": {"arguments": ["captured?"], "logger": "console"}, "level": "error", "message": "captured?"}]
raw contexts.Error= {"detailCode": "N6-detail", "payload": {"a": 1, "b": [1, 2, 3]}} extra= None

./node_modules/@sentry/bun/build/esm/index.js
  YES contextLinesIntegration
  YES dedupeIntegration
  YES extraErrorDataIntegration
  YES rewriteFramesIntegration
  YES captureConsoleIntegration
  YES featureFlagsIntegration
  YES launchDarklyIntegration
  YES openFeatureIntegration
  YES statsigIntegration
  YES unleashIntegration
  no  addFeatureFlag
  no  breadcrumbsIntegration
.../packages/deno/build/esm/index.js
  YES contextLinesIntegration
  YES dedupeIntegration
  YES extraErrorDataIntegration
  YES rewriteFramesIntegration
  YES captureConsoleIntegration
  YES featureFlagsIntegration
  no  launchDarklyIntegration
  no  openFeatureIntegration
  no  statsigIntegration
  no  unleashIntegration
  no  addFeatureFlag
  YES breadcrumbsIntegration
.../packages/cloudflare/build/esm/prod/index.js
  no  contextLinesIntegration
  YES dedupeIntegration
  YES extraErrorDataIntegration
  YES rewriteFramesIntegration
  YES captureConsoleIntegration
  YES featureFlagsIntegration
  no  launchDarklyIntegration
  no  openFeatureIntegration
  no  statsigIntegration
  no  unleashIntegration
  no  addFeatureFlag
  no  breadcrumbsIntegration
```

Every recorded claim held. Exactly 4 events reached the sink and `nested boom` is present once, so
`dedupe` dropped the second `captureException` while `captureException` still handed back two
distinct ids (`c47787a1...`, `12533e43...`). `captureConsole` turned both `console.log('crumb')` and
`console.error('captured?')` into events with the call arguments under `extra.arguments`.
`contexts.flags` carries `my-flag` on every event captured after `addFeatureFlag`. Every application
frame is rewritten to `app:///...` and every one of them has `pre`/`post` of exactly 3, matching
`frameContextLines: 3`. The own properties of the thrown error landed in `contexts.Error`, with
`extra` unset on that event, so the "extra data" wording in the docs is wrong here too. Console and
fetch breadcrumbs are attached and there is no `sentry` breadcrumb. The export surface is identical
to the record for bun and confirms both cross-cutting findings: `@sentry/cloudflare` has no
`contextLinesIntegration`, and no package exports `addFeatureFlag`.

Differences, none behavioural:

- The record's app also had a startup `console.log`, which `captureConsole` turned into a fifth
  event; this rebuild drops that log so the sink holds exactly the 4 events the record lists.
- The record's evidence trimmed `frames` and `extra` off the two `captureConsole` events; they are
  present here (synthetic stacks through `captureconsole.js`, and `extra.arguments`). The
  `nested boom` frame list is the same as the record's.
- `@sentry/deno` *does* export `breadcrumbsIntegration` (bun and cloudflare do not). The record only
  ran the export check against bun, so this is added detail rather than a contradiction.
- The Cloudflare export check reads `build/esm/prod/index.js`; that package has no
  `build/esm/index.js`.

`raw.ndjson` holds the raw event payloads of the original probe run; `raw-rerun.ndjson` those of this
verification run.

### Verification re-run, same day

The reproduction was reinstalled from the tarballs and run once more end to end on the same ports
(sink 52611, echo 41400, app 52612); artifacts `probe-response-verify.json`, `items-verify.json`,
`raw-verify.ndjson`, `app-verify.log`. Same result, verbatim:

```
{"flagIntegration":true,"addFeatureFlagOnIntegration":"function","sentryAddFeatureFlag":"undefined","id1":"5359774d4d35400db596fe320008f18d","id2":"36d6e540afa94e3d823665df9390e1ea","integrations":[...,"ContextLines",...,"CaptureConsole","Dedupe","ExtraErrorData","RewriteFrames","FeatureFlags","SpanStreaming"]}

total items 6 events 4
EVENT msg= crumb exc= crumb  extra= {"arguments": ["crumb"]}  flags= null
  crumbs= ["-|console|crumb|"]
EVENT msg= None exc= nested boom  extra=   flags= {"values": [{"flag": "my-flag", "result": true}]}
  crumbs= ["-|console|crumb|", "http|fetch||http://127.0.0.1:41400/echo-endpoint", "-|console|captured?|"]
  frames= [{"filename": "native", "pre": 0, "post": 0}, {"filename": "app:///bunserver.js", "pre": 3, "post": 3, "ctx": "            const response = await target.apply(thisArg, args);"}, {"filename": "app:///app6.ts", "pre": 3, "post": 3, "ctx": "    try { boom(); } catch (e) { err = e; }"}, {"filename": "app:///boom.ts", "pre": 3, "post": 3, "ctx": "  const e = new Error(\"nested boom\") as Error & Record<string, unknown>;"}]
  contexts.Error= {"detailCode": "N6-detail", "payload": {"a": 1, "b": [1, 2, 3]}} extra= None
EVENT msg= captured? exc= captured?  extra= {"arguments": ["captured?"]}  flags= {"values": [{"flag": "my-flag", "result": true}]}
  crumbs= ["-|console|crumb|", "http|fetch||http://127.0.0.1:41400/echo-endpoint", "-|console|captured?|"]
EVENT msg= sentinel exc= sentinel  extra=   flags= {"values": [{"flag": "my-flag", "result": true}]}
  crumbs= ["-|console|crumb|", "http|fetch||http://127.0.0.1:41400/echo-endpoint", "-|console|captured?|"]

raw breadcrumbs= [{"timestamp": 1788774847.102, "category": "console", "data": {"arguments": ["crumb"], "logger": "console"}, "level": "log", "message": "crumb"}, {"timestamp": 1788774847.109, "category": "fetch", "data": {"method": "GET", "url": "http://127.0.0.1:41400/echo-endpoint", "status_code": 200}, "type": "http"}, {"timestamp": 1788774847.109, "category": "console", "data": {"arguments": ["captured?"], "logger": "console"}, "level": "error", "message": "captured?"}]
raw contexts.Error= {"detailCode": "N6-detail", "payload": {"a": 1, "b": [1, 2, 3]}} extra= None

./node_modules/@sentry/bun/build/esm/index.js
  YES contextLinesIntegration / dedupeIntegration / extraErrorDataIntegration / rewriteFramesIntegration
  YES captureConsoleIntegration / featureFlagsIntegration
  YES launchDarklyIntegration / openFeatureIntegration / statsigIntegration / unleashIntegration
  no  addFeatureFlag
  no  breadcrumbsIntegration
.../packages/deno/build/esm/index.js        -> same six, no vendor flag integrations, YES breadcrumbsIntegration
.../packages/cloudflare/build/esm/prod/index.js -> no contextLinesIntegration, the other five YES, no breadcrumbsIntegration
```

Only per-run difference: the sink received `nested boom` before `captured?` this time (the two
`captureConsole` events and the exception race in the transport queue, the set and the counts are
identical), and the two `captureConsole` events carry their synthetic
`captureconsole.js`/`console.js` frames, which the record's evidence trimmed off.

## Files

- `instrument6.ts` - `Sentry.init` with all six documented optional integrations
- `app6.ts` - `Bun.serve` app, `/probe` drives console -> fetch -> flag -> throw -> double capture -> sentinel
- `src/boom.ts` - the throw site, an `Error` carrying own properties
- `echo.mjs` - local echo server the probe fetches, to produce a fetch breadcrumb
- `sink6.mjs` - envelope sink keeping breadcrumbs, `extra`, `contexts.Error`, `contexts.flags` and frame context
- `exports.mjs` - export-surface check over a package's built ESM entry
- `items.json`, `raw.ndjson`, `probe-response.json`, `exports.log` - the original probe run
- `items-rerun.json`, `raw-rerun.ndjson`, `probe-response-rerun.json`, `exports-rerun.log` - the rebuild run
- `items-verify.json`, `raw-verify.ndjson`, `probe-response-verify.json`, `app-verify.log` - the verification re-run
