# verify4 M-koa-cf route names

npm install koa@3 @koa/router wrangler@4 vite@7 @cloudflare/vite-plugin \
  $REPRO/_toolbox/pack/sentry-{cloudflare,core,server-utils,server-runtime-injection,opentelemetry}-10.67.0.tgz

sink: PORT=52739 node $REPRO/_toolbox/sink.mjs

A  module-scope app.use() + Vite plugin  -> worker does NOT boot
   npx vite build --config vite.config.A.mjs
   npx wrangler dev --config distA/v4koa_a/wrangler.json --port 52741 --inspector-port 0
B  lazy app (built inside fetch) + Vite plugin (autoInstrumentation:false) -> route names
   npx vite build --config vite.config.B.mjs
   npx wrangler dev --config distB/v4koa_b/wrangler.json --port 52743 --inspector-port 0
   npx wrangler dev --config distB/v4koa_b/wrangler.json --var LIFECYCLE:static --port 52745 --inspector-port 0
C  lazy app + bare sentryCloudflareVitePlugin() (all defaults) -> route names
   npx vite build --config vite.config.C.mjs
   npx wrangler dev --config distC/v4koa_c/wrangler.json --port 52747 --inspector-port 0
D  lazy app, plain wrangler, NO Vite plugin -> reproduces the reported "GET" only
   npx wrangler dev --config wrangler.B.jsonc --port 52749 --inspector-port 0

App: routes.js (shared koa app), srcA/index.js (module scope), srcB/index.js (lazy).
