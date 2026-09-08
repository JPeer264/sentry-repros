# verify4-M-remix-deno-dbspans

## What it re-tests

Independent re-test of the capability **db spans (mysql2) in Remix v2 on Deno 2.9.0 with @sentry/remix 10.67.0 (develop), canonical "instrument first" import order** of cell `M-remix-deno` (see `$REPRO/cells/M-remix-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `README-rerun.txt`, `app/`, `appA-static.log`, `appA.pid`, `appB-stream.log`, `appB.pid`, `appC-cjs.log`, `appC.pid`, `appD-debug.log`, `appD.pid`, `base.pid`, `baseline-inject-on.log`, `build-lazy.mjs`, `build-server.mjs`, `build-server2.mjs`, `build1.log`, `buildlazy.log`, `buildserver.log`, `buildserver2.log`, `control.mjs`, `ctrlA.log`, `ctrlA.pid`, `db-lazy.mjs`, `db.mjs`, `deno.json`, `install.log`, `instrument.server.mjs`, `package-lock.json`, `package.json`, `recorder.mjs`, `runB.log`, `runB.pid`, `runC.log`, `runC.pid`, `runD.log`, `runD.pid`, `runE.log`, `runE.pid`, `runF1.log`, `runF1.pid`, `runG-injectON.log`, `runG.pid`, `runH-injectOFF.log`, `runH.pid`, `runI-unbundled-off-stream.log`, `runI.pid`, `server-cjs.mjs`, `server-lazy.mjs`, `server.mjs`, `sink.log`, `sink.mjs`, `sink.pid`, `sink2.log`, `sink2.pid`, `sink3.log`, `sink3.pid`, `sinkR.log`, `sinkR.pid`, `t-mysql-plain.mjs`, `tsconfig.json`, `vite.config.ts`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED the "only with a non-canonical import order" part. db spans (and route transactions and errors) work with the canonical order — `import './instrument.server.mjs'` first, mysql2 loaded strictly after `Sentry.init()` — if the server entry is bundled with the Sentry orchestrion esbuild plugin and the runtime module hook is turned off with `enableRuntimeChannelInjection: false`.

Exact change (two parts, both required):
1. build the server entry with build-time channel injection instead of the runtime hook:
   `import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild'` in an esbuild build of `server.mjs` (bundle: true, platform node, format esm, external `['@sentry/*','mysql2','react','react-dom','react-dom/server']`, banner `import { createRequire as __sentryCreateRequire } from 'node:module'; const require = __sentryCreateRequire(import.meta.url);`).
   The banner is mandatory: without it the bundle dies at boot with `Error: Dynamic require of "@sentry/server-utils" is not supported` (runC.log), because the injected snippet inside transformed CJS files uses `require` and esbuild's ESM output has none.
2. `Sentry.init({ ..., enableRuntimeChannelInjection: false })`, which stops `@sentry/server-runtime-injection` from registering `Module.registerHooks` — the hook is what makes Deno reject mysql2's `require('../package.json')` (K3).

Evidence, all from my own sink at 127.0.0.1:46311.

A) dist-lazy bundle (mysql2 loaded via `await import('mysql2/promise')` AFTER init), injection OFF, static — runH-injectOFF.log:
{"type":"transaction","name":"GET db","op":"http.server","source":"route","status":"ok","sdk":"sentry.javascript.remix","spans":["function LOADER root","function LOADER routes/db","db mysql2.pool.connect","db mysql2.connect","db SELECT id, name FROM users"]}
{"type":"transaction","name":"GET users/:id","op":"http.server","source":"route","status":"ok","spans":["function LOADER root","function LOADER routes/users.$id"]}
{"type":"event","exception":"Error: probe-loader-boom-7","mechanism":"auto.function.remix.server","handled":false,"transaction":"GET /boom/7"}
This is the strongest form: the driver genuinely loads after `Sentry.init()`, so the ordering rule the other agent reported is gone, not hidden.

B) Same bundle shape with a module-scope pool (dist-server2), stream lifecycle — runE.log:
{"type":"span","items":["function LOADER root","db mysql2.pool.connect","db mysql2.connect","db SELECT users","function LOADER routes/db","http.server GET db"],"raw":[{"name":"mysql2.pool.connect","origin":"auto.db.mysql2.diagnostic_channel"},...]}
Static variant (runD.log) gives the same `GET db` transaction with the three db children.

C) Why the hook, not the order, is the defect — dist-lazy bundle with injection ON (default init), runG-injectON.log:
[Sentry] `@sentry/server-runtime-injection` was bundled into your application, so mysql2 ... (false positive; it is external here)
SyntaxError: Unexpected token ':'
    at Object.compileFunction (ext:core/01_core.js:1106:31)
    at Object.<anonymous> (.../node_modules/mysql2/lib/connection_config.js:13:21)

D) The obvious one-line "fix" does NOT work on its own — unbundled `server.mjs` + `enableRuntimeChannelInjection: false` (runB.log, runI-unbundled-off-stream.log): the process boots, but the sink receives ZERO transactions and ZERO spans, only events. Debug shows `Http.Server Handling incoming request` and no `[Tracing] Starting sampled root span`. Root cause read in the worktree: `packages/remix/src/server/integrations/http.ts:14` sets `disableIncomingRequestSpans: true`, so on Remix the whole server span tree (and with it every db child) comes from the `@remix-run/server-runtime` orchestrion channels — kill runtime injection without replacing it at build time and you lose all tracing. In that state mysql2 produced no db spans either, in static or stream, which also qualifies the other agent's "no instrumentation path is needed at all" claim for mysql2 3.24.3.

E) Side observation: with a module-scope pool the bundled entry also boots with injection ON (runF1.log) and records db spans, but only because esbuild hoists the external `import 'mysql2/promise'` above the init body — accidental, and it breaks again the moment the driver is imported lazily (C). So the hoisting is not a recipe.

Not reproduced/negative paths: `enableRuntimeChannelInjection: false` alone (D). Deno's `--import` hook variant was not retried because it installs the same `Module.registerHooks` transform that crashes in (C).

Files (all absolute, in $SCRATCH/deep/verify4-M-remix-deno-dbspans/): README-rerun.txt, build-server2.mjs, build-lazy.mjs, server.mjs, server-lazy.mjs, db.mjs, db-lazy.mjs, instrument.server.mjs, vite.config.ts, sink.mjs, logs runB..runI. All processes I started were killed.

## Workaround

Keep `import './instrument.server.mjs'` as the first line of the server entry and instead of relying on the runtime module hook, bundle the entry with build-time channel injection and switch the hook off:

// instrument.server.mjs
import * as Sentry from '@sentry/remix';
Sentry.init({ dsn, tracesSampleRate: 1.0, traceLifecycle: 'static' | 'stream', enableRuntimeChannelInjection: false });

// build-server.mjs (run under node, after `npx remix vite:build`)
import * as esbuild from 'esbuild';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';
await esbuild.build({
  entryPoints: ['./server.mjs'], outfile: './dist-server/server.mjs',
  bundle: true, platform: 'node', format: 'esm', target: 'node20',
  external: ['@sentry/*', 'mysql2', 'react', 'react-dom', 'react-dom/server'],
  banner: { js: "import { createRequire as __sentryCreateRequire } from 'node:module';\nconst require = __sentryCreateRequire(import.meta.url);" },
  plugins: [sentryOrchestrionPlugin()],
});

Run: `deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys dist-server/server.mjs`.
`@remix-run/server-runtime` must be bundled (not external) — that is where the transform lands; mysql2 may stay external because 3.20+ publishes its own diagnostics channels, and @sentry/* must stay external. The old workaround (import the driver before instrument, no bundler) still works but is no longer the only option.

## Docs impact

On Deno, do not rely on the runtime diagnostics-channel hook: pass `enableRuntimeChannelInjection: false` to `Sentry.init()` and bundle your Remix server entry with `sentryOrchestrionPlugin()` from `@sentry/server-utils/orchestrion/esbuild` (bundling `@remix-run/server-runtime`, keeping `@sentry/*` external, and adding a `createRequire` banner to the ESM output) — then `import './instrument.server.mjs'` stays the first line as usual and you get parameterized route transactions, loader spans and `db` spans for drivers such as mysql2, whereas leaving the runtime hook on makes Deno abort at startup on any CommonJS dependency that does `require('*.json')` (mysql2 does) and turning it off without the bundler plugin silently removes every server span.
