# N3 - Cloudflare Vite plugin: `autoInstrumentation`, option names and defaults

Runtime: Cloudflare Workers (`wrangler dev` 4.129.0 / workerd 1.20260903.1, vite 8.2.2,
`@cloudflare/vite-plugin` 1.54.4) | SDK: `@sentry/cloudflare` 10.67.0 (develop line, tarballs in
`_toolbox/pack/`) | `mysql` 2.18.1 against the MariaDB on `127.0.0.1:3307` (db `app`, table `users`)

## What it reproduces

A Cloudflare Worker whose entry (`src/worker/index.ts`) contains no `Sentry.*` call and no import of
`@sentry/cloudflare` at all: a plain `export default { fetch }` plus a Durable Object `Counter`, a
Workflow `MyWorkflow` and a self-bound `WorkerEntrypoint` `Api`, all three bound in `wrangler.jsonc`,
and a module-scope `mysql` connection. Options live in the conventional `src/worker/instrument.server.ts`
next to the entry. The same source is built five ways to pin down what the Vite plugin's options are
called and what they default to: `sentryCloudflareVitePlugin()` with no options (devA),
`{ autoInstrumentation: false }` (devB), `{ buildTimeInstrumentation: false }` (devC), a non-default
wrangler config name passed to both plugins (devD, entry `src/worker2/index.ts` which only re-exports
its Durable Object), the same config passed only to `cloudflare()` (devE), and the option names the
docs page documents, `_experimental.autoInstrumentation` / `_experimental.useDiagnosticsChannelInjection`
(devF, `vite.experimental.config.ts` plus the `tsc` check in `tscheck.experimental.ts`). Routes are
`/db`, `/do` (DO RPC), `/rpc` (WorkerEntrypoint RPC), `/injected` (the `__SENTRY_ORCHESTRION__` marker),
`/error` and `/sentinel`.

## Install

From this directory:

```
npm install --no-audit --no-fund \
  ../../_toolbox/pack/sentry-cloudflare-10.67.0.tgz \
  ../../_toolbox/pack/sentry-core-10.67.0.tgz \
  ../../_toolbox/pack/sentry-opentelemetry-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  mysql@2.18.1 vite @cloudflare/vite-plugin wrangler@4 @cloudflare/workers-types typescript
```

## Run

The sink URL (`http://127.0.0.1:53821/`) is baked into `wrangler.jsonc` and `wrangler.agent.jsonc` as
the `SINK_URL` var; change it in both if the port is taken. From this directory:

```
PORT=53821 node sink2.mjs > sink2.log 2>&1 & spid=$!

./run.sh "$PWD" n3_dev   44320 devA vite.config.ts                # sentryCloudflareVitePlugin()
./run.sh "$PWD" n3_dev   44321 devB vite.noauto.config.ts         # { autoInstrumentation: false }
./run.sh "$PWD" n3_dev   44322 devC vite.nobuildtime.config.ts    # { buildTimeInstrumentation: false }
./run.sh "$PWD" n3_agent 44323 devD vite.agent.config.ts          # configPath + wranglerConfigPath

npx vite build --config vite.agent-nopath.config.ts               # devE, build only
npx vite build --config vite.experimental.config.ts               # devF, build only
npx tsc --noEmit --ignoreConfig --strict --module es2022 --moduleResolution bundler \
        --skipLibCheck tscheck.experimental.ts

kill $spid; wait $spid
```

`run.sh` builds the variant, greps the bundle for the injected wrappers, boots
`npx wrangler dev --config dist/<worker>/wrangler.json --port <port> --inspector-port 0`, curls the
routes and dumps the sink into `out-<label>.sink.json`. `/db` is hit first on purpose: a module-scope
`mysql` connection in workerd is bound to the first request's I/O context, so only the first `/db` of a
fresh isolate answers and every later one hangs until the runtime cancels it.

## Expected

Recorded verdict: **broken** (the SDK does what the develop JSDoc says, and the docs page describes a
different API).

Recorded evidence:

