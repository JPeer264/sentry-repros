# verify4-M-sveltekit-cf-routenames

## What it re-tests

Independent re-test of the capability **route names** of cell `M-sveltekit-cf` (see `$REPRO/cells/M-sveltekit-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `bB1.log`, `bB2.log`, `bB3.log`, `bB4.log`, `bB5.log`, `build0.log`, `build1.log`, `build2.log`, `build3.log`, `build4.log`, `npm-install.log`, `npm1.log`, `npm2.log`, `sink.log`, `sink.pid`, `sinkB.log`, `sinkB.pid`, `wB1.log`, `wB2.log`, `wB3.log`, `wB4.log`, `wB5.log`, `wr.pid`, `wr0.log`, `wr1.log`, `wr2.log`, `wr3.log`, `wr4.log`, `wrB.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** confirmed-broken

Reproduced the reported behavior exactly, with the documented wiring, and could not refute it. Probe dir: $SCRATCH/deep/verify4-M-sveltekit-cf-routenames/ (app/, logs bB1-bB5.log builds, wB1-wB5.log wrangler, sinkB.log). Same stack as reported: SvelteKit 2.70.3 / svelte 5.57.0 / adapter-cloudflare 5.1.0 / vite 6.4.3, @sentry/sveltekit 10.67.0 from $REPRO/_toolbox/pack, wrangler 4.129.0, compatibility_date 2026-05-01 + nodejs_compat. Sink on 37421, worker on 37422.

Commands: (cd app && npm install --no-audit --no-fund) ; PORT=37421 node $REPRO/_toolbox/sink.mjs & ; (cd app && npx vite build && npx wrangler dev --port 37422 --inspector-port 0) ; curl -s http://127.0.0.1:37422/users/42 ; curl -s "http://127.0.0.1:37422/sentinel?n=N" ; curl -s "http://127.0.0.1:37421/__items?raw=1".

VARIANT 1 - docs wiring exactly as in ~/dev/sentry-docs/platform-includes/getting-started-complete/javascript.sveltekit.mdx:331-352 (sequence(initCloudflareSentryHandle({...}), sentryHandle())), stream lifecycle (develop default). Segment loses the route:
  {"name": "GET /users/[id]", "is_segment": false, "attrs": {"sentry.origin": "auto.http.sveltekit", "sentry.op": "http.server", "url.path": "/users/42", "http.route": "/users/[id]"}}
  {"name": "GET", "is_segment": true, "attrs": {"sentry.origin": "auto.http.cloudflare", "sentry.op": "http.server", "sentry.segment.name.source": "url", "url.path": "/users/42"}}
Worse than reported: this is not limited to parameterized routes. A plain static route loses its name too, because the Cloudflare wrapper only keeps a name whose source is already 'route' (i.e. only "/"):
  {"name": "GET /sentinel", "is_segment": false, ...auto.http.sveltekit...}
  {"name": "GET", "is_segment": true, "attrs": {"sentry.origin": "auto.http.cloudflare", "sentry.segment.name.source": "url", "url.path": "/sentinel"}}

VARIANT 2 - same wiring, traceLifecycle: 'static'. Segment carries the raw URL:
  TX GET /users/42 {"source": "url"} {"sentry.origin": "auto.http.cloudflare", "sentry.op": "http.server", "sentry.segment.name.source": "url", "url.path": "/users/42"}
    span GET /users/[id] {"sentry.origin": "auto.http.sveltekit", "http.route": "/users/[id]"}
  TX GET /sentinel {"source": "url"} ... span GET /sentinel ...

VARIANT 3 - SvelteKit native tracing (svelte.config.js kit.experimental.tracing.server = true), stream lifecycle. This makes it strictly WORSE, not better: sentryHandle skips its own span (kitTracingEnabled), Kit's root span never materializes on Cloudflare, and no route-named http.server span exists at all - the route survives only as an attribute on a `function` span:
  {"name": "sveltekit.resolve", "is_segment": false, "attrs": {"sentry.origin": "auto.http.sveltekit", "http.route": "/users/[id]", "sentry.op": "function"}}
  {"name": "sveltekit.handle.sequenced.sentryRequestHandler", "is_segment": false, "attrs": {"sentry.origin": "auto.function.sveltekit.handle", "sentry.op": "function"}}
  {"name": "GET", "is_segment": true, "attrs": {"sentry.origin": "auto.http.cloudflare", "sentry.op": "http.server", "sentry.segment.name.source": "url", "url.path": "/users/42"}}
The SDK already knows about this: packages/sveltekit/src/server-common/integrations/svelteKitSpans.ts has "in Cloudflare, the kit-emitted root span is missing but our cloudflare SDK emits the http.server span".

ROOT CAUSE (read in the worktree, not guessed). packages/cloudflare/src/wrapRequestHandlerWithInit.ts creates the segment span and comments "After the handler runs, the span name might have been updated by nested instrumentation (e.g., Remix parameterizing routes)" - i.e. the contract is that the framework layer renames the SEGMENT. packages/sveltekit/src/server-common/handle.ts does not: outside Kit tracing it unconditionally `startSpan(...)`s a NEW child with the route name/http.route, and inside Kit tracing it only renames `event.tracing.root`, which on Cloudflare is not the segment (and here does not exist). Nothing in @sentry/cloudflare or @sentry/sveltekit ever calls getRootSpan()/updateSpanName() on the Cloudflare segment.

TEST COVERAGE GAP: dev-packages/e2e-tests/test-applications/sveltekit-3-cloudflare-workers/tests/server.test.ts asserts the segment name is "GET /" for the "/" route. "/" is the one path whose URL-derived name already has source 'route', so the assertion passes while every other route is broken. The app has no parameterized route.

Errors are unaffected: the captured event still carries the right grouping name, because sentryHandle sets it on the isolation scope - {"type":"event","message":"sentinel-1","transaction":"GET /sentinel","sdk":"sentry.javascript.cloudflare"}. Only span/transaction naming is wrong.

## Workaround

A user-land `handle` inserted between `initCloudflareSentryHandle` and `sentryHandle` fixes both lifecycles. Verified working (file: app/src/hooks.server.workaround.ts in the probe dir):

  import { getActiveSpan, getRootSpan, handleErrorWithSentry, initCloudflareSentryHandle, sentryHandle } from '@sentry/sveltekit';
  import { sequence } from '@sveltejs/kit/hooks';

  const nameSegmentByRoute = ({ event, resolve }) => {
    const routeId = event.route?.id;
    const activeSpan = getActiveSpan();
    if (routeId && activeSpan && !event.isSubRequest) {
      const segment = getRootSpan(activeSpan);
      segment.updateName(`${event.request.method} ${routeId}`);
      segment.setAttributes({ 'sentry.segment.name.source': 'route', 'http.route': routeId });
    }
    return resolve(event);
  };

  export const handle = sequence(initCloudflareSentryHandle({ ... }), nameSegmentByRoute, sentryHandle());

Do NOT use Sentry.updateSpanName() here - it stamps `sentry.segment.name.source: 'custom'`; setting 'route' explicitly is what makes Sentry treat it as a parameterized route. The `!event.isSubRequest` guard keeps a same-origin `fetch` from a server `load` from renaming the outer segment.

Stream lifecycle after the workaround:
  {"name": "GET /users/[id]", "is_segment": true, "attrs": {"sentry.origin": "auto.http.cloudflare", "sentry.op": "http.server", "sentry.segment.name.source": "route", "url.path": "/users/42", "http.route": "/users/[id]"}}
Static lifecycle after the workaround:
  TX GET /users/[id] {"source": "route"} {"sentry.origin": "auto.http.cloudflare", "sentry.segment.name.source": "route", "http.route": "/users/[id]", "url.path": "/users/42"}
    span GET /users/[id] {"sentry.origin": "auto.http.sveltekit", "http.route": "/users/[id]"}

The proper SDK fix is the same three lines moved into `instrumentHandle` in packages/sveltekit/src/server-common/handle.ts: when the active span's root is not the span sentryHandle owns (the Cloudflare wrapper's segment), rename that root instead of, or in addition to, starting the child.

## Docs impact

The SvelteKit-on-Cloudflare guide must say that with `initCloudflareSentryHandle` + `sentryHandle` the transaction/segment span is named from the raw URL (`GET /users/42`, source `url`) with static trace lifecycle and from the method alone (`GET`) with span streaming - the parameterized `GET /users/[id]` name and `http.route` only reach a child span - so grouping in Sentry is broken for every route except `/`, and it must show the `getRootSpan(getActiveSpan())` + `updateName` + `sentry.segment.name.source: 'route'` handle above, placed between the two Sentry handles, as the required extra wiring; it must also warn that turning on SvelteKit's native tracing (`kit.experimental.tracing.server`) does not help and instead removes the route-named `http.server` span entirely on Cloudflare.
