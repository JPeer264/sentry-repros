# verify4 - Express 5 on Cloudflare Workers, error capture

Note: the parent dir `../` was already occupied by another agent with the same task id;
everything here in `run-b/` is self-contained (own node_modules).

    S=$SCRATCH
    npm install express@5 wrangler@4 esbuild vite@6 @cloudflare/vite-plugin \
      $REPRO/_toolbox/pack/sentry-cloudflare-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
      $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz
    PORT=39411 node $REPRO/_toolbox/sink.mjs > sink.log 2>&1 &

Routes are shared in `src/routes.js` (`/boom` sync throw, `/boom-async` async throw,
`/boom-next` next(err), `/plain`, `/users/:id`, `/sentinel`).

| id | entry | build / run | result |
|----|-------|-------------|--------|
| a0 | src/a0.js top-level app | `wrangler dev --config wrangler.a0.jsonc --port 39421` | no error events at all |
| a1 | src/a1.js + `setupExpressErrorHandler(app)` | `wrangler dev --config wrangler.a1.jsonc --port 39422` | all 3 errors, `auto.middleware.express` handled:false |
| a6 | src/a6.js + `integrations:[expressIntegration()]` | `wrangler dev --config wrangler.a6.jsonc --port 39430` | nothing (no channels injected) |
| a2esb2 | src/a2.js lazy app | `node build2.mjs ./src/a2.js ./dist-esb2/index.js` then `wrangler dev --config wrangler.a2esb2.jsonc --port 39424` | auto `auto.http.express` handled:false + route names + handler spans, BUT a spurious `TypeError: isPromise3 is not a function` per request |
| a3esb | same, `buildTimeInstrumentation:false` | `node build3.mjs` + wrangler.a3esb.jsonc, port 39425 | control: behaves like a0, no TypeError |
| vite | src/a2.js lazy app | `vite build` + `wrangler dev --config dist-vite/v4b_express_vite/wrangler.json --port 39426` | all 3 errors auto captured, clean |
| vite2 | src/a0.js top-level app | `vite build --config vite.config2.mjs` + wrangler | worker fails to boot: "Disallowed operation called within global scope" |
| a4esb | src/a0.js top-level app, esbuild + orchestrion | `node build2.mjs ./src/a0.js ./dist-esb4/index.js` | same global-scope boot crash |
| vite3 | src/a5.js lazy app, traceLifecycle 'stream' | `vite build --config vite.config3.mjs` + wrangler, port 39429 | all 3 errors auto captured (default lifecycle is fine) |
