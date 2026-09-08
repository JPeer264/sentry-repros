# verify4-M-nextjs-cf-dbspans

Next 15.5.25 (App Router, src/) + @opennextjs/cloudflare 1.20.6 + @sentry/nextjs 10.67.0 (develop
tarballs) on workerd (wrangler 4.129.0 dev, compatibility_date 2026-05-01, nodejs_compat).
MariaDB 11 on 127.0.0.1:3307. Sink on 45211, worker on 45212.

Run: npx opennextjs-cloudflare build && npx wrangler dev --port 45212 --inspector-port 0

Variants (each is a `next.config.js` / route shape; logs kept per variant):
  A build-A.log / wrangler-A.log  documented wiring, mysql2 pool without options
  B build-B.log / wrangler-B.log  A + serverExternalPackages filtered to drop mysql/mysql2
  C build-C.log / wrangler-C.log  B + buildTimeInstrumentation:false (isolates transform vs bundling)
  D build-D.log / wrangler-D.log  documented wiring + mysql2 `disableEval: true`   <-- the fix
  E build-E.log / wrangler-E.log  D + traceLifecycle 'stream'

## Re-verification run F (fresh npm install, fresh build, ports sink 51873 / worker 51874)

next.config.js = documented wiring (variant D/A shape), sentry.server.config.ts traceLifecycle 'stream',
/api/db2 = mysql2 pool with `disableEval: true`, /api/db = mysql@2 (default externalization).

  npm install --no-audit --no-fund
  npx opennextjs-cloudflare build            # build-F.log
  PORT=51873 node ../../qs/sink.mjs          # sink-F.log
  npx wrangler dev --port 51874 --inspector-port 0   # wrangler-F.log
  curl /api/db2 -> HTTP 200 {"driver":"mysql2","rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]}
  curl /api/db  -> HTTP 200 {"driver":"mysql","rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]}

sink __items:
  span ['resolve page components', 'db mysql2.pool.connect', 'db mysql2.connect', 'db SELECT users']
  span ['executing api route (app) /api/db2/route', 'start response', 'http.server GET /api/db2']
  span ['resolve page components']
  span ['executing api route (app) /api/db/route', 'start response', 'http.server GET /api/db']   <- mysql@2: no db span

Conclusion: mysql2 gives db spans AND a working query on workerd once the app passes mysql2's own
`disableEval: true` (workerd forbids `new Function`; unrelated to Sentry). mysql@2 still gets no spans
under the default wiring: @sentry/nextjs keeps all instrumented packages except `ioredis` external
(BUNDLE_SAFE_INSTRUMENTED_PACKAGES in packages/nextjs/src/config/diagnosticsChannelInjection.ts), so they
depend on the runtime module hook, which cannot register on workerd. Forcing mysql into the webpack
bundle (variant B) does produce `db SELECT id, name FROM users`, but the bundled mysql@2 then fails with
PROTOCOL_INCORRECT_PACKET_SEQUENCE, and variant C shows that failure happens with
buildTimeInstrumentation:false too, i.e. it is the bundling, not Sentry.
