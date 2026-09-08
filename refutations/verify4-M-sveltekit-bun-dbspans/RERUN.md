# Rerun

Sink:   PORT=41317 node $REPRO/_toolbox/sink.mjs > sink.log 2>&1 &
Build:  cd app && npx vite build
Run:    PORT=42813 SENTRY_TUNNEL=http://127.0.0.1:41317/ bun build/index.js
Drive:  curl -s http://127.0.0.1:42813/api/db ; curl -s http://127.0.0.1:42813/api/hello
Read:   curl -s http://127.0.0.1:41317/__items

Toggle the workaround by adding/removing the `__pinnedChannels` block at the end of
app/src/instrumentation.server.ts, then rebuild.

Root-cause isolators (no SvelteKit needed):
  bun gctest.mjs        # subscribers survive GC only when a ref to the channel is held
  bun gctest2.mjs       # a separately-created tracingChannel(name) wrapper is enough to pin
  cd min && bun app-lazy.mjs     # lazy `import('mysql2/promise')` after GC -> no db span
  cd min && bun app-delay.mjs    # module-scope mysql2 -> db spans fine (mysql2 pins its own channels)

## Rerun 2 (2026-09-06, verify4): root cause is bun GC of diagnostics_channel, not a missed retry

Sink: PORT=41777 node $REPRO/_toolbox/sink.mjs > sink.log 2>&1 &

SvelteKit A/B (identical build, only `src/instrumentation.server.ts` differs):
  A (broken)  instrumentation.server.ts = Sentry.init only
              cd app && npx vite build && PORT=53829 SENTRY_TUNNEL=http://127.0.0.1:41777/ bun build/index.js
              curl /api/db -> {"subs":false}; span envelope = ["function sveltekit.resolve","http.server GET /api/db"]
  B (works)   add `import 'mysql2/promise';` to instrumentation.server.ts (position in the file is irrelevant)
              curl /api/db -> {"subs":true}; span envelope = ["db mysql2.pool.connect","db mysql2.connect","db SELECT users",
              "function sveltekit.resolve","http.server GET /api/db"]. Same with traceLifecycle:'static'.

micro/ (no SvelteKit, no bundler; npm install $REPRO/_toolbox/pack/sentry-{node,core,server-utils,server-runtime-injection,opentelemetry}-10.67.0.tgz mysql2@3.24.3):
  bun app.mjs    -> after init hasSubscribers=true, at query time=false, no db span   (node app.mjs: true/true + db spans)
  bun app-b.mjs  -> static import of mysql2 before init(): db spans
  bun app-c.mjs  -> globalThis-pinned dc.tracingChannel('mysql2:*'): db spans
  bun app-d.mjs  -> side-effect import after the Sentry import: db spans
  bun dc-gc.mjs / dc-gc2.mjs -> bun drops channel subscribers once the channel object is unreachable; node does not
