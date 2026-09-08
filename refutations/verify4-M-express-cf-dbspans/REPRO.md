# verify4-M-express-cf-dbspans

S=$SCRATCH

npm install express@5 wrangler@4 mysql2 mysql@2.18.1 vite@6 @cloudflare/vite-plugin esbuild@0.25
npm install $S/pack/sentry-cloudflare-10.67.0.tgz $S/pack/sentry-core-10.67.0.tgz \
            $S/pack/sentry-opentelemetry-10.67.0.tgz $S/pack/sentry-server-utils-10.67.0.tgz
npm approve-scripts --allow-scripts-pending && npm rebuild   # workerd + esbuild postinstall

PORT=43211 node $S/qs/sink.mjs > sink.log 2>&1 &

# 1. WORKS - vite build + sentryCloudflareVitePlugin(), lazy express app (src/index.js)
npx vite build --config vite.config.mjs
npx wrangler dev --config dist/v4_express_db/wrangler.json --port 52411 --inspector-port 0
#    add --var LIFECYCLE:stream for the stream lifecycle

# 2. NO DB SPANS - plain wrangler dev over the same source
npx wrangler dev --config wrangler.jsonc --port 52413 --inspector-port 0

# 3. STARTUP CRASH - module-scope app.get (src2/index.js) with buildTimeInstrumentation on
npx vite build --config vite.config.b.mjs
npx wrangler dev --config distb/v4_express_db_b/wrangler.json --port 51841 --inspector-port 0

# 4. CONTROL - same module-scope app with buildTimeInstrumentation:false -> boots and serves
npx vite build --config vite.config.c.mjs
npx wrangler dev --config distc/v4_express_db_b/wrangler.json --port 52416 --inspector-port 0

curl -s http://127.0.0.1:43211/__items | python3 -m json.tool
curl -s "http://127.0.0.1:43211/__items?raw=1"   # full span attributes