```
variant devA - vite.config.ts = `sentryCloudflareVitePlugin()` (no options), entry is a plain
`export default { async fetch(...) }`:
bundle grep (dist/n3_dev/index.js):
  withSentry(                              3
  instrumentDurableObjectWithSentry        2
  instrumentWorkflowWithSentry             2
  rpcTracePropagationBindings              2
injected into the bundle:
  const __SENTRY_OPTIONS__ = (env2) => { const opts = __SENTRY_OPTIONS_CALLBACK__(env2); return { ...opts, rpcTracePropagationBindings: ["COUNTER", "SELF", ...opts?.rpcTracePropagationBindings ?? []] }; };
  const Counter = instrumentDurableObjectWithSentry(__SENTRY_OPTIONS__, __SENTRY_ORIGINAL_Counter__);
  const MyWorkflow = instrumentWorkflowWithSentry(__SENTRY_OPTIONS__, __SENTRY_ORIGINAL_MyWorkflow__);
  const Api = withSentry(__SENTRY_OPTIONS__, __SENTRY_ORIGINAL_Api__);
  const index = withSentry(__SENTRY_OPTIONS__, __SENTRY_DEFAULT_EXPORT__);
sink (out-devA.sink.json):
  {"type":"span","items":[{"n":"db SELECT","trace":"a68475433aeb49eb9e1d03176c747140","id":"9312ccc5e9af3701","parent":"93ac8ea42ceff859","origin":"auto.db.mysql"},{"n":"http.server GET","trace":"a68475433aeb49eb9e1d03176c747140","id":"93ac8ea42ceff859","origin":"auto.http.cloudflare"}]}
  {"type":"span","items":[{"n":"rpc bump","trace":"1b24f9c191b84f4fb06b41fc15f01a7c","id":"be2d158193527b09","parent":"9991b839c085c5da","origin":"auto.faas.cloudflare.durable_object"}]}
  {"type":"span","items":[{"n":"http.server GET","trace":"1b24f9c191b84f4fb06b41fc15f01a7c","id":"9991b839c085c5da","origin":"auto.http.cloudflare"}]}
  {"type":"span","items":[{"n":"rpc ping","trace":"11a55b6f9a724f198b2577407a8cbe4a","id":"add71deabeaaf13c","parent":"922c9b29fe33f5ff","origin":"auto.faas.cloudflare.worker_entrypoint"}]}
  {"type":"event","exception":"route boom","mechanism":"auto.http.cloudflare","handled":false,"trace":"da35381b5a7c479f8e1ef45e71f7b057"}

variant devB - `sentryCloudflareVitePlugin({ autoInstrumentation: false })`:
  withSentry(                              0
  instrumentDurableObjectWithSentry        0
  rpcTracePropagationBindings              0
  __SENTRY_ORCHESTRION__                   5
  routes: /db [{"two":2}]  /do {"do":"bumped"}  /injected {"integrations":["mysql"],"bundler":["mysql"]}
  sink: (empty - no client is ever initialized)

variant devC - `sentryCloudflareVitePlugin({ buildTimeInstrumentation: false })`:
  withSentry( 3, instrumentDurableObjectWithSentry 2, rpcTracePropagationBindings 2
  /injected {"integrations":[],"bundler":null}
  sink has http.server GET, `rpc bump`, `rpc ping`, `route boom` - and NO `db SELECT` span.

variant devD - DO re-exported from another module + `wranglerConfigPath: './wrangler.agent.jsonc'`:
  build log: [plugin sentry-cloudflare-auto-instrument] src/worker2/index.ts: [sentry] Cou...
```

Plus the two extra gaps in the record: (1) the develop JSDoc at
`packages/cloudflare/src/vite/index.ts:42` says options come from a co-located `instrument.*` file
while `instrumentFile.ts:15` hardcodes the basename `instrument.server`; (2)
`cloudflare({ configPath: './wrangler.agent.jsonc' })` without `wranglerConfigPath` silently falls back
to the root `wrangler.jsonc`, whose `main` names a different entry, so nothing is wrapped and no
warning is emitted.

## Observed on 2026-09-07

Matches the recorded verdict. Verbatim, trimmed:

devA - `sentryCloudflareVitePlugin()`, no options:

