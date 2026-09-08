# verify4 M-express-cf route names

sink:  PORT=53177 node $REPRO/_toolbox/sink.mjs

A1 baseline (plain wrangler, no workaround):
  npx wrangler dev --config wrangler.A1.jsonc --port 54301 --inspector-port 0
A2 workaround (plain wrangler + res.end middleware, static):
  npx wrangler dev --config wrangler.A2.jsonc --port 54302 --inspector-port 0
A3 workaround under stream lifecycle:
  npx wrangler dev --config wrangler.A3.jsonc --port 54306 --inspector-port 0
B  vite plugin, lazy app (static then stream):
  npx vite build --config vite.config.B.mjs
  npx wrangler dev --config distB/v4x_express_b/wrangler.json --port 54303 --inspector-port 0
  npx wrangler dev --config distB/v4x_express_b/wrangler.json --var LIFECYCLE:stream --port 54304 --inspector-port 0
C  vite plugin, top-level app.get + app.listen (crashes):
  npx vite build --config vite.config.C.mjs
  npx wrangler dev --config distC/v4x_express_c/wrangler.json --port 54305 --inspector-port 0

The workaround middleware lives in routes2.js (sentryExpressRouteNames).
