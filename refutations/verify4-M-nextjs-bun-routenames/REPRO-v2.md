# verify4-M-nextjs-bun-routenames (second pass) - rerun recipe

S=$SCRATCH
V=$REPRO/refutations/verify4-M-nextjs-bun-routenames

## install (in $V/nextapp)
npm install --no-audit --no-fund     # package.json + package-lock.json are checked in here
ln -s $V/nextapp/node_modules $V/casedir/app/node_modules

## CONTROL: project root NOT named "app"  -> route names correct, event == transaction
cd $V/nextapp && bun --bun ./node_modules/.bin/next build
PORT=52907 node $REPRO/_toolbox/sink.mjs &
cd $V/nextapp && SINK_PORT=52907 TRACE_LIFECYCLE=static bun --bun ./node_modules/.bin/next start -p 52908 &
curl -s localhost:52908/api/users/99; curl -s localhost:52908/api/error; curl -s localhost:52908/api/sentinel
curl -s localhost:52907/__items
#  -> transaction "GET /api/users/[id]" source=route, event.transaction "GET /api/users/[id]"
# same with TRACE_LIFECYCLE=stream -> segment span "GET /api/users/[id]" op http.server

## VARIANT reproducing the reported defect: project root named "app"
cd $V/casedir/app && bun --bun ./node_modules/.bin/next build
cd $V/casedir/app && SINK_PORT=52907 TRACE_LIFECYCLE=static bun --bun ./node_modules/.bin/next start -p 52910 &
#  -> transaction "GET /app/api/users[id]" but event.transaction "GET /api/error"
# `node ./node_modules/.bin/next start -p 38477` reproduces IDENTICALLY -> not a bun issue

## Root cause (Next.js, not Sentry, not bun)
next/dist/server/route-modules/app-route/helpers/get-pathname-from-absolute-path.js
splits the resolved page path on the FIRST "/app/" occurrence. With the project root
(or any ancestor dir) named "app" the split consumes that segment instead of the
app-router dir, so Next reports next.route = "/app/api/error/route".
@sentry/nextjs hoists next.route (handleOnSpanStart.ts:57-86) -> "GET /app/api/error",
while captureRequestError uses Next's routePath -> "GET /api/error". Hence the mismatch.

## logs
build-v2-control.log build-v3-casedir.log
app-v3-control-bun.log app-v3-control-bun-stream.log app-v3-casedir-bun.log app-v4-casedir-node.log
sink-v3.log