```
== bundle grep (dist/n3_dev/index.js) ==
  withSentry(                              3
  instrumentDurableObjectWithSentry        2
  instrumentWorkflowWithSentry             2
  rpcTracePropagationBindings              3
  __SENTRY_ORCHESTRION__                   7
injected into the bundle (dist/n3_dev/index.js:66370-66414):
  var __SENTRY_OPTIONS__ = (env) => { const opts = instrument_server_default(env); return { ...opts, rpcTracePropagationBindings: ["COUNTER", "SELF", ...
  var Counter = instrumentDurableObjectWithSentry(__SENTRY_OPTIONS__, __SENTRY_ORIGINAL_Counter__);
  var MyWorkflow = instrumentWorkflowWithSentry(__SENTRY_OPTIONS__, __SENTRY_ORIGINAL_MyWorkflow__);
  var Api = withSentry(__SENTRY_OPTIONS__, __SENTRY_ORIGINAL_Api__);
  var worker_entry_default = withSentry(__SENTRY_OPTIONS__, { async fetch(request, env) {
== routes ==
  /db        [{"id":1,"name":"ada"},{"id":2,"name":"linus"}]
  /do        {"do":"bumped"}
  /rpc       {"rpc":"pong"}
  /injected  {"integrations":["mysql"],"bundler":["mysql"]}
  /error     Error: route boom
  /sentinel  {"sentinel":true}
== sink ==
  {"type": "span", "items": [{"n": "SELECT users", "trace": "1ff3618df7f74563ad81d00b9d35b871", "id": "8e75e0e4b970d929", "parent": "802e58f79edc5b00", "origin": "auto.db.mysql"}, {"n": "GET", "trace": "1ff3618df7f74563ad81d00b9d35b871", "id": "802e58f79edc5b00", "origin": "auto.http.cloudflare"}]}
  {"type": "span", "items": [{"n": "bump", "trace": "213cba3c7de9469f98546cdfef63f120", "id": "a657d4c87c1d5c18", "parent": "b7fa9215d2378350", "origin": "auto.faas.cloudflare.durable_object"}]}
  {"type": "span", "items": [{"n": "GET", "trace": "213cba3c7de9469f98546cdfef63f120", "id": "b7fa9215d2378350", "origin": "auto.http.cloudflare"}]}
  {"type": "span", "items": [{"n": "ping", "trace": "1fa646871c424776b496e7d3743b23a7", "id": "b711851de2e14926", "parent": "aaf94f1b8a0a481e", "origin": "auto.faas.cloudflare.worker_entrypoint"}]}
  {"type": "span", "items": [{"n": "GET", "trace": "1fa646871c424776b496e7d3743b23a7", "id": "aaf94f1b8a0a481e", "origin": "auto.http.cloudflare"}]}
  {"type": "event", "exception": "route boom", "mechanism": "auto.http.cloudflare", "handled": false, "trace": "1cdafa9ed47c4fc887d0a7b0cc370d0a"}
  {"type": "span", "items": [{"n": "GET", "trace": "1cdafa9ed47c4fc887d0a7b0cc370d0a", "id": "8e882f39417d3ca9", "origin": "auto.http.cloudflare"}]}
```

devB - `{ autoInstrumentation: false }`:

```
  withSentry(                              0
  instrumentDurableObjectWithSentry        0
  instrumentWorkflowWithSentry             0
  rpcTracePropagationBindings              0
  __SENTRY_ORCHESTRION__                   5
  /db        [{"id":1,"name":"ada"},{"id":2,"name":"linus"}]
  /do        {"do":"bumped"}
  /injected  {"integrations":["mysql"],"bundler":["mysql"]}
== sink ==
  (empty)
```

devC - `{ buildTimeInstrumentation: false }`:

