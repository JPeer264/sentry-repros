Round-B rerun (db spans + isolation on Bun, Remix v2 + @sentry/remix 10.67.0 develop)

Prereqs: MariaDB on 127.0.0.1:3307, node_modules present (see README-rerun.txt for the npm line),
Remix build present: bun x remix vite:build

Sink:   PORT=41337 node $REPRO/_toolbox/sink.mjs > run-b-sink.log 2>&1 &

Mode B (plugin defaults, db spans OK / isolation BROKEN):
  bun build-server.ts
  NODE_ENV=production SINK_URL=http://127.0.0.1:41337/ PORT=41338 bun dist/server.js
  bash run-b-drive.sh 41338 41337        -> run-b-modeB-items.json

Variant C (re-externalize the whole @remix-run family; isolation OK / ZERO spans, so no db spans):
  bun build-c.ts
  NODE_ENV=production SINK_URL=http://127.0.0.1:41337/ PORT=44821 bun dist-c/server.js
  bash run-b-drive.sh 44821 41337        -> run-b-modeC-items.json

FINAL2 (db spans AND isolation AND incoming trace AND request data):
  bun build-final2.ts                    (sentryBunPlugin + keep-external plugin for 'express')
  NODE_ENV=production SINK_URL=http://127.0.0.1:41337/ PORT=44825 bun dist-final2/server-final2.js
  curl /boom/7 ; bash run-b-drive.sh 44825 41337   -> run-b-modeFinal2-items.json

Negative control (same entry, express left bundled -> isolation collapses again):
  bun build-final3-noexternal.ts
  NODE_ENV=production SINK_URL=http://127.0.0.1:41337/ PORT=44827 bun dist-final3/server-final2.js
