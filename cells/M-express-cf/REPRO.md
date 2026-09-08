# M-express-cf repro

npm install express@5 wrangler@4 mysql2 vite@6 @cloudflare/vite-plugin
npm install $REPRO/_toolbox/pack/sentry-cloudflare-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
            $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz

# A) plain wrangler (no build-time instrumentation)
npx wrangler dev --port 41337 --inspector-port 0

# B) vite build (build-time instrumentation on)
npx vite build && npx wrangler dev --config dist/m_express_cf/wrangler.json --port 41342 --inspector-port 0

# C) control: top-level app.get + app.listen, buildTimeInstrumentation:false
npx vite build --config vite.config.b.mjs
npx wrangler dev --config distb/m_express_cf_b/wrangler.json --port 41343 --inspector-port 0

PORT=41338 node $REPRO/_toolbox/sink.mjs   # envelope sink
node recorder.mjs                # header recorder on 41339
