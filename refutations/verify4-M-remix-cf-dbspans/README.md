# verify4-M-remix-cf-dbspans

## What it re-tests

Independent re-test of the capability **db spans (mysql@2) — Remix v2.17.5 (Remix Vite plugin) on Cloudflare Workers, wrangler 4 dev / workerd, compatibility_date 2026-05-01, nodejs_compat, @sentry/{remix,cloudflare} 10.67.0 (develop)** of cell `M-remix-cf` (see `$REPRO/cells/M-remix-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `b-V1.log`, `b-V2.log`, `b-V3.log`, `b-V4.log`, `build-bare-noext0.log`, `build-bare.log`, `build-bare2.log`, `build-noext1.log`, `build-none-noext0.log`, `build-none.log`, `install.log`, `package-lock.json`, `package.json`, `server.ts`, `server.ts.bak`, `server.ts.bak2`, `server.ts.bak3`, `sink-v2.log`, `sink-v2.pid`, `sink.log`, `sink.pid`, `sink2.log`, `sink2.pid`, `tsconfig.json`, `vite.config.ts`, `wr-A.log`, `wr-B.log`, `wr-C.log`, `wr-D.log`, `wr-D2.log`, `wr-E.log`, `wr-F.log`, `wr-V1.log`, `wr-V1.pid`, `wr-V2.log`, `wr-V2.pid`, `wr-V3.log`, `wr-V3.pid`, `wr-V4.log`, `wr-V4.pid`, `wr-V5.log`, `wr-V5.pid`, `wr-noauto-noext0.log`, `wr.pid`, `wrangler.jsonc`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

Probe dir: $SCRATCH/deep/verify4-M-remix-cf-dbspans (server.ts, vite.config.ts switched by PLUGIN=none|bare|noauto and NOEXT=all|mysql|min, app/db.server.ts with both a module-scope and a per-request mysql connection, app/routes/db-module.tsx, app/routes/db-request.tsx, app/routes/sentinel.tsx). Sink on 38217, wrangler dev on 38219. Build: `PLUGIN=<x> NOEXT=<y> npx remix vite:build`, then `npx wrangler dev --port 38219 --inspector-port 0`.

db spans DO work, and two of the three extra requirements in the report are wrong.

1) `autoInstrumentation: false` is NOT needed. A bare `sentryCloudflareVitePlugin()` (autoInstrumentation defaults to true on develop) builds fine on top of the Remix Vite plugin and produces db spans. It also does not double-report: exactly one transaction per request, even though server.ts already calls wrapRequestHandler. V1 = PLUGIN=bare NOEXT=all, sink (traceLifecycle 'static'):
{"type":"transaction","name":"GET /db-module","op":"http.server","source":"route","status":"ok","spans":["function routes/db-module","db SELECT id, name FROM users"]}
{"type":"transaction","name":"GET /db-request","op":"http.server","source":"route","status":"ok","spans":["function routes/db-request","db SELECT id, name FROM users"]}
Note both scopes work: the per-request `createConnection` is instrumented too, so the module-scope requirement the report implies (and Bun's K11) does not apply on workerd.

2) `ssr.noExternal: true` is NOT needed. The minimal set is enough. V4 = PLUGIN=bare, `ssr.noExternal: ['mysql', /^@sentry\//, '@opentelemetry/api']`:
{"type":"transaction","name":"GET /db-module","op":"http.server","source":"route","status":"ok","spans":["function routes/db-module","db SELECT id, name FROM users"]}
{"type":"transaction","name":"GET /db-request","op":"http.server","source":"route","status":"ok","spans":["function routes/db-request","db SELECT id, name FROM users"]}
`mysql` must be in the list because the plugin injects into the bundled driver; `@sentry/*` + `@opentelemetry/api` must be in it for the reason in point 4.

3) Both trace lifecycles work. V5 = same build, traceLifecycle 'stream' (the develop default):
{"type":"span","items":["db SELECT users","function routes/db-module","http.server GET /db-module"]}
{"type":"span","items":["db SELECT users","function routes/db-request","http.server GET /db-request"]}
Stream names the db span `SELECT users` (low cardinality), static names it `SELECT id, name FROM users`.

4) Real defect found along the way (not the db-span claim itself): with the Sentry plugin present and Vite's default SSR externalization for `@sentry/*` (NOEXT=mysql or no noExternal), `remix vite:build` succeeds but emits a bundle wrangler cannot build. build/server/index.js lines 11-17 contain `import require$$0$1 from "@sentry/conventions/attributes"; import require$$0 from "@sentry/core"; import require$$2 from "@sentry/conventions/op"; import require$$4 from "@sentry/core/server";` and wrangler dev fails:
  ✘ [ERROR] No matching export in "node_modules/@sentry/core/build/esm/index.js" for import "default"
  ✘ [ERROR] No matching export in "node_modules/@sentry/core/build/esm/server.js" for import "default"
  ✘ [ERROR] No matching export in "node_modules/@sentry/conventions/dist/attributes.mjs" for import "default"
  ✘ [ERROR] No matching export in "node_modules/@sentry/conventions/dist/op.mjs" for import "default"
