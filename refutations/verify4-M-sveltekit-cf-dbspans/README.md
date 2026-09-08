# verify4-M-sveltekit-cf-dbspans

## What it re-tests

Independent re-test of the capability **db spans** of cell `M-sveltekit-cf` (see `$REPRO/cells/M-sveltekit-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `appA/`, `appB/`, `appB_src/`, `appB_static/`, `appC/`, `appD/`, `buildB.log`, `buildB2.log`, `buildB3.log`, `buildD.log`, `buildD_a.log`, `buildD_b.log`, `buildD_c.log`, `buildD_d.log`, `npmD.log`, `pids.txt`, `sink.log`, `sinkV.log`, `wrangler.log`, `wranglerA.log`, `wranglerB2.log`, `wranglerB_final.log`, `wranglerD.log`, `wranglerV.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** partial

Could not fully refute. The db span itself is unambiguously correct and needs no extra wiring; the build crash is real but is **package-manager-dependent**, which the original report missed.

REFUTED PART 1 — with a pnpm install the docs-shaped config builds and works with ZERO workaround.
`/private/tmp/.../deep/verify4-M-sveltekit-cf-dbspans/appB` — pnpm, `@sentry/sveltekit` the only direct `@sentry/*` dep (rest via `pnpm.overrides` to the $REPRO/_toolbox/pack tarballs), vite 6.4.3, @sveltejs/kit 2.70.3, adapter-cloudflare 5.1.0, `vite.config.js` = exactly `plugins: [sentrySvelteKit({ autoUploadSourceMaps: false }), sveltekit()]`, no `ssr` block at all.
  npx vite build        -> EXIT=0, "> Using @sveltejs/adapter-cloudflare  ✔ done"
  npx wrangler dev --port 51878 --inspector-port 0
Worker log: `Sentry Logger [log]: [instrumentation:mysql] "mysql" already injected, subscribing now` / `subscribing to channels` / `Integration installed: Mysql`, and NO "Failed to register diagnostics-channel injection hooks" warning.
Sink (traceLifecycle 'static'):
  {"type":"transaction","name":"GET /db-mysql","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.cloudflare","spans":["http.server GET /db-mysql","db SELECT * FROM users"]}
  {"type":"transaction","name":"GET /db-mysql-module","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.cloudflare","spans":["http.server GET /db-mysql-module","db SELECT * FROM users"]}
Raw span (`/__items?raw=1`):
  {"op":"db","description":"SELECT * FROM users","status":"ok","data":{"sentry.origin":"auto.db.mysql","sentry.op":"db","sentry.kind":"client","db.system.name":"mysql","db.connection_string":"jdbc:mysql://127.0.0.1:3307/app","db.namespace":"app","db.user":"root","db.query.text":"SELECT * FROM users","db.query.summary":"SELECT users","server.address":"127.0.0.1","server.port":3307}}

REFUTED PART 2 — "the connection must be created inside the handler" is wrong. `/db-mysql-module` creates the connection at module scope and produces the same `db SELECT * FROM users` span (mysql opens its socket lazily on the first query, so workerd's global-scope I/O ban is not hit). Both placements work.

CONFIRMED PART — with an npm (hoisted) install the docs-shaped build still crashes, even when `@sentry/sveltekit` is the ONLY direct `@sentry/*` dependency (so it is not an artifact of the tarball install listing every package):
`/private/tmp/.../deep/verify4-M-sveltekit-cf-dbspans/appD` (npm, same versions, same sources, `overrides` for the tarballs), `npx vite build`:
  .svelte-kit/output/server/chunks/index.js:2
  import require$$0 from "@sentry/core";
  SyntaxError: The requested module '@sentry/core' does not provide an export named 'default'
      at async analyse (.../node_modules/@sveltejs/kit/src/core/postbuild/analyse.js:106:62)
The head of that chunk shows the whole family: `import require$$0$1 from "@sentry/conventions/attributes"`, `import require$$0$3 from "@opentelemetry/api"`, `import require$$4 from "@sentry/core/server"`.

ROOT CAUSE (verified, not theorised). `sentryOrchestrionPlugin` (packages/server-utils/src/orchestrion/bundler/vite.ts, `config()`) force-bundles the instrumented module plus `@sentry/server-utils`, but NOT `@sentry/core`, `@sentry/conventions` or `@opentelemetry/api`. The snippet injected into CJS `mysql` `require()`s `@sentry/server-utils`; under a hoisted layout that bare specifier resolves normally and vite picks server-utils' **CJS** build, whose `require('@sentry/core')` rollup-commonjs rewrites into a default import of an external named-exports-only ESM package. Under pnpm the bare specifier does not resolve from mysql's isolated location, so the plugin's own `resolveId` fallback (`resolveOrchestrionRuntimeRequest`) resolves the ESM build and the CJS path is never taken. That is why `@cloudflare/vite-plugin` apps (dev-packages/e2e-tests/test-applications/cloudflare-orchestrion-mysql) never see it: the Workers build bundles everything.

Variants I tried on the npm app (all in appD, `npx vite build -c <config>`):
- vite.config.js (docs shape)                                   -> FAIL, error above
- vite.config.a.js  ssr.noExternal ['@sentry/core']              -> FAIL, same error moves to '@sentry/conventions/attributes'
- vite.config.b.js  ssr.noExternal [/^@sentry\//,'@opentelemetry/api'] -> builds, but HARMFUL: it bundles `@sentry/sveltekit` itself and the Node SDK boots instead of the Cloudflare one. Sink shows `"sdk":"sentry.javascript.sveltekit","runtime":"node"`, the `http.server GET /db-mysql` child span disappears (`"spans":["db SELECT * FROM users"]`) and the worker logs `[Sentry] Failed to register diagnostics-channel injection hooks`. Do not document the regex.
- vite.config.c.js  ssr.noExternal ['@sentry/core','@sentry/conventions','@opentelemetry/api'] -> builds AND correct at runtime: `"sdk":"sentry.javascript.cloudflare","spans":["http.server GET /db-mysql","db SELECT * FROM users"]`
- vite.config.d.js  sentrySvelteKit({ buildTimeInstrumentation: false }) -> builds, but no transform, so no db spans.

Repro files: $SCRATCH/deep/verify4-M-sveltekit-cf-dbspans/ — appB (pnpm, clean pass), appD (npm, repro + 4 variant configs), buildB*.log, buildD*.log, wranglerB_final.log, wranglerD.log. Both apps share src/hooks.server.ts (initCloudflareSentryHandle + sentryHandle + handleErrorWithSentry, tunnel 127.0.0.1:51873, traceLifecycle 'static') and routes /db-mysql (per-request connection) and /db-mysql-module (module-scope connection). Sink: `PORT=51873 node $REPRO/_toolbox/sink.mjs`. appB node_modules is intact; appD node_modules is intact. All processes I started were killed (ports 51873/51876/51878 verified free).

## Workaround

No workaround needed if the app is installed with pnpm (isolated node_modules) — the docs-shaped `plugins: [sentrySvelteKit(...), sveltekit()]` builds and emits the db span as-is. With npm or yarn (hoisted node_modules) add exactly these three to vite.config.js: `ssr: { noExternal: ['@sentry/core', '@sentry/conventions', '@opentelemetry/api'] }`. Do not use a `/^@sentry\//` regex: it force-bundles `@sentry/sveltekit` and boots the Node SDK instead of the Cloudflare one. The real fix belongs in the SDK: `sentryOrchestrionPlugin`'s `config()` hook in packages/server-utils/src/orchestrion/bundler/vite.ts should add `@sentry/core`, `@sentry/conventions` and `@opentelemetry/api` to the `ssr.noExternal` list it already builds for `@sentry/server-utils`, or resolve the injected snippet to server-utils' ESM build so the CJS `require('@sentry/core')` path never appears.

## Docs impact

On the SvelteKit + Cloudflare Workers page, next to the database-span section: "Instrumenting a CommonJS driver such as `mysql` relies on the build-time transform in `sentrySvelteKit()`; if you install with npm or yarn, `vite build` fails during SvelteKit's `analyse` step with `The requested module '@sentry/core' does not provide an export named 'default'` — add `ssr: { noExternal: ['@sentry/core', '@sentry/conventions', '@opentelemetry/api'] }` to `vite.config.js` (pnpm installs need no change, and do not widen this to a `/^@sentry\//` regex, which bundles the Node SDK into the Worker). The connection may be created either at module scope or inside the handler."
