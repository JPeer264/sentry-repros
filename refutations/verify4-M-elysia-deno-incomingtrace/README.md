# verify4-M-elysia-deno-incomingtrace

## What it re-tests

Independent re-test of the capability **incomingtrace** of cell `M-elysia-deno` (see `$REPRO/cells/M-elysia-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration. Results for this cell and capability were recorded under the cell id, so the entries below may include the other independent attempt on the same capability.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `appA.log`, `appA.pid`, `appA.ts`, `appB-stream.log`, `appB.log`, `appB.pid`, `appB.ts`, `appBs.pid`, `appC.log`, `appC.pid`, `appC.ts`, `appCs.pid`, `appCstream.log`, `appCstream.ts`, `appD.log`, `appD.pid`, `appD.ts`, `deno.json`, `instrumentA.ts`, `package-lock.json`, `package.json`, `r2-appA.log`, `r2-appA.pid`, `r2-appA.ts`, `r2-appB.log`, `r2-appB.pid`, `r2-appB.ts`, `r2-appBs.log`, `r2-appBs.pid`, `r2-appC.log`, `r2-appC.pid`, `r2-appC.ts`, `r2-instrumentA.ts`, `r2-sink.log`, `r2-sink.pid`, `sink.log`, `sink.mjs`, `sink.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

The underlying defect is real (withElysia's `isBun()` is false on Deno, and @sentry/bun does not instrument `Deno.serve`, so wiring A produces no root span, no isolation scope and no continueTrace), but the conclusion "not reachable through any public export / a docs page cannot show this today" is REFUTED. Two public-API wirings continue the incoming trace on Deno, both without any deep import, and both `deno check` clean.

Probe dir: $SCRATCH/deep/verify4-M-elysia-deno-incomingtrace/
Install: `npm install --no-audit --no-fund elysia@1 $S/pack/sentry-{elysia,bun,node,core,deno,opentelemetry,server-utils,server-runtime-injection}-10.67.0.tgz`
deno.json: {"nodeModulesDir":"manual"}. Sink: `PORT=52107 node sink.mjs`. Run: `PORT=<p> [LIFECYCLE=static|stream] deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-ffi <app>.ts`
Probe request (all variants): `curl -H 'sentry-trace: 12345678901234567890123456789012-1234567890123456-1' -H 'baggage: sentry-trace_id=12345678901234567890123456789012,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true' http://127.0.0.1:<p>/users/42` then `/sentinel`.

(A) REPRODUCED BROKEN — appA.ts + instrumentA.ts (@sentry/elysia init + withElysia, static). All nine lifecycle transactions land on one process-wide trace, no http.server span, isolation scope leaks the previous route into the sentinel:
{"type":"transaction","name":"Handle","op":"handler","source":"custom","trace_id":"e5dc804e836b4e56bd0bd3ce061506d2","sdk":"sentry.javascript.bun","spans":[]}
{"type":"event","message":"sentinel","sdk":"sentry.javascript.bun","runtime":"bun","transaction":"GET /users/:id","trace_id":"e5dc804e836b4e56bd0bd3ce061506d2","request":{"url":"http://127.0.0.1:52108/sentinel"}}

(B) WORKS — appB.ts: `import * as Sentry from "@sentry/deno"; Sentry.init({...})` plus `import { withElysia } from "@sentry/elysia"` (PUBLIC package entry; the @sentry/bun re-export graph loads fine on Deno, the deep import into build/esm/withElysia.js the other agent used is unnecessary). static:
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"12345678901234567890123456789012","parent_span_id":"1234567890123456","sdk":"sentry.javascript.deno","spans":["middleware Request","middleware sentryOnRequest","middleware Parse","middleware Transform","middleware BeforeHandle","handler Handle","middleware AfterHandle","middleware sentryOnAfterHandle","middleware MapResponse"]}
{"type":"transaction","name":"GET /sentinel","op":"http.server","source":"route","trace_id":"f458bfc0df2c4755a21b27a09778bfa0","sdk":"sentry.javascript.deno"}
Response headers propagate onward: `sentry-trace: 12345678901234567890123456789012-af9a0005a44131db-1` + the incoming baggage. stream (LIFECYCLE=stream) is equally correct:
{"type":"span","name":"GET /users/:id","trace_id":"12345678901234567890123456789012","parent_span_id":"1234567890123456","is_segment":true,"op":"http.server"}

(C) ALSO WORKS, and keeps `Sentry.init` in @sentry/elysia — appC.ts: `Sentry.init({ ..., integrations: [denoServeIntegration()] })` with `import { denoServeIntegration } from "@sentry/deno"` (public export from packages/deno/src/index.ts:109). static:
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","trace_id":"12345678901234567890123456789012","parent_span_id":"1234567890123456","sdk":"sentry.javascript.bun","spans":["middleware Request",...,"handler Handle",...]}
stream (appCstream.ts): {"seg":"GET /users/:id","trace":"12345678901234567890123456789012","parent":"1234567890123456","op":"http.server"}
Three concurrent requests with three different incoming trace ids stay separate (appC, static):
{"t":"transaction","name":"GET /users/:id","trace":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1","parent":"000000000000000f"}
{"t":"transaction","name":"GET /users/:id","trace":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb2","parent":"000000000000000f"}
{"t":"transaction","name":"GET /users/:id","trace":"ccccccccccccccccccccccccccccccc3","parent":"000000000000000f"}
Caveat for (C): the client still self-reports `"sdk":"sentry.javascript.bun"` and `contexts.runtime.name = "bun"` on Deno and emits session envelopes, so (B) is the cleaner recommendation; (B) reports `sentry.javascript.deno` and gets Deno's own default integrations.

(D) `@sentry/deno/import` is NOT required for this capability — appD.ts (variant C minus the hook import) still continues the trace: {"t":"transaction","n":"GET /users/:id","trace":"12345678901234567890123456789012","parent":"1234567890123456","op":"http.server","source":"route"}. The hook only matters for library (mysql etc.) instrumentation.

Reference app read: ~/dev/sentry-worktrees/audit-runtime-docs/dev-packages/e2e-tests/test-applications/elysia-node/src/app.ts uses `new Elysia({ adapter: node() })` under Node; there is no Deno e2e app for Elysia, which is why the Deno gap was never caught. Both variants type-check: `deno check appB.ts` / `deno check appC.ts` pass.

Workaround: On Deno, do not let @sentry/elysia's own init be the only wiring. Either (preferred) init with @sentry/deno and import only the helper from @sentry/elysia:

  import * as Sentry from "@sentry/deno";
  import { withElysia } from "@sentry/elysia";
  import { Elysia } from "elysia";
  Sentry.init({ dsn, tracesSampleRate: 1.0 });
  const app = withElysia(new Elysia()).get("/users/:id", ({ params }) => ({ id: params.id }));
  Deno.serve({ port: 3000 }, app.fetch);

or, to keep `Sentry.init` in @sentry/elysia, add Deno's server integration:

  import * as Sentry from "@sentry/elysia";
  import { denoServeIntegration } from "@sentry/deno";
  Sentry.init({ dsn, tracesSampleRate: 1.0, integrations: [denoServeIntegration()] });

Both require `npm install @sentry/deno` alongside @sentry/elysia; both work with traceLifecycle 'static' and 'stream'; neither needs `@sentry/deno/import` for trace continuation. A real fix in the SDK would make withElysia's runtime check cover Deno (create the root span itself when neither Bun nor an HTTP-instrumentation root span is present), or ship a `@sentry/elysia/deno` entry.

Docs impact: The Elysia guide (~/dev/sentry-docs/docs/platforms/javascript/guides/elysia/index.mdx, which today offers only Bun and Node tabs) needs a Deno tab saying: "On Deno, install `@sentry/deno` next to `@sentry/elysia`, call `Sentry.init()` from `@sentry/deno` (or add `denoServeIntegration()` from `@sentry/deno` to your `@sentry/elysia` init), and import only `withElysia` from `@sentry/elysia` — `Sentry.init()` from `@sentry/elysia` alone does not instrument `Deno.serve`, so requests get no root span, no request isolation, and no incoming `sentry-trace` continuation."

**Verdict:** works-after-all

Refuted, with a one-line change that stays inside public exports. Probe dir: $SCRATCH/deep/verify4-M-elysia-deno-incomingtrace (files r2-instrumentA.ts, r2-appA.ts, r2-appB.ts, r2-appC.ts, sink.mjs; deps already installed: `npm install $S/pack/sentry-{elysia,bun,node,core,deno,opentelemetry,server-utils,server-runtime-injection}-10.67.0.tgz elysia@1`). deno 2.9.0, elysia 1.4.30, deno.json {"nodeModulesDir":"manual"}. Sink: `PORT=47110 node sink.mjs`. Every app run as `SINK=47110 PORT=<p> LIFECYCLE=<static|stream> deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-ffi r2-app<X>.ts`. Driver: `curl -s -H 'sentry-trace: 12345678901234567890123456789012-1234567890123456-1' -H 'baggage: sentry-trace_id=12345678901234567890123456789012,sentry-environment=prod,sentry-release=upstream@1,sentry-public_key=publickey,sentry-sample_rate=1,sentry-sampled=true' http://127.0.0.1:<p>/users/42` then `/boom` then `/sentinel`.

A) Documented wiring reproduced as broken (r2-appA.ts: `import "@sentry/deno/import"; import * as Sentry from "@sentry/elysia"; Sentry.init(...)`, `Sentry.withElysia(new Elysia())`, `Deno.serve(..., app.fetch)`), traceLifecycle static. No http.server span, incoming ids ignored, isolation leaks (the /sentinel event carries transaction "GET /boom"):
{"type":"transaction","name":"Request","op":"middleware","source":"custom","trace_id":"06b50711d4554230af2cab5e2eaac00e","sdk":"sentry.javascript.bun","spans":["middleware sentryOnRequest"]}
{"type":"transaction","name":"Handle","op":"handler","source":"custom","trace_id":"06b50711d4554230af2cab5e2eaac00e","sdk":"sentry.javascript.bun","spans":[]}
{"type":"event","exception":"Error: A-boom","mechanism":"auto.http.elysia.on_error","sdk":"sentry.javascript.bun","runtime":"bun","transaction":"GET /boom","trace_id":"06b50711d4554230af2cab5e2eaac00e","request":{"headers":{"sentry-trace":"12345678901234567890123456789012-1234567890123456-1", ...}}}
{"type":"event","message":"sentinel","transaction":"GET /boom","trace_id":"06b50711d4554230af2cab5e2eaac00e","request":{"url":"http://127.0.0.1:47111/sentinel"}}

B) FIX, all public exports, no deep import into build/esm (r2-appB.ts): `import "@sentry/deno/import"; import * as Sentry from "@sentry/deno"; Sentry.init({...});` then `import { withElysia } from "@sentry/elysia";` and `withElysia(new Elysia())`. The prior report's claim that this needs a deep import (`./node_modules/@sentry/elysia/build/esm/withElysia.js`) or a new `@sentry/elysia/deno` subpath is wrong: `@sentry/elysia`'s package entry re-exports `@sentry/bun`, but importing it on Deno only loads that code, it does not init it, so the named `withElysia` export resolves and works. traceLifecycle static:
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","trace_id":"12345678901234567890123456789012","parent_span_id":"1234567890123456","sdk":"sentry.javascript.deno","spans":["middleware Request","middleware sentryOnRequest","middleware Parse","middleware Transform","middleware BeforeHandle","handler Handle","middleware AfterHandle","middleware sentryOnAfterHandle","middleware MapResponse"]}
{"type":"transaction","name":"GET /boom","op":"http.server","source":"route","trace_id":"12345678901234567890123456789012","parent_span_id":"1234567890123456","sdk":"sentry.javascript.deno","spans":[...,"middleware Error","middleware sentryOnError"]}
{"type":"event","exception":"Error: B-boom","mechanism":"auto.http.elysia.on_error","sdk":"sentry.javascript.deno","runtime":"deno","transaction":"GET /boom","trace_id":"12345678901234567890123456789012"}
{"type":"transaction","name":"GET /sentinel","op":"http.server","source":"route","trace_id":"51da6d01fbaa4aa2b7a3be985e0c5a8e","parent_span_id":null,"sdk":"sentry.javascript.deno"}
Same wiring with traceLifecycle stream also continues the trace (segment span carries the incoming parent):
{"type":"span","trace_id":"12345678901234567890123456789012","items":["middleware sentryOnRequest","middleware Request","middleware Parse","middleware Transform","middleware BeforeHandle","handler /users/:id","middleware sentryOnAfterHandle","middleware AfterHandle","middleware MapResponse","http.server GET /users/:id","middleware AfterResponse"]}
segment item: {"name":"GET /users/:id","status":"ok","parent_span_id":"1234567890123456","is_segment":true,"origin":"auto.http.deno"}
uninstrumented sentinel request: {"name":"GET /sentinel","is_segment":true,"origin":"auto.http.deno"} on trace 519373fd97844bd69cc7811f10e4ef23 (no parent) — per-request trace isolation holds.

C) Second working variant that keeps the documented `@sentry/elysia` init (r2-appC.ts): `import * as Sentry from "@sentry/elysia"; import { denoServeIntegration } from "@sentry/deno"; Sentry.init({ ..., integrations: [denoServeIntegration()] })`. Also continues the trace:
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","trace_id":"12345678901234567890123456789012","parent_span_id":"1234567890123456","sdk":"sentry.javascript.bun"}
{"type":"transaction","name":"GET /sentinel","op":"http.server","source":"route","trace_id":"2b4373c92f03450399f5263facbe040a","parent_span_id":null,"sdk":"sentry.javascript.bun"}
Downside of C: the client stays the Bun/Node client, so events are tagged `sdk: sentry.javascript.bun` / `runtime: bun` on Deno and the Deno-specific default integrations are absent. B is the recipe to document.

