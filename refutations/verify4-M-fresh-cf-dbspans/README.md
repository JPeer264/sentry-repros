# verify4-M-fresh-cf-dbspans

## What it re-tests

Independent re-test of the capability **db spans (Fresh 2 on Cloudflare Workers, @sentry/cloudflare develop 10.67.0)** of cell `M-fresh-cf` (see `$REPRO/cells/M-fresh-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `install.log`, `ports.env`, `sink.log`, `sink.mjs`, `sink2.log`, `sink2.pid`, `sink3.log`, `sink3.pid`, `wrangler-a.log`, `wrangler-a.pid`, `wrangler-b.log`, `wrangler-b.pid`, `wrangler-c.log`, `wrangler-c.pid`, `wrangler-d.log`, `wrangler-d.pid`, `wrangler-e.log`, `wrangler-e.pid`, `wrangler-f.log`, `wrangler-f.pid`, `wrangler-g.log`, `wrangler-g.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED for `mysql@2`. db spans do appear, both from a Fresh route handler and from the wrangler entry, in both trace lifecycles. The reporter's two shapes were the wrong two shapes: the fix is to stop asking Fresh's own Vite build to instrument the driver and instead pre-bundle the wrangler entry (worker.ts + `_fresh/server.js` + the driver) with esbuild plus `sentryOrchestrionPlugin` from `@sentry/server-utils/orchestrion/esbuild`, then point `wrangler.jsonc` `main` at that output.

WORKING WIRING (files under $SCRATCH/deep/verify4-M-fresh-cf-dbspans/app/):
- `vite.config.ts`: `plugins:[fresh()]`, and `environments.ssr.build.rollupOptions.external = ["@sentry/cloudflare","mysql","mysql2","mysql2/promise"]` (unchanged from the reporter's shape 1). No Sentry Vite plugin here at all.
- `build-worker3.mjs`: esbuild `bundle:true, format:'esm', platform:'neutral', mainFields:['module','main'], conditions:['workerd','worker','browser','import','module','default']`, `plugins:[collectBuiltins, sentryOrchestrionPlugin()]`, entry `worker.ts`, out `dist3/worker.mjs`.
- `wrangler.jsonc`: `"main": "dist3/worker.mjs"`, compat date 2026-05-01, `nodejs_compat`.
- `worker.ts` unchanged apart from also importing `mysql` for a control route; `server.fetch(request, { remoteAddr: {...} })` stub still required.

THE ONE NON-OBVIOUS BIT. A plain esbuild pre-bundle fails twice before it works, and both failures look like SDK bugs but are esbuild ESM-output artifacts:
1. `Error: Dynamic require of "diagnostics_channel" is not supported` on the first query — esbuild rewrites every `require()` of an external module in ESM output to its `__require` stub, and the orchestrion-injected snippet inside `node_modules/mysql/lib/Connection.js` requires `diagnostics_channel`.
2. Routing bare builtins through generated ESM shim modules instead (dist2) fixes that but then dies with `TypeError: The "superCtor.prototype" property must be of type object. Received undefined at Object.inherits (node:util:119:15) at node_modules/readable-stream/lib/_stream_readable.js` — `require('stream')` returned a namespace object, not the module.
The fix that works is a banner: statically `import * as __nbN from "node:<builtin>"` for every builtin the bundle asks for, then `globalThis.require = id => { const m = map[id.replace(/^node:/,"")]; return m.default !== undefined ? m.default : m; }`. esbuild's `__require` stub defers to a global `require` when one exists, so this restores correct CJS semantics. Builtins collected in this app: async_hooks, buffer, crypto, diagnostics_channel, events, fs, net, process, stream, string_decoder, timers, tls, url, util, zlib.

EVIDENCE (sink on 127.0.0.1:52117; `traceLifecycle:"static"`, app on 52123):
  {"type":"transaction","name":"GET /dbq2","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.cloudflare","spans":["db SELECT id, name FROM users"]}
  {"type":"transaction","name":"GET /wdb","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.cloudflare","spans":["db SELECT id, name FROM users"]}
`/dbq2` is the Fresh route `routes/dbq2.tsx` (module-scope `mysql.createConnection` in `db2.ts`); `/wdb` is a control path handled in `worker.ts` itself.

Default `traceLifecycle:"stream"` (app on 52131) — same result, correctly parented and with the right origin:
  {"type":"span","items":["db SELECT users","http.server GET /dbq2"],"raw":[{"name":"SELECT users","status":"ok","parent_span_id":"91184fd2107d430e","is_segment":false,"origin":"auto.db.mysql"},{"name":"GET /dbq2","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}
Rest of the app is unaffected by the pre-bundle: `http.server GET /`, `http.server GET /users/:id`, `Error: fresh-cf-route-error` via `routes/_error.tsx` all still arrive.

mysql2 CAVEAT (the only part that stays broken, and not a Sentry defect). With the same bundle mysql2 IS instrumented and emits spans, then its own row-parser codegen is rejected by workerd:
  {"type":"transaction","name":"GET /dbq","op":"http.server","status":"internal_error","spans":["db mysql2.pool.connect","db mysql2.connect","db SELECT id, name FROM users"]}
  {"type":"event","exception":"EvalError: Code generation from strings disallowed for this context","sdk":"sentry.javascript.cloudflare"}
So the reporter's "mysql2 cannot even run" is confirmed, but it is a workerd `new Function` restriction inside mysql2, not an instrumentation gap. `mysql@2` is the driver to use.

ALSO TRIED AND CONFIRMED DEAD (so a docs page should not send anyone down these):
- `sentryCloudflareVitePlugin({ autoInstrumentation: false })` in Fresh's own `vite.config.ts` with the driver bundled, plus `define: { "import.meta.url": JSON.stringify("file:///_fresh/server.js") }` to kill the reporter's `createRequire(undefined)` TypeError. The define does work (`const require$2 = createRequire("file:///_fresh/server.js")` in `_fresh/server/assets/_fresh-route___dbq2-C7SWGNeZ.js`), the orchestrion injection is present, but the route then fails with `Error: No such module "_fresh/lib/_stream_readable.js"` — workerd's `createRequire` resolves against the Worker's module map, so rollup's leftover dynamic requires can never resolve. Rollup/Vite CJS interop is structurally unusable for a Workers target here.
- Simplified banner `globalThis.require = createRequire("file:///worker.mjs")` instead of the static `node:` import map (`build-worker4.mjs`). Needs an alias to avoid `The symbol "createRequire" has already been declared`, and even then mysql fails with `Error: Received packet in the wrong sequence.` Do not recommend it.
- Baseline reproduction of the reporter's shape 1 (driver external, wrangler bundles `worker.ts`): confirmed, `{"type":"transaction","name":"GET /dbq2",...,"spans":[]}` — no db span.

RERUN:
  cd $S/deep/verify4-M-fresh-cf-dbspans/app
  npm install                     # node_modules already present, 337M
  deno task build                 # Fresh SSR bundle, driver external
  node build-worker3.mjs          # esbuild + sentryOrchestrionPlugin -> dist3/worker.mjs
  npx wrangler dev --port 52123 --inspector-port 0
  PORT=52117 node ../sink.mjs     # sink; worker.ts points dsn/tunnel at 127.0.0.1:52117
  curl http://127.0.0.1:52123/dbq2 ; curl http://127.0.0.1:52123/sentinel ; curl http://127.0.0.1:52117/__items
Reference read: dev-packages/e2e-tests/test-applications/cloudflare-orchestrion-mysql/{vite.config.ts,src/index.ts} in ~/dev/sentry-worktrees/audit-runtime-docs — it relies on `cloudflare()` + `sentryCloudflareVitePlugin()`, which Fresh cannot use, and it creates the connection inside the handler; module-scope creation works fine here too since `mysql` connects lazily.
Note: a stray `app/app/` copy exists in the probe dir (a `cp -R` into a directory a previous run had already created); it is inert, Fresh only scans `routes/` and `islands/` at the root.

## Workaround

Do not put `sentryCloudflareVitePlugin()` in Fresh's `vite.config.ts`. Keep `@sentry/cloudflare` and the DB driver external to the Fresh SSR build, then bundle the wrangler entry yourself with esbuild and the Sentry orchestrion esbuild plugin, and set `wrangler.jsonc` `main` to that output:

```js
// build-worker.mjs
import * as esbuild from 'esbuild';
import { builtinModules } from 'node:module';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';

const BUILTINS = new Set(builtinModules.filter(m => !m.startsWith('node:')));
const used = new Set();
const collect = { name: 'collect-node-builtins', setup(build) {
  build.onResolve({ filter: /^(node:)?[a-z_]+(\/[a-z_]+)?$/ }, args => {
    const bare = args.path.replace(/^node:/, '');
    if (!BUILTINS.has(bare)) return null;
    used.add(bare);
    return { path: `node:${bare}`, external: true };
  });
}};
const common = {
  entryPoints: ['worker.ts'], bundle: true, format: 'esm', platform: 'neutral',
  mainFields: ['module', 'main'], target: 'es2022',
  conditions: ['workerd', 'worker', 'browser', 'import', 'module', 'default'],
  plugins: [collect, sentryOrchestrionPlugin()],
};
await esbuild.build({ ...common, outfile: 'dist/probe.mjs' });   // pass 1: discover builtins
const names = [...used].sort();
const banner = [
  ...names.map((n, i) => `import * as __nb${i} from "node:${n}";`),
  `const __nbMap = { ${names.map((n, i) => `"${n}": __nb${i}`).join(', ')} };`,
  'globalThis.require = id => { const m = __nbMap[String(id).replace(/^node:/, "")];',
  '  if (!m) throw new Error("Cannot find module " + id);',
  '  return m.default !== undefined ? m.default : m; };',
].join('\n');
await esbuild.build({ ...common, outfile: 'dist/worker.mjs', banner: { js: banner } });
```

`deno task build && node build-worker.mjs && npx wrangler dev`. Use `mysql@2`; `mysql2` produces spans but its query then throws `EvalError: Code generation from strings disallowed for this context` in workerd.

## Docs impact

Fresh 2 on Cloudflare Workers has no `@cloudflare/vite-plugin` worker environment, so `sentryCloudflareVitePlugin()` cannot instrument your database driver from Fresh's own Vite build (adding it there injects the channels but Vite's CJS interop then breaks the driver under workerd with `createRequire(import.meta.url)` and unresolvable `createRequire` module ids); instead keep `@sentry/cloudflare` and the driver out of the Fresh SSR bundle via `environments.ssr.build.rollupOptions.external`, bundle your `worker.ts` wrangler entry yourself with esbuild plus `sentryOrchestrionPlugin` from `@sentry/server-utils/orchestrion/esbuild` — adding a banner that defines a `globalThis.require` backed by static `node:*` imports, because esbuild's ESM output otherwise turns the injected `require('diagnostics_channel')` into a stub that throws — and point `wrangler.jsonc` `main` at that bundle; use `mysql@2`, since `mysql2` is instrumented but cannot run in workerd (`EvalError: Code generation from strings disallowed for this context`).
