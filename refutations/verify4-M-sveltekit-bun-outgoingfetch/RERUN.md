# verify4-M-sveltekit-bun-outgoingfetch

SvelteKit 2.63 (svelte 5, adapter-node 5.x, vite 8) + @sentry/sveltekit 10.67.0 (develop) on bun 1.4.0,
running the adapter-node output (`bun build/index.js`).

Question: does `fetch()` in a `+server.ts` get an `http.client` span and sentry-trace/baggage?

Answer: NO by default. YES after adding `fetchIntegration()` from `@sentry/bun` to
`src/instrumentation.server.ts`. Works in BOTH trace lifecycles (unlike Remix on bun, where 'static'
drops the parentless client span - SvelteKit's sentryHandle keeps an active server span, so the
client span has a parent and survives).

The integration must be guarded by a bun check: on node it duplicates the undici-based span
(two `http.client GET 127.0.0.1` in one trace, see items-node-bunfetch-stream.json).

## Run
  bash probe.sh <label> "<runtime cmd>" <sinkport> <appport>
  e.g. bash probe.sh guarded-stream "bun build/index.js" 47631 47632
  (edit app/src/instrumentation.server.ts, `cd app && npx vite build` first)

## Variants
  baseline-stream        documented wiring, defaults           -> no client span, no headers
  bunfetch-stream        + fetchIntegration() from @sentry/bun -> http.client span + both headers
  bunfetch-static        + fetchIntegration(), static          -> client span nested in transaction
  guarded-stream         + fetchIntegration() only on bun      -> same as bunfetch-stream
  node-bunfetch-stream   node control with fetchIntegration()  -> DUPLICATE client spans
  bunfetch-static-b1314  not-run: $S/bun1314 no longer on disk
