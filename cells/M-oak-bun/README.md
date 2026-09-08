# M-oak-bun: Oak 17.2.0 (jsr:@oak/oak, installed on Bun via the JSR npm registry as @jsr/oak__oak) on Bun 1.4.0 (darwin-aarch64), @sentry/bun develop (10.67.0, tarballs from worktree audit-runtime-docs)

## What it reproduces

Headline: Oak on Bun is the best Oak result so far, and the whole story fits on one docs page, but only if the page says three things.

1. Mount shape. `Bun.serve({ fetch: req => app.fetch(req) })` gives everything: auto error capture, per-request isolation, incoming trace continuation, nested db and http.client spans, correlated logs. `app.listen()` silently loses errors (zero events without a manual capture), loses the db span entirely, detaches the fetch client span onto a process-level root trace, stamps logs with that stale trace, and leaks isolation scopes across concurrent requests (all three concurrent events carried who=charlie and one shared trace id). Root cause is the same as the Deno cell: Oak's own server drains requests through an async queue, so the handler body escapes the AsyncLocalStorage context the Bun.serve wrapper opened. Note the span origin under app.listen() is still `auto.http.bun.serve`, i.e. Oak's listen() path does use Bun.serve internally on Bun - the SDK sees the request, it is only the handler body that escapes the context. This is one SDK issue shared across Deno and Bun and probably every framework with its own accept loop.

2. Route names are not automatic, and the middleware placement matters more than on Deno. Registering the naming middleware on the ROUTER (`router.use`) rather than the application makes it run before the handler with ctx.matched already populated, so it also names the error path - `GET /error` came back source=route status=internal_error, which the Deno cell's after-next() variant could not do. `updateSpanName` alone stamps source `custom`; the explicit `SENTRY_SEGMENT_NAME_SOURCE='route'` attribute is what produces src=route.

3. Install. Oak ships on JSR only. `bun add @oak/oak` fails; the working line is an `.npmrc` with `@jsr:registry=https://npm.jsr.io` plus `npm install "@oak/oak@npm:@jsr/oak__oak@17.2.0"`. Any Oak-on-Bun page has to lead with that.

Two findings that generalize past Oak:
- The Bun baseline "no library spans without a bundle" is not universal. mysql2 produced a correctly parented `db SELECT users` span under plain `bun app.ts` with no Bun.build and no sentryBunPlugin, because mysql2 publishes its own diagnostics_channel events. The bundle is needed for drivers/frameworks the SDK has to patch, not for ones that self-publish. The docs alert at bun/index.mdx:98 telling users bundling breaks auto-instrumentation is also stale relative to sentryBunPlugin.
- Outgoing fetch works fully on Bun (span + sentry-trace + baggage), so the Deno K2 gap is Deno-only; an Oak page for Bun needs no workaround section there.

Error middleware is optional on the Bun.serve path and should be presented that way: without it the error still arrives as `auto.http.bun.serve` handled:false because Oak re-throws after logging "[uncaught application error]". A user who registers an Oak `error` event listener would stop that re-throw and then does need the manual capture.

Cleanup: all five bun processes plus my sink and recorder were killed (`kill $pid`); the remaining sink.mjs/recorder.mjs processes on the box belong to other agents. `rm -rf node_modules` ran, freeing 125M; rerunning needs the two npm install lines above.

This directory is the original run of 2026-09-06 and 2026-09-07, kept as it was. This README was generated from the recorded result; the rebuilt cells carry a hand-written README.

## Setup the docs would show

Oak runs on Bun. As on Deno, the mount shape decides whether the SDK works at all: `Bun.serve({ fetch: req => app.fetch(req) })` works end to end; `app.listen()` is effectively unsupported.

Install (Oak is JSR-only, so a docs page must show the JSR npm registry step — `bun add @oak/oak` alone fails):
  .npmrc:
    @jsr:registry=https://npm.jsr.io
  npm install "@oak/oak@npm:@jsr/oak__oak@17.2.0"
  npm install @sentry/bun mysql2
