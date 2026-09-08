# verify4 M-express-cf route names (rerun)

sink: PORT=48733 node $REPRO/_toolbox/sink.mjs   (raw attrs: curl -s 'http://127.0.0.1:48733/__items?raw')

N1  negative control, plain wrangler, stream, NO patch:
    npx wrangler dev --config wrangler.N1.jsonc --port 48805 --inspector-port 0
    -> http.server "GET" (method only)
P1  plain wrangler + patchExpressModule, traceLifecycle 'static':
    npx wrangler dev --config wrangler.P1.jsonc --port 48801 --inspector-port 0
    -> handler spans yes, transaction "GET /users/42" source=url  (root span NOT renamed)
P2  plain wrangler + patchExpressModule, traceLifecycle 'stream' (default):
    npx wrangler dev --config wrangler.P2.jsonc --port 48802 --inspector-port 0
    -> http.server "GET /users/:id", http.route=/users/:id, sentry.segment.name.source=route
Q1  plain wrangler, no patch, res.end middleware using public API, 'static':
    npx wrangler dev --config wrangler.Q1.jsonc --port 48804 --inspector-port 0
    -> transaction "GET /users/:id" source=route (no handler spans)
B2  vite plugin + lazy app, 'static':
    npx vite build --config vite.config.B2.mjs
    npx wrangler dev --config distB2/v4x_express_b2/wrangler.json --port 48803 --inspector-port 0
    -> transaction "GET /users/:id" source=route
