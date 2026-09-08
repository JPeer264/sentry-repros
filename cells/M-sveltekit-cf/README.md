# M-sveltekit-cf: SvelteKit 2.70.3 (svelte 5.57.0, @sveltejs/adapter-cloudflare 5.1.0, vite 6.4.3) with @sentry/sveltekit 10.67.0 (develop, built from worktree audit-runtime-docs) on Cloudflare Workers (wrangler 4.129.0 dev, workerd 1.20260903.1, compatibility_date 2026-05-01, nodejs_compat)

## What it reproduces

Two findings worth filing.

(a) BUILD BREAK, Sentry-caused: with the exact docs config, `vite build` dies in SvelteKit's postbuild `analyse` step the moment a route imports `mysql`. The orchestrion/server-runtime-injection transform run by `sentrySvelteKit()` rewrites the bundled CJS driver and emits `import require$$0 from "@sentry/core"` into the SSR chunk; `@sentry/core` is ESM-only and left external by SvelteKit's SSR externalization, so Node throws `does not provide an export named 'default'`. Control proves it is Sentry's: the identical app builds cleanly with only `sentrySvelteKit()` removed. `ssr: { noExternal: ['@sentry/core','@sentry/conventions','@opentelemetry/api'] }` fixes it (the db-mysql chunk then weighs 2.36 MB). The in-repo e2e app dev-packages/e2e-tests/test-applications/sveltekit-cloudflare-pages has the same mysql route and does NOT carry this workaround, so it is worth checking whether that app's pinned @sveltejs/kit 2.69.1 / pnpm layout hides the same defect.

(b) SEGMENT NAME never gets the route. `svelteKitSpansIntegration` sets the parameterized name and `http.route` on a CHILD span, while the segment stays the Cloudflare request span (`GET /users/42` source url under static, bare `GET` under stream). Both lifecycles were checked. On the Node SvelteKit SDK the SvelteKit span IS the root, so this is Cloudflare-specific and means transaction grouping in the product is by URL, not by route.

Smaller notes:
- `@sentry/sveltekit@10.67.0` cannot be installed from $S/pack alone: its `@sentry/bundler-plugins@10.67.0` dependency is neither in $S/pack nor published (npm latest 10.73.0). It has to be packed from the worktree. Worth adding to $S/pack for other framework cells.
- The Worker reaches the host sink at `127.0.0.1:41317` fine; `tunnel` in `initCloudflareSentryHandle` works.
- mysql connections must be created INSIDE the handler on workerd (module-scope I/O is forbidden), the inverse of the Bun K11 rule, and spans still attach correctly.
- npm 11 skipped the workerd/esbuild postinstall scripts (`npm warn allow-scripts`); the prebuilt binaries were present anyway and wrangler dev started fine, so no approval was needed.
- Processes killed (sink 49140, recorder 49142, wrangler 59970); app/node_modules removed, directory down to 6.6 MB.

This directory is the original run of 2026-09-06 and 2026-09-07, kept as it was. This README was generated from the recorded result; the rebuilt cells carry a hand-written README.

## Setup the docs would show

Packages (all from $S/pack, npm, one command line so the 10.67.0 peers resolve):
  npm install $S/pack/sentry-{sveltekit,cloudflare,core,node,svelte,browser,server-utils,server-runtime-injection,opentelemetry,bundler-plugins}-10.67.0.tgz mysql@2.18.1
  npm install -D @sveltejs/kit@^2.46 @sveltejs/adapter-cloudflare@^5 @sveltejs/vite-plugin-svelte@^5 svelte@^5 vite@^6 wrangler@^4 typescript@^5
Note: @sentry/sveltekit@10.67.0 depends on @sentry/bundler-plugins@10.67.0, which is NOT in $S/pack and NOT on npm (npm latest is 10.73.0), so it has to be packed from the worktree first:
  (cd $W/packages/bundler-plugins && npm pack --pack-destination $S/pack)

vite.config.js:
  import { sentrySvelteKit } from '@sentry/sveltekit/vite';   // NOT '@sentry/sveltekit' - see docsNote
  import { sveltekit } from '@sveltejs/kit/vite';
  export default defineConfig({ plugins: [sentrySvelteKit({ autoUploadSourceMaps: false }), sveltekit()] });

svelte.config.js: adapter from '@sveltejs/adapter-cloudflare', kit.prerender.handleHttpError 'ignore'.

src/hooks.server.ts (this is the whole init - there is no instrument.ts / no withSentry on Cloudflare here):
  export const handleError = handleErrorWithSentry();
  export const handle = sequence(
    initCloudflareSentryHandle({ dsn, tunnel, tracesSampleRate: 1.0, traceLifecycle: 'static' }),
    sentryHandle(),
  );

