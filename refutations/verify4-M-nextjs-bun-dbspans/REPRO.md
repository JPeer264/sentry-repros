# verify4-M-nextjs-bun-dbspans - db spans DO work on Next.js 15.5.4 + bun 1.4.0

S=$SCRATCH
V=$S/deep/verify4-M-nextjs-bun-dbspans

## install (in $V/nextapp; node_modules removed after the run)
npm install --no-audit --no-fund next@15.5.4 react react-dom typescript@5 @types/node @types/react mysql2 \
  $S/pack/sentry-{nextjs,node,core,opentelemetry,server-utils,server-runtime-injection,react,browser,browser-utils,bundler-plugins,vercel-edge}-10.67.0.tgz
# mysql2 resolved to 3.24.3

## run
PORT=41337 node $S/qs/sink.mjs > $V/sink.log 2>&1 &
cd $V/nextapp && bun --bun ./node_modules/.bin/next build
KEEP_CHANNELS=1 SINK_PORT=41337 TRACE_LIFECYCLE=static bun --bun ./node_modules/.bin/next start -p 41343
curl -s localhost:41343/api/db ; curl -s localhost:41343/api/sentinel ; curl -s localhost:41337/__items
# KEEP_CHANNELS=0 is the control (reproduces the reported "no db span")

## the fix (instrumentation.ts, 4 lines) - stock next.config.mjs, stock sentry.server.config.ts
import diagnosticsChannel from 'node:diagnostics_channel';
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
    globalThis.__sentryKeptChannels = ['mysql2:query','mysql2:execute','mysql2:connect','mysql2:pool:connect']
      .map(n => diagnosticsChannel.tracingChannel(n));
  }
}
export { captureRequestError as onRequestError } from '@sentry/nextjs';

## root cause (bun 1.4.0, $V/gctest.mjs)
right after true / after gc false   <- a subscribed TracingChannel is dropped when the object is GC'd
kept after tick true / KEPT start   <- retaining any instance of the same name keeps the subscribers

mysql2 >= 3.20.0 publishes to node:diagnostics_channel itself (lib/tracing.js) and gates on
shouldTrace() = channel.hasSubscribers ?? channel.start?.hasSubscribers. The SDK subscribes eagerly in
mysql2Integration.setupOnce but keeps no reference, so on bun the gate is closed by the first GC.
Neither the import hook nor bundler injection is involved on this mysql2 version.

## files
nextapp/instrumentation.ts (keep-alive behind KEEP_CHANNELS), nextapp/next.config.mjs (stock),
nextapp/lib/db.ts (module-scope pool), nextapp/app/api/{db,sentinel,dcstate}/route.ts
gctest.mjs, sdkdc.mjs (@sentry/node, no keep-alive -> no db spans), sdkdc-keep.mjs (keep-alive -> db spans),
dctest.mjs, dctest2.mjs, dctest3.cjs, dcpatch-test.mjs
logs: app-baseline.log (report reproduced), app-keep.log, app-control.log, app-keep-stream.log

## verdicts
static, keep-alive on : GET /api/db spans = ["resolve page components","executing api route (app) /api/db/route",
  "db mysql2.pool.connect","db mysql2.connect","db SELECT id, name FROM users","start response"]
static, keep-alive off: ["resolve page components","executing api route (app) /api/db/route","start response"]
stream, keep-alive on : span envelope items ["resolve page components","db mysql2.pool.connect","db mysql2.connect",
  "db SELECT users"], origin auto.db.mysql2.diagnostic_channel