(In this probe the SDK came from the develop tarballs: `npm install $S/pack/sentry-{bun,node,core,opentelemetry,server-utils,server-runtime-injection}-10.67.0.tgz mysql2`. `bun add` cannot resolve the tarballs' transitive @sentry/*@10.67.0 deps; npm install + `bun app.ts` is fine.)

instrument.ts:
  import * as Sentry from "@sentry/bun";
  Sentry.init({ dsn: "___PUBLIC_DSN___", tracesSampleRate: 1.0 });

app.ts:
  import "./instrument";                 // must be the first line (or `bun --preload ./instrument.ts app.ts`)
  import * as Sentry from "@sentry/bun";
  import { Application, Router } from "@oak/oak";
  import mysql from "mysql2";

  const db = mysql.createConnection({ host: "127.0.0.1", port: 3307, user: "root", database: "app" }); // MODULE SCOPE

  const router = new Router();

  // route naming: register this as ROUTER middleware, not application middleware.
  // ctx.matched is already populated here and it runs BEFORE the handler, so it also
  // names the span on the error path.
  router.use((ctx, next) => {
    const span = Sentry.getActiveSpan();
    const route = ctx.matched?.at(-1)?.path;
    if (span && route) {
      Sentry.updateSpanName(span, `${ctx.request.method} ${route}`);
      span.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, "route");
    }
    return next();
  });

  router.get("/users/:id", ctx => { ctx.response.body = { id: ctx.params.id }; });

  const app = new Application();
  app.use(router.routes());
  app.use(router.allowedMethods());

  // Correct mount. app.listen() must NOT be used.
  Bun.serve({ port: 3000, hostname: "127.0.0.1", fetch: (req: Request) => app.fetch(req) });

Run: `bun app.ts` (no bundle, no Bun plugin needed for any capability probed here, including the mysql2 db span).

No error middleware is needed on this path: Oak's `fetch` logs "[uncaught application error]" and then re-throws, so the error escapes into the Bun.serve wrapper and the SDK captures it automatically.

## Install and Run

Recorded commands; paths under `$SCRATCH` were the session working directory, the same files are in this directory:

```
cd $S/deep/M-oak-bun

# oak from JSR via the npm-compat registry (bun add @oak/oak alone does not work)
printf '@jsr:registry=https://npm.jsr.io\n' > .npmrc
npm install --no-audit --no-fund "@oak/oak@npm:@jsr/oak__oak@17.2.0"
npm install --no-audit --no-fund $S/pack/sentry-bun-10.67.0.tgz $S/pack/sentry-node-10.67.0.tgz \
  $S/pack/sentry-core-10.67.0.tgz $S/pack/sentry-opentelemetry-10.67.0.tgz \
  $S/pack/sentry-server-utils-10.67.0.tgz $S/pack/sentry-server-runtime-injection-10.67.0.tgz mysql2

# viability check without Sentry
APP_PORT=41377 MOUNT=serve  bun bare.ts     # -> {"id":"7"}
APP_PORT=41378 MOUNT=listen bun bare.ts     # -> {"id":"7"}

PORT=41401 node sink.mjs > sink.log 2>&1 &      # extended sink (span trace/parent/source/db attrs, log trace)
PORT=41402 node recorder.mjs > rec.log 2>&1 &   # records sentry-trace/baggage on inbound requests

# the four runs behind the evidence
SINK_PORT=41401 REC_PORT=41402 APP_PORT=41403 MOUNT=serve  LIFECYCLE=stream                bun app.ts
SINK_PORT=41401 REC_PORT=41402 APP_PORT=41404 MOUNT=serve  LIFECYCLE=stream NAMING=off ERRMW=off bun app.ts
SINK_PORT=41401 REC_PORT=41402 APP_PORT=41406 MOUNT=serve  LIFECYCLE=static                bun app.ts
SINK_PORT=41401 REC_PORT=41402 APP_PORT=41405 MOUNT=listen LIFECYCLE=stream                bun app.ts
SINK_PORT=41401 REC_PORT=41402 APP_PORT=41407 MOUNT=listen LIFECYCLE=stream ERRMW=off      bun app.ts

# drive (A=http://127.0.0.1:<APP_PORT>)
curl -s $A/users/7 ; curl -s $A/error ; curl -s $A/db ; curl -s $A/log ; curl -s $A/downstream
curl -s -H 'sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-1111111111111111-1' \
        -H 'baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-public_key=public,sentry-sampled=true' $A/users/9
curl -s $A/iso/alpha & curl -s $A/iso/bravo & curl -s $A/iso/charlie &   # concurrency
curl -s $A/sentinel                                                      # sentinel, then read the sink
curl -s http://127.0.0.1:41401/__items ; curl -s 'http://127.0.0.1:41401/__items?raw=1'
curl -s http://127.0.0.1:41402/__hits
curl -s -X DELETE http://127.0.0.1:41401/__items
```