```
  withSentry(                              3
  instrumentDurableObjectWithSentry        2
  instrumentWorkflowWithSentry             2
  rpcTracePropagationBindings              3
  /injected  {"integrations":[],"bundler":null}
== sink ==
  {"type": "span", "items": [{"n": "GET", "trace": "2a1488c7dcfc4cadb99d69bfadcad11a", "id": "83db4220518f452e", "origin": "auto.http.cloudflare"}]}
  {"type": "span", "items": [{"n": "bump", "trace": "d27a33fd352f418ea52169e861d0b21a", "id": "912e4216c68df2d0", "parent": "a03541e10279aeff", "origin": "auto.faas.cloudflare.durable_object"}]}
  {"type": "span", "items": [{"n": "ping", "trace": "e6ffd2b90f6140a28a1f58954385cdc1", "id": "aee48ccced5a8edd", "parent": "a8a6f213d25b4b2c", "origin": "auto.faas.cloudflare.worker_entrypoint"}]}
  {"type": "event", "exception": "route boom", "mechanism": "auto.http.cloudflare", "handled": false, "trace": "3956a4b055dd44a595ac597851eb1dc0"}
  (no auto.db.mysql span anywhere)
```

devD - re-exported Durable Object + `wranglerConfigPath: './wrangler.agent.jsonc'` (out-devD.build.log:3):

```
[plugin sentry-cloudflare-auto-instrument] [sentry] Could not auto-instrument class(es) Counter: no matching exported class declaration found in the worker entry (re-exports from other modules cannot be wrapped automatically). Wrap them manually with the matching `instrument*WithSentry` helper.
  withSentry(                              2
  instrumentDurableObjectWithSentry        0
```

devE - the same config passed only to `cloudflare()`, no `wranglerConfigPath`:

```
$ npx vite build --config vite.agent-nopath.config.ts   # exit=0
$ grep -n -i sentry out-devE.build.log                  # (no output, no warning)
  withSentry(                              0
  instrumentDurableObjectWithSentry        0
  rpcTracePropagationBindings              0
```

devF - the option names the docs page documents:

```
$ npx tsc --noEmit ... tscheck.experimental.ts
tscheck.experimental.ts(9,34): error TS2353: Object literal may only specify known properties, and '_experimental' does not exist in type 'SentryCloudflareVitePluginOptions'.
$ npx vite build --config vite.experimental.config.ts   # exit=0, options silently ignored
  withSentry(                              3
  instrumentDurableObjectWithSentry        2
  __SENTRY_ORCHESTRION__                   7
```

Shipped option names (`node_modules/@sentry/cloudflare/build/types/vite/index.d.ts`): `wranglerConfigPath?`
(:15), `buildTimeInstrumentation?` (:29), `autoInstrumentation?` (:46), and nothing else. The JSDoc/basename
mismatch is still there on develop: `packages/cloudflare/src/vite/index.ts:42` says `instrument.*`,
`packages/cloudflare/src/vite/instrumentFile.ts:15` is `const INSTRUMENT_FILE_BASENAME = 'instrument.server';`.

Differences from the record, all cosmetic:

- The recorded sink wrote span names as `"<op> <name>"` (`db SELECT`, `http.server GET`, `rpc bump`);
  the rebuilt `sink2.mjs` keeps the raw name and reports the op through `origin`, so the same spans read
  `SELECT users` / `GET` / `bump` with `origin: auto.db.mysql`, `auto.http.cloudflare`,
  `auto.faas.cloudflare.durable_object`.
- The record's MariaDB had no `app` database, so it queried `SELECT 1 + 1 AS two` on port 3306. Here
  `127.0.0.1:3307` has `app.users`, so `/db` runs `SELECT * FROM users` and returns the two rows.
- `rpcTracePropagationBindings` greps 3 rather than 2 (the SDK bundle now contains one more textual
  occurrence); the injected value is the same `["COUNTER", "SELF", ...]`.
- The recorded devD line was truncated mid-word in the record; the full warning is quoted above.

## Files

`src/worker/index.ts` (entry, no Sentry import), `src/worker/instrument.server.ts` (options callback),
`src/worker2/` (re-exported Durable Object case), `wrangler.jsonc`, `wrangler.agent.jsonc`, the six
`vite*.config.ts`, `tscheck.experimental.ts`, `sink2.mjs`, `run.sh`, and the recorded outputs
`out-dev{A,B,C,D,E,F}.{build.log,app.log,sink.json}`. `dist/` holds the last two builds (devF for
`n3_dev`, devE for `n3_agent`); rerun `run.sh` to rebuild any variant.