Control PLUGIN=none NOEXT=mysql builds a bundle with no `@sentry/*` default-import interop at all, so the CJS-interop default imports are introduced by the Sentry Cloudflare Vite plugin's injected instrumentation. The plugin therefore silently requires its own runtime deps to be bundled, and the failure surfaces only at `wrangler dev`, with an error that names esbuild and @sentry/core and says nothing about noExternal.

5) The one requirement that stands is the plugin itself, and that is the documented mechanism, not a gap. PLUGIN=none NOEXT=mysql runs fine and returns the rows but records no db span:
{"type":"transaction","name":"GET /db-module","op":"http.server","spans":["function routes/db-module"]}
{"type":"transaction","name":"GET /db-request","op":"http.server","spans":["function routes/db-request"]}
workerd has no runtime require hook, so build-time channel injection is the only path. ~/dev/sentry-docs/docs/platforms/javascript/guides/cloudflare/features/vite-plugin.mdx:15 says the plugin "automatically instruments supported packages in your bundle (such as database clients like `mysql`) at build time", and :18 "We recommend building your Cloudflare Worker with Vite and the `sentryCloudflareVitePlugin` plugin. It's the most complete way to get tracing for bundled dependencies in the Workers runtime." The repo's own reference app dev-packages/e2e-tests/test-applications/cloudflare-orchestrion-mysql uses exactly `plugins: [cloudflare(), sentryCloudflareVitePlugin()]` with no options and no ssr config, because there the Cloudflare Vite plugin bundles everything for workerd anyway.

So the capability is not partial: db spans work with the documented plugin call, on both connection scopes and both lifecycles. What is missing is one config line that no docs page mentions, and a build-time error message that does not point at it.

## Workaround

Keep the bare, documented plugin call and add the narrow noExternal list. In vite.config.ts:

import { vitePlugin as remix } from '@remix-run/dev';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
export default defineConfig({
  plugins: [remix({ future: { /* ... */ } }), ...sentryCloudflareVitePlugin()],
  ssr: {
    target: 'webworker',
    resolve: { externalConditions: ['workerd', 'worker'] },
    noExternal: ['mysql', /^@sentry\//, '@opentelemetry/api'],
  },
});

Every driver you want instrumented goes in `noExternal` next to 'mysql' (Remix's Vite SSR build externalizes deps by default, and the plugin can only inject into what it bundles). `/^@sentry\//` and '@opentelemetry/api' are what keep wrangler's esbuild from failing on the injected code's CJS default imports. `ssr.noExternal: true` also works and is the blunt version. No `autoInstrumentation: false` needed. If you build with @cloudflare/vite-plugin instead of the Remix Vite plugin, none of this applies: `plugins: [cloudflare(), sentryCloudflareVitePlugin()]` is enough.

## Docs impact

On the Cloudflare Vite plugin page (docs/platforms/javascript/guides/cloudflare/features/vite-plugin.mdx), after the "Instrument bundled dependencies" bullet: "The plugin can only instrument packages that end up in your bundle. If your build externalizes dependencies (for example a Remix or SvelteKit Vite SSR build, where `@cloudflare/vite-plugin` is not doing the bundling), add the packages you want instrumented plus the SDK's own runtime dependencies to `ssr.noExternal`: `ssr: { noExternal: ['mysql', /^@sentry\\//, '@opentelemetry/api'] }`. Without `/^@sentry\\//` and `'@opentelemetry/api'` the build succeeds but `wrangler dev` fails with `No matching export in \"node_modules/@sentry/core/build/esm/index.js\" for import \"default\"`."
