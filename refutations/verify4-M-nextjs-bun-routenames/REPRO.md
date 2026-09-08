# verify4-M-nextjs-bun-routenames - rerun recipe

S=$SCRATCH
V=$S/deep/verify4-M-nextjs-bun-routenames

## install (in $V/nextapp)
npm install --no-audit --no-fund next@15.5.4 react react-dom typescript@5 @types/node @types/react \
  $S/pack/sentry-{nextjs,node,core,opentelemetry,server-utils,server-runtime-injection,react,browser,bundler-plugins}-10.67.0.tgz

## control: project root NOT named "app"  -> correct route names
cd $V/nextapp && bun --bun ./node_modules/.bin/next build
PORT=57419 node $S/qs/sink.mjs > $V/sink2.log 2>&1 &
SINK_PORT=57419 TRACE_LIFECYCLE=static bun --bun ./node_modules/.bin/next start -p 57423
curl -s localhost:57423/api/users/99 ; curl -s localhost:57423/api/error ; curl -s localhost:57423/api/sentinel
curl -s localhost:57419/__items

## variant: project root named "app" (as in the M-nextjs-bun probe) -> "/app" prefix
cd $V/casedir/app && bun --bun ./node_modules/.bin/next build   # node_modules is a symlink to ../../nextapp/node_modules
SINK_PORT=57419 TRACE_LIFECYCLE=static bun --bun ./node_modules/.bin/next start -p 57421
# same with plain `node ./node_modules/.bin/next start -p 57422` reproduces identically

## logs kept
build1.log build2.log build3.log app1.log app3.log app4.log app5.log app6.log sink1.log sink2.log