wrangler.jsonc: { "compatibility_date": "2026-05-01", "compatibility_flags": ["nodejs_compat"], "main": ".svelte-kit/cloudflare/_worker.js", "assets": { "directory": ".svelte-kit/cloudflare", "binding": "ASSETS" } }

Run: npx vite build && npx wrangler dev --port <port> --inspector-port 0

EXTRA WIRING a docs page would have to show for db spans (not needed otherwise): bundling any CJS driver (mysql) together with sentrySvelteKit() breaks `vite build`. The only thing that got the build through was adding to vite.config.js:
  ssr: { noExternal: ['@sentry/core', '@sentry/conventions', '@opentelemetry/api'] }

## Install and Run

Recorded commands; paths under `$SCRATCH` were the session working directory, the same files are in this directory:

```
S=$SCRATCH
W=~/dev/sentry-worktrees/audit-runtime-docs
D=$S/deep/M-sveltekit-cf/app

# 1. pack the missing build-time dep (not in $S/pack, not on npm at 10.67.0)
(cd $W/packages/bundler-plugins && npm pack --pack-destination $S/pack)

# 2. install
cd $D && npm install --no-audit --no-fund \
  $S/pack/sentry-sveltekit-10.67.0.tgz $S/pack/sentry-cloudflare-10.67.0.tgz $S/pack/sentry-core-10.67.0.tgz \
  $S/pack/sentry-node-10.67.0.tgz $S/pack/sentry-svelte-10.67.0.tgz $S/pack/sentry-browser-10.67.0.tgz \
  $S/pack/sentry-server-utils-10.67.0.tgz $S/pack/sentry-server-runtime-injection-10.67.0.tgz \
  $S/pack/sentry-opentelemetry-10.67.0.tgz $S/pack/sentry-bundler-plugins-10.67.0.tgz mysql@2.18.1
cd $D && npm install --no-audit --no-fund --save-dev "@sveltejs/kit@^2.46.0" \
  "@sveltejs/adapter-cloudflare@^5.0.3" "@sveltejs/vite-plugin-svelte@^5.0.3" \
  "svelte@^5.20.2" "vite@^6.4.2" "wrangler@^4.61.0" "typescript@^5"

# 3. sink + fetch recorder
PORT=41317 node $S/qs/sink.mjs > $S/deep/M-sveltekit-cf/sink.log 2>&1 &
node $S/deep/M-sveltekit-cf/recorder.mjs > $S/deep/M-sveltekit-cf/recorder.log 2>&1 &

# 4a. docs-shaped build (reproduces the mysql build crash)
cd $D && npx vite build
# 4b. build that works with mysql (adds ssr.noExternal)
cd $D && npx vite build --config vite.config.wa.js
# 4c. control: same app, no sentrySvelteKit() -> builds fine with mysql
cd $D && npx vite build --config vite.config.nosentry.js

# 5. run
cd $D && npx wrangler dev --port 41321 --inspector-port 0

# 6. probes
curl -s http://127.0.0.1:41321/users/42
curl -s http://127.0.0.1:41321/boom
curl -s "http://127.0.0.1:41321/tagged?tag=alpha" & curl -s "http://127.0.0.1:41321/tagged?tag=beta" & curl -s "http://127.0.0.1:41321/tagged?tag=gamma" & wait
curl -s -H "sentry-trace: aaaabbbbccccddddeeeeffff00001111-1111222233334444-1" \
       -H "baggage: sentry-trace_id=aaaabbbbccccddddeeeeffff00001111,sentry-environment=probe,sentry-public_key=public,sentry-sample_rate=1" \
       http://127.0.0.1:41321/users/7
curl -s http://127.0.0.1:41321/outfetch
curl -s http://127.0.0.1:41321/db-mysql
curl -s http://127.0.0.1:41321/logtest
curl -s "http://127.0.0.1:41321/sentinel?n=1"      # sentinel, then read the sink
curl -s http://127.0.0.1:41317/__items
curl -s "http://127.0.0.1:41317/__items?raw=1"
curl -s http://127.0.0.1:41325/__hits
```

Files: `app/`, `recorder.log`, `recorder.mjs`, `sink.log`, `wrangler.log`, `wrangler2.log`, `wrangler3.log`

## Expected