Files: `.npmrc`, `app-listen-noerrmw.log`, `app-listen-stream.log`, `app-serve-bare.log`, `app-serve-static.log`, `app-serve-stream.log`, `app.pid`, `app.ts`, `app2.pid`, `app3.pid`, `app4.pid`, `app5.pid`, `bare-listen.log`, `bare-serve.log`, `bare.ts`, `instrument.ts`, `package-lock.json`, `package.json`, `rec.log`, `rec.pid`, `recorder.mjs`, `sink.log`, `sink.mjs`, `sink.pid`

## Expected

| Capability | Verdict | Detail |
| --- | --- | --- |
| errors | works | Bun.serve(app.fetch), no middleware: the handler throw is captured automatically with mechanism `auto.http.bun.serve`, handled:false, hasContextLine true, sdk sentry.javascript.bun, and the request span goes status=error; Oak does not swallow it (it logs "[uncaught application error]" and re-throws out of app.fetch). With an optional try/catch middleware the event instead carries mechanism `oak` handled:false and dedupeIntegration keeps only one. Stream and static lifecycle both. Under app.listen() the error NEVER reaches Sentry unless a manual middleware captures it, and the manual capture then lands on a stale process-level trace id. |
| route names | partial | Out of the box the span is `http.server GET` with sentry.segment.name.source = url (stream) / transaction `GET` (static): Bun.serve names the span before Oak has matched anything, and Oak's fetch mount gives Bun.serve no `routes:{}` map. A 6-line ROUTER-level middleware reading ctx.matched.at(-1).path plus updateSpanName + SENTRY_SEGMENT_NAME_SOURCE='route' produces `http.server GET /users/:id` src=route (stream) and `GET /users/:id` source=route (static). Because it is router middleware and runs before the handler, it also names the error path: static gave `GET /error` source=route status=internal_error, unlike the Deno cell where the after-next() middleware missed it. Under app.listen() the middleware is a silent no-op (getActiveSpan() is undefined for all 9 requests). |
| isolation | works | Bun.serve(app.fetch), stream lifecycle: three concurrent GET /iso/:tag requests (each setTag('who', tag), 60-120ms await, setTag('who2', tag), captureException) produced three events with exactly their own tags {who: X, who2: X} and three distinct trace ids, each equal to its own http.server span trace id. Under app.listen() this is broken exactly as on Deno: all three events carried who=charlie and one shared stale trace id a2cdf2f5080346759b636800a82cb887. |
| incoming trace | works | A request carrying sentry-trace + baggage continues the trace before Oak is involved (the Bun.serve wrapper runs continueTrace). Stream: `http.server GET /users/:id` with trace_id aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa and parent_span_id 1111111111111111. Static: transaction `GET /ok` trace cccccccccccccccccccccccccccccccc parent 3333333333333333. This is the one capability that also works under app.listen() (trace bbbb... parent 2222222222222222), because it is read in the Bun.serve callback, not in the handler. |
| outgoing fetch | works | fetch() from inside an Oak handler to a local recorder produced `http.client GET 127.0.0.1` (origin auto.http.fetch) as a child of the request segment on the same trace id, and the recorder saw both headers: sentry-trace 0b22b3d098774f229c80398d8f002378-899c8c8d7d6377f8-1 and a full baggage with sentry-transaction=GET%20%2Fdownstream. Static lifecycle nests it as `http.client GET http://127.0.0.1:41402/rec/from-oak` inside the `GET /downstream` transaction. No Deno-style K2 gap on Bun. Under app.listen() the client span still fires and still carries headers, but as its own root segment on the process-level trace, disconnected from the request. |
| db spans | works | Module-scope mysql2 connection queried in the handler: stream gives `db SELECT users` with parent_span_id = the request segment and the same trace id, origin auto.db.mysql2.diagnostic_channel, db.query.text 'SELECT id, name FROM users', db.system mysql; static nests `db SELECT id, name FROM users` inside the `GET /db` transaction. Instrumentation path: NONE was needed - plain `bun app.ts`, no Bun.build/sentryBunPlugin bundle, because mysql2 publishes its own diagnostics_channel events that the SDK subscribes to. (A driver without native diagnostics_channel support would still need the sentryBunPlugin bundle per the Bun baseline.) Under app.listen() the db span disappears entirely - it is not emitted at all, not even as a detached root. |
| logs | works | Sentry.logger.info('hello from oak', { route: '/log' }) inside a handler arrived as a log envelope correlated to the request: `info: hello from oak :: trace=865f3beb418f416dacf9e2abd9300128`, the same trace id as the `http.server GET /log` span. Stream lifecycle, Bun.serve mount. Under app.listen() the log arrives but is stamped with the stale process trace (a2cdf2f5...) instead of the request's. |
| client errors | not-run | Oak is a server-only framework with no browser surface; this probe ran server-side on Bun only. |