So the root cause stands (withElysia's `isBun()` is false on Deno, so it takes the Node branch that expects an HTTP-instrumentation root span, and `@sentry/elysia`'s own init brings the Bun SDK, which does not instrument `Deno.serve`), but the consequence "not reachable through any public export" does not: swapping only the init package fixes incoming-trace continuation, root span, route names and per-request trace isolation, with `withElysia` imported from the package entry. Reference: the repo's own e2e apps (~/dev/sentry-worktrees/audit-runtime-docs/dev-packages/e2e-tests/test-applications/elysia-{bun,node}/src/app.ts) only cover Bun and Node; there is no Deno app, which is why this gap is untested. Processes started (sink + 4 deno servers on 47110/47111/47112/47114/47115) were all killed.

Workaround: On Deno, call `Sentry.init()` from `@sentry/deno` and import only `withElysia` from `@sentry/elysia`:
import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";
Sentry.init({ dsn, tracesSampleRate: 1.0 });
import { withElysia } from "@sentry/elysia";
import { Elysia } from "elysia";
const app = withElysia(new Elysia()).get("/users/:id", ({ params }) => params);
Deno.serve({ port: 3000 }, app.fetch);
Install both packages (`npm i @sentry/deno @sentry/elysia elysia`) with deno.json `{"nodeModulesDir":"manual"}` (or "auto"). Works with traceLifecycle static and stream. Alternative if you want to keep `Sentry.init` from `@sentry/elysia`: pass `integrations: [denoServeIntegration()]` imported from `@sentry/deno`; that continues the trace too but keeps reporting `sdk.name: sentry.javascript.bun`.

Docs impact: On Deno, initialize the SDK with `@sentry/deno` (`import "@sentry/deno/import";` as the first line, then `Sentry.init(...)`) and import only `withElysia` from `@sentry/elysia`, because `@sentry/elysia`'s own `init` is the Bun SDK and does not instrument `Deno.serve`, so without the Deno SDK there is no server span, no request isolation, and incoming `sentry-trace`/`baggage` headers are ignored.
