#!/bin/sh
# rerun from this directory
S=$SCRATCH
npm install --no-audit --no-fund \
  $S/pack/sentry-elysia-10.67.0.tgz $S/pack/sentry-bun-10.67.0.tgz $S/pack/sentry-node-10.67.0.tgz \
  $S/pack/sentry-core-10.67.0.tgz $S/pack/sentry-server-utils-10.67.0.tgz \
  $S/pack/sentry-server-runtime-injection-10.67.0.tgz $S/pack/sentry-opentelemetry-10.67.0.tgz elysia@1.4

# A) baseline (stream lifecycle) -> sentry.javascript.bun
PORT=41871 node sink.mjs & SINK_PORT=41871 APP_PORT=41872 bun app.ts
# B) inline init + traceLifecycle static -> sentry.javascript.bun
PORT=41881 node sink.mjs & SINK_PORT=41881 APP_PORT=41882 bun app-inline-static.ts
# C) user-land workaround: _metadata: {} passed to init -> sentry.javascript.elysia
PORT=41883 node sink.mjs & SINK_PORT=41883 APP_PORT=41884 bun app-metadata-fix.ts
# D) SDK one-line fix, then rerun A -> sentry.javascript.elysia
sed -i '' 's/applySdkMetadata(userOptions, "elysia"/applySdkMetadata(options, "elysia"/' \
  node_modules/@sentry/elysia/build/esm/sdk.js node_modules/@sentry/elysia/build/cjs/sdk.js
PORT=41891 node sink.mjs & SINK_PORT=41891 APP_PORT=41892 bun app.ts
# read: curl -s http://127.0.0.1:<sinkport>/__items
