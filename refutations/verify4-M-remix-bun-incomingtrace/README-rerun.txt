Remix v2 on Bun 1.4.0, @sentry/remix 10.67.0 (develop) - incoming trace continuation
VERDICT: works-after-all (Mode B bundle + a 6-line express isolation/continueTrace middleware)

S=$SCRATCH
P=$S/deep/verify4-M-remix-bun-incomingtrace

Install (from $P/app):
  npm install --no-audit --no-fund \
    $S/pack/sentry-remix-10.67.0.tgz $S/pack/sentry-node-10.67.0.tgz $S/pack/sentry-core-10.67.0.tgz \
    $S/pack/sentry-react-10.67.0.tgz $S/pack/sentry-browser-10.67.0.tgz $S/pack/sentry-browser-utils-10.67.0.tgz \
    $S/pack/sentry-server-utils-10.67.0.tgz $S/pack/sentry-server-runtime-injection-10.67.0.tgz \
    $S/pack/sentry-opentelemetry-10.67.0.tgz $S/pack/sentry-bun-10.67.0.tgz \
    '@remix-run/dev@^2.17.4' '@remix-run/express@^2.17.4' '@remix-run/node@^2.17.4' '@remix-run/react@^2.17.4' \
    '@remix-run/server-runtime@^2.17.4' express@^4.21.2 react@^18.2.0 react-dom@^18.2.0 isbot@^4.1.0 vite@^5.4.11 mysql2@^3

Servers (ports used in the 2026-09-06 run):
  cd $P && PORT=52411 node sink2.mjs > sink-b.log 2>&1 &
  cd $P && PORT=52413 node recorder.mjs > recorder-b.log 2>&1 &

Build:
  cd $P/app && bun x remix vite:build
  cd $P/app && BUILD_MODE=default bun build-server.ts                    # dist-default
  cd $P/app && BUILD_MODE=express-adapter-external bun build-server.ts   # dist-express-adapter-external

Runs (all with NODE_ENV=production PORT=52415 SINK_URL=http://127.0.0.1:52411/ RECORDER_URL=http://127.0.0.1:52413):
  A  bun server.mjs                          plain            -> incoming trace OK, ZERO transactions
  B  bun dist-default/server.js              bundle           -> full spans, ONE process-global trace id, incoming trace ignored
  C  WRAP=1 bun dist-default/server.js       bundle + wrap    -> FIX: full spans AND per-request trace continuation
  D  bun dist-express-adapter-external/...   @remix-run/express external -> incoming trace OK, ZERO transactions (== A)
  E  WRAP=1 node server.mjs                  Node control     -> unchanged vs. plain Node (the middleware is a no-op there)

Drive:
  node $P/drive.mjs http://127.0.0.1:52415 '!/users/42' '!/outfetch' /db /sentinel   # '!' = send sentry-trace aaaa..-bbbbbbbbbbbbbbbb-1 + upstream baggage
  node $P/drive-iso.mjs http://127.0.0.1:52415                                       # 3 concurrent /iso/{a,b,c}, each its own upstream trace
Read:
  curl -s http://127.0.0.1:52411/__items ; curl -s http://127.0.0.1:52413/__recs

The fix is in app/server.mjs behind `process.env.WRAP === '1'`:

  app.all('*', (req, res, next) => {
    Sentry.withIsolationScope(() =>
      Sentry.continueTrace(
        { sentryTrace: req.headers['sentry-trace'] || '', baggage: req.headers['baggage'] || '' },
        () => remixHandler(req, res, next),
      ),
    );
  });

Residual gap under the fix: events carry no `request` data and no `event.transaction`
(those come from the `instrumentServer()` monkeypatch, which is dead in the bundle).
