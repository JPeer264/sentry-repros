# verify4-M-nextjs-deno-outgoingfetch (re-verified run)

REFUTES: "Next.js 15 on Deno produces no http.client span and no trace headers for outgoing fetch."

Ports: sink 47311, recorder 53471, apps 47318-47324.
Install:  npm install   (package.json pins the $S/pack tarballs)
Build:    SINK_PORT=47311 RECORDER_PORT=53471 deno run -A node_modules/next/dist/bin/next build
Run one:  ./run.sh <tag> <FETCH_INT> <lifecycle> <port>       (deno)
          ./run-node.sh <tag> <FETCH_INT> <lifecycle> <port>  (node, control)

Results (sink-<tag>.json / rec-<tag>.json):
  base2      no integration, deno   -> no http.client span, sentry-trace null
  wcg        winterCGFetchIntegration, deno, static -> http.client span + headers
  wcgstream  same, traceLifecycle stream            -> http.client span + headers
  core       hand-rolled @sentry/core equivalent    -> http.client span + headers
  nodewcg    winterCGFetchIntegration, NODE         -> TWO http.client spans (dupe w/ undici)
  auto-deno  Deno-gated snippet, deno               -> exactly one http.client span
  auto-node  Deno-gated snippet, node               -> exactly one http.client span