## Observed

Not re-run in the rebuild. The recorded evidence of the original run:

```
### Bun.serve(app.fetch), stream, WITHOUT any middleware (baseline)
EVENT Error: oak bun boom mech= auto.http.bun.serve handled= False
SPAN ['http.server GET'] [('GET', None, 'ok')]
SPAN ['http.server GET'] [('GET', None, 'error')]
SPAN ['db SELECT users', 'http.server GET'] [('SELECT users', None, 'ok'), ('GET', None, 'ok')]
GET | src= url
GET | src= url

### Bun.serve(app.fetch), stream, WITH the router-level naming middleware
{"type": "span", "trace_id": "c73bbd5827cd4b5c8b7f038c67b5f404", "items": ["http.server GET /users/:id"], "raw": [{"name": "GET /users/:id", "op": "http.server", "status": "ok", "trace_id": "c73bbd5827cd4b5c8b7f038c67b5f404", "span_id": "be016f73dcc5e4d8", "is_segment": true, "origin": "auto.http.bun.serve", "url": "http://127.0.0.1:41403/users/7"}]}
  attributes: "sentry.segment.name.source": {"value": "route"}, "sentry.custom_span_name": {"value": "GET /users/:id"}
{"type": "span", "trace_id": "61f593951c974b3384e66f74d85b949b", "items": ["db SELECT users", "http.server GET /db"], "raw": [{"name": "SELECT users", "op": "db", "trace_id": "61f593951c974b3384e66f74d85b949b", "span_id": "8cb1c3e14348a570", "parent_span_id": "bf72833d4e9a5f1e", "is_segment": false, "origin": "auto.db.mysql2.diagnostic_channel", "dbtext": "SELECT id, name FROM users", "dbsystem": "mysql"}, {"name": "GET /db", "op": "http.server", "span_id": "bf72833d4e9a5f1e", "is_segment": true, "origin": "auto.http.bun.serve"}]}
{"type": "span", "trace_id": "0b22b3d098774f229c80398d8f002378", "items": ["http.client GET 127.0.0.1", "http.server GET /downstream"], "raw": [{"name": "GET 127.0.0.1", "op": "http.client", "trace_id": "0b22b3d098774f229c80398d8f002378", "span_id": "899c8c8d7d6377f8", "parent_span_id": "89e2c3122c9259d2", "is_segment": false, "origin": "auto.http.fetch", "url": "http://127.0.0.1:41402/rec/from-oak"}, ...]}
{"type": "span", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "items": ["http.server GET /users/:id"], "raw": [{"name": "GET /users/:id", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "parent_span_id": "1111111111111111", "is_segment": true}]}
EVENT Error: iso alpha  tags= {'who': 'alpha', 'who2': 'alpha'} trace= 58acaa3063724748a6af5bf8e5557a11
EVENT Error: iso bravo  tags= {'who': 'bravo', 'who2': 'bravo'} trace= 35448218274e4ce18ca3bc1129c6b6c0
EVENT Error: iso charlie tags= {'who': 'charlie','who2':'charlie'} trace= c132d999ab8b4ab8b27b2ef114817e05
{"type": "log", "items": ["info: hello from oak :: trace=865f3beb418f416dacf9e2abd9300128"]}
recorder: [{"url":"/rec/from-oak","sentry-trace":"0b22b3d098774f229c80398d8f002378-899c8c8d7d6377f8-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=0b22b3d098774f229c80398d8f002378,sentry-transaction=GET%20%2Fdownstream,sentry-sampled=true,sentry-sample_rate=1"}]

### Bun.serve(app.fetch), static lifecycle
TX 'GET /users/:id' op= http.server source= route status= ok trace= c9d75fbc47634683829d833f9d819ad3 parent= None spans= []
TX 'GET /error' op= http.server source= route status= internal_error trace= 8c25f13986bd40358aed8aac08dcc1cb parent= None spans= []
EVENT Error: oak bun boom mech= oak handled= False trace= 8c25f13986bd40358aed8aac08dcc1cb
TX 'GET /db' op= http.server source= route status= ok spans= ['db SELECT id, name FROM users']
TX 'GET /downstream' op= http.server source= route status= ok spans= ['http.client GET http://127.0.0.1:41402/rec/from-oak']
TX 'GET /ok' op= http.server source= route status= ok trace= cccccccccccccccccccccccccccccccc parent= 3333333333333333 spans= []

### app.listen() on Bun, stream (same failure shape as Deno)
[router-use] /users/7 span=false matched=["(.*)","/users/:id"]
[router-use] /iso/alpha span=false matched=["(.*)","/iso/:tag"]
EVENT Error: iso alpha   mech= generic tags= {'who': 'charlie', 'who2': 'alpha'}   trace= a2cdf2f5080346759b636800a82cb887
EVENT Error: iso charlie mech= generic tags= {'who': 'charlie', 'who2': 'charlie'} trace= a2cdf2f5080346759b636800a82cb887
EVENT Error: iso bravo   mech= generic tags= {'who': 'charlie', 'who2': 'bravo'}   trace= a2cdf2f5080346759b636800a82cb887
SPAN ['http.client GET 127.0.0.1'] [('GET 127.0.0.1', 'a2cdf2f5080346759b636800a82cb887', None, True)]     <- own root, not a child
log ['info: hello from oak :: trace=a2cdf2f5080346759b636800a82cb887']
(no db span at all in any app.listen() run)

### app.listen() on Bun, stream, no error middleware -> error is lost
err=500
EVENT undefined: sentinel mech= generic          <- only the sentinel; the handler error produced NO event
SPAN ['http.server GET'] x3, all src= url
app log: [uncaught application error]: Error - oak bun boom
```

## Docs note

No page in ~/dev/sentry-docs mentions Oak on any runtime: `grep -rin '\boak\b' docs/platforms/javascript platform-includes` and `grep -rn '@oak/oak|jsr:@oak|oakserver' docs platform-includes` both return nothing. The Bun guide is a single 214-line page, ~/dev/sentry-docs/docs/platforms/javascript/guides/bun/index.mdx, plus configuration/integrations/contextlines.mdx. It names no framework at all and never mentions Bun.serve (`grep -n 'Bun.serve|routes:'` on that file is empty), so nothing tells a user that the mount shape decides whether the SDK works, or that server spans are method-only until they name them. Install step is `bun add @sentry/bun` (index.mdx:38) and init is `instrument.js` (index.mdx:54-59), with `bun --preload ./instrument.js app.js` at index.mdx:94-106. index.mdx:98 carries an Alert stating "Sentry's auto-instrumentation does not work with bundled code, including Bun's single-file executables" - which is the opposite of the sentryBunPlugin bundle path that the Bun baseline needs for library spans; `grep -rn 'sentryBunPlugin|bun/plugin' docs platform-includes` returns nothing, so that plugin is undocumented. Nothing in the docs mentions mysql2 or database spans on Bun either.
