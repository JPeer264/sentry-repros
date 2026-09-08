verify4-M-remix-bun-isolation (round 2) — REFUTED: isolation works on Bun with bunHttpServerIntegration()

S=$SCRATCH
D=$REPRO/refutations/verify4-M-remix-bun-isolation
(install line: see README-rerun.txt; node_modules and ./build were reused as-is)

Sink:      cd $D && PORT=41317 node $REPRO/_toolbox/sink.mjs > sink-v.log 2>&1 &
Bundle:    cd $D && ENTRY=./server.mjs         OUTDIR=./dist-vbase    bun build-server.ts
           cd $D && ENTRY=./server-bunhttp.mjs OUTDIR=./dist-vbunhttp bun build-server.ts
Baseline (repro of the reported break):
           NODE_ENV=production PORT=41319 SINK_URL=http://127.0.0.1:41317/ bun dist-vbase/server.js
Fix:
           NODE_ENV=production PORT=41319 SINK_URL=http://127.0.0.1:41317/ BUNHTTP_SPANS=0 \
             bun dist-vbunhttp/server-bunhttp.js
Drive:     node drive-iso2.mjs      (3 concurrent /iso/{a,b,c} + /sentinel)
           node drive-trace2.mjs    (same, with distinct incoming sentry-trace headers)
Read:      curl -s http://127.0.0.1:41317/__items

The only difference between server.mjs and server-bunhttp.mjs is the instrument file:
  instrument-bunhttp.mjs adds
    import { bunHttpServerIntegration } from '@sentry/bun';
    integrations: [bunHttpServerIntegration({ spans: false })]
No user-space withIsolationScope wrapper is needed (server-iso4.mjs from round 1 is no longer required).

Results (logs in this dir):
  vbase.log             bundled, stock init  -> one trace id for all 4 requests, tag-c on every event
  vbunhttp-nospans.log  + bunHttpServerIntegration({spans:false}) -> per-request trace id + tag, no leak,
                        route-named transactions kept (GET iso/:id + LOADER span), request/user data added
  vbunhttp-dbg.log      incoming sentry-trace continued (trace ids 000..1/2/3)
  vbunhttp-spans.log    bunHttpServerIntegration() with spans:true -> isolation also correct, but the
                        transaction is named after the express route (GET *) and the Remix span nests inside
  vbunhttp-stream.log   traceLifecycle 'stream' -> same, per-request trace ids on span envelopes
  vmodeA-bunhttp.log    plain `bun server-bunhttp.mjs` (no bundle) -> isolation correct and url-named
                        http.server transactions appear, but the error events land on a DIFFERENT trace id
                        than the transaction (the CJS monkeypatch opens a second isolation/trace inside)