| Capability | Verdict | Detail |
| --- | --- | --- |
| errors | works | A throw in src/routes/boom/+server.ts is reported as an unhandled event with mechanism `auto.function.sveltekit.handle_error` (handled:false), sdk `sentry.javascript.cloudflare`, transaction `GET /boom`, correct request context, and the matching transaction gets status `internal_error`. SvelteKit still converts it to a 500 JSON body for the client, so it is swallowed at the HTTP layer but not at the Sentry layer. traceLifecycle 'static'. |
| route names | partial | The parameterized route only reaches a NESTED span, never the segment. static lifecycle: transaction name `GET /users/42`, transaction_info.source `url`, `sentry.segment.name.source: url`, origin auto.http.cloudflare; its child span is `GET /users/[id]` with `http.route: /users/[id]` and origin auto.http.sveltekit. stream lifecycle (develop default): the is_segment span is named just `GET` with source `url` and no http.route, and `GET /users/[id]` is again a non-segment child. So group-by-transaction in Sentry would see the raw URL (static) or bare `GET` (stream). |
| isolation | works | Three concurrent GET /tagged?tag=alpha/beta/gamma (each Sentry.setTag then 150ms await then captureException) produced three events with exactly their own tag and three distinct trace ids, each matching its own transaction's trace id. No cross-talk. traceLifecycle 'static'. |
| incoming trace | works | GET /users/7 with `sentry-trace: aaaabbbbccccddddeeeeffff00001111-1111222233334444-1` and a sentry-* baggage header produced a transaction with trace_id aaaabbbbccccddddeeeeffff00001111 and parent_span_id 1111222233334444. traceLifecycle 'static'. |
| outgoing fetch | works | A plain `fetch('http://127.0.0.1:41325/rec')` inside a +server.ts handler produced `http.client GET http://127.0.0.1:41325/rec` as a child of the request transaction, and the recorder saw both `sentry-trace` (same trace id, sampled=1) and a full `baggage` header. traceLifecycle 'static'; in stream lifecycle the same span appears as `http.client GET 127.0.0.1` (host-only name). |
| db spans | partial | Instrumentation path: the build-time orchestrion transform shipped in `sentrySvelteKit()` (@sentry/server-runtime-injection) - it is required, there is no OTel require-hook in workerd, and the worker log confirms it: `[instrumentation:mysql] "mysql" already injected, subscribing now` / `Integration installed: Mysql`. Once it builds, the span is correct: op `db`, `SELECT * FROM users`, db.system.name mysql, db.namespace app, server.port 3307, nested under the request. BUT with the docs-shaped config `vite build` CRASHES as soon as `mysql` is imported from a route: the transform emits `import require$$0 from "@sentry/core"` into the SSR chunk and SvelteKit's postbuild `analyse` step dies with `SyntaxError: The requested module '@sentry/core' does not provide an export named 'default'`. Removing only `sentrySvelteKit()` makes the same build succeed, so it is Sentry-caused. Adding `ssr: { noExternal: ['@sentry/core','@sentry/conventions','@opentelemetry/api'] }` is what unblocked it. Also note the connection must be created inside the handler (workerd forbids module-scope I/O), which is the opposite of the Bun/Node rule. |
| logs | works | `Sentry.logger.info('hello from sveltekit cloudflare route')` inside a +server.ts handler arrived as a log envelope item `info: hello from sveltekit cloudflare route` with no enableLogs option set (logs are always on in develop). traceLifecycle 'static'. |
| client errors | not-run | Only the server side was probed; no hooks.client.ts / browser driver was set up, so client-side error and pageload behavior was not exercised. |

## Observed

Not re-run in the rebuild. The recorded evidence of the original run:

```
--- errors (static, /__items) ---
{"type":"event","exception":"Error: boom from sveltekit cf server route","mechanism":"auto.function.sveltekit.handle_error","handled":false,"sdk":"sentry.javascript.cloudflare","runtime":"cloudflare","transaction":"GET /boom","trace_id":"9087139cc6cd41a0a031d17e0b295dc5","request":{"url":"http://127.0.0.1:41321/boom","method":"GET"}}
{"type":"transaction","name":"GET /boom","op":"http.server","source":"url","status":"internal_error","trace_id":"9087139cc6cd41a0a031d17e0b295dc5","spans":["http.server GET /boom"]}

--- route names, static lifecycle (/__items?raw=1) ---
tx GET /users/42 {"source":"url"} {"span_id":"97862810a619503f","data":{"sentry.origin":"auto.http.cloudflare","sentry.op":"http.server","sentry.segment.name.source":"url","url.path":"/users/42",...},"op":"http.server","status":"ok"}
  span http.server GET /users/[id] {"sentry.origin":"auto.http.sveltekit","sentry.op":"http.server","url.path":"/users/42","http.route":"/users/[id]","http.response.status_code":200}

--- route names, stream lifecycle (develop default) ---
span ["http.server GET /users/[id]","http.server GET"] [{"name":"GET /users/[id]","is_segment":false,"origin":"auto.http.sveltekit"},{"name":"GET","is_segment":true,"origin":"auto.http.cloudflare"}]
segment "GET" source= {"value":"url","type":"string"} route= undefined

--- isolation (3 concurrent requests) ---
event Error: iso-alpha tags= {"probe_tag":"alpha"} trace= bdf583d24d364a0992b7b7b21b2c0923
event Error: iso-gamma tags= {"probe_tag":"gamma"} trace= 8e2c073d0a0d4754b0b3b572026b443e
event Error: iso-beta  tags= {"probe_tag":"beta"}  trace= d33d8513b1f94b71991cc38d97724300

--- incoming trace ---
{"type":"transaction","name":"GET /users/7","op":"http.server","source":"url","trace_id":"aaaabbbbccccddddeeeeffff00001111","parent_span_id":"1111222233334444","spans":["http.server GET /users/[id]"]}

--- outgoing fetch (recorder /__hits + transaction) ---
{"url":"/rec","method":"GET","sentryTrace":"08eb4860084d4b1f89d72c9b5fd9c765-be0ff84f5d8c9c64-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=08eb4860084d4b1f89d72c9b5fd9c765,sentry-org_id=0,sentry-sampled=true,sentry-sample_rand=0.867669056365429,sentry-sample_rate=1"}
{"type":"transaction","name":"GET /outfetch","trace_id":"08eb4860084d4b1f89d72c9b5fd9c765","spans":["http.server GET /outfetch","http.client GET http://127.0.0.1:41325/rec"]}

--- db spans: BUILD FAILURE with docs-shaped vite config ---
file://.../.svelte-kit/output/server/entries/endpoints/db-mysql/_server.ts.js:8
import require$$0 from "@sentry/core";
       ^^^^^^^^^^
SyntaxError: The requested module '@sentry/core' does not provide an export named 'default'
    at async analyse (file://.../node_modules/@sveltejs/kit/src/core/postbuild/analyse.js:106:62)
(the identical build with only `sentrySvelteKit()` removed from vite.config.js succeeds)

--- db spans: after adding ssr.noExternal ---
Sentry Logger [log]: [instrumentation:mysql] "mysql" already injected, subscribing now
Sentry Logger [log]: [instrumentation:mysql] subscribing to channels
Sentry Logger [log]: Integration installed: Mysql
tx GET /db-mysql spans= ["http.server GET /db-mysql","db SELECT * FROM users"]
{"op":"db","desc":"SELECT * FROM users","data":{"sentry.origin":"auto.db.mysql","sentry.op":"db","sentry.kind":"client","db.system.name":"mysql","db.connection_string":"jdbc:mysql://127.0.0.1:3307/app","db.namespace":"app","db.user":"root","db.query.text":"SELECT * FROM users","db.query.summary":"SELECT users","server.address":"127.0.0.1","server.port":3307}}

--- logs ---
{"type":"log","items":["info: hello from sveltekit cloudflare route"]}

--- sentrySvelteKit is not on the main entry (develop) ---
$ node --input-type=module -e "import * as m from '@sentry/sveltekit'; console.log('sentrySvelteKit' in m)"
false
```

## Docs note

The combination IS documented. ~/dev/sentry-docs/docs/platforms/javascript/guides/cloudflare/frameworks/sveltekit.mdx:1-9 is a "SvelteKit on Cloudflare" page that just renders `platform-includes/getting-started-complete/javascript.sveltekit.mdx`; the Cloudflare-only branch of that include is `<PlatformSection supported={["javascript.cloudflare"]}>` at :311, with the `initCloudflareSentryHandle(...) + sentryHandle()` hooks.server snippet at :326-352. The SvelteKit guide links to it from docs/platforms/javascript/guides/sveltekit/index.mdx:69 and manual-setup__v10.7.0.mdx:30,329, both of which call it "Cloudflare Pages" only.
Three gaps against develop:
1. The Vite snippets say `import { sentrySvelteKit } from "@sentry/sveltekit"` (platform-includes/getting-started-complete/javascript.sveltekit.mdx:383, and again :421 and :476). On develop `sentrySvelteKit` is only exported from `@sentry/sveltekit/vite` - the main entry does not export it (packages/sveltekit/src/index.worker.ts has `// export * from './vite';` commented out, and index.server.ts/index.types.ts never mention vite). Verified: `import * as m from '@sentry/sveltekit'` -> `'sentrySvelteKit' in m === false`.
2. Nothing on the page mentions Workers (only Pages wording upstream) or shows a wrangler.jsonc with `main: .svelte-kit/cloudflare/_worker.js` + `assets`, which is what adapter-cloudflare 5 needs to run under `wrangler dev`.
3. Nothing warns that pulling a CJS database driver into a route breaks `vite build`, nor documents the `ssr.noExternal` escape hatch.
