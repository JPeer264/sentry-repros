# verify4-M-elysia-deno-isolation

## What it re-tests

Independent re-test of the capability **isolation** of cell `M-elysia-deno` (see `$REPRO/cells/M-elysia-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration. Results for this cell and capability were recorded under the cell id, so the entries below may include the other independent attempt on the same capability.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app-a.log`, `app-a.ts`, `app-a2.log`, `app-c-nohook.ts`, `app-c-stream.log`, `app-c.log`, `app-c.ts`, `app-c2.log`, `app-d.log`, `app-d.ts`, `app-d2.log`, `deno.json`, `instrument-a.ts`, `instrument-a.ts.bak`, `instrument-c.ts`, `instrument-c.ts.bak`, `package-lock.json`, `package.json`, `pids.txt`, `routes.ts`, `run1-appA.log`, `run1-appA.pid`, `run1-appC-nohook.log`, `run1-appC-stream.log`, `run1-appC.log`, `run1-appC.pid`, `run1-appCnh.pid`, `run1-appCs.pid`, `run1-appD.log`, `run1-appD.pid`, `run1-sink.log`, `run1-sink.pid`, `sink.log`, `sink2.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

Elysia + Deno isolation works with a wiring that uses ONLY public exports. The prior report's core factual claim ("the wiring that works is not reachable through any public export ... a docs page cannot show this today") is wrong: `import { withElysia } from "@sentry/elysia"` resolves and runs fine on Deno even when the client comes from `@sentry/deno`. No deep import into `build/esm/withElysia.js` is needed. Importing `@sentry/elysia`'s package entry (which re-exports all of `@sentry/bun`) does not crash Deno and does not conflict with an already-initialized `@sentry/deno` client, because both share the one hoisted `@sentry/core` carrier.

EXACT CHANGE (working wiring, my $S/deep/verify4-M-elysia-deno-isolation/app-c.ts):
  import "@sentry/deno/import";              // optional, only needed for library instrumentation
  import * as Sentry from "@sentry/deno";
  Sentry.init({ dsn, tunnel, tracesSampleRate: 1.0 });
  import { withElysia } from "@sentry/elysia";   // public entry, NOT a deep import
  import { Elysia } from "elysia";
  const app = withElysia(new Elysia()).get(...);
  Deno.serve({ port, hostname: "127.0.0.1" }, app.fetch);
run: deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-ffi app-c.ts
install: npm install elysia@1 $S/pack/sentry-{elysia,bun,node,core,deno,opentelemetry,server-utils,server-runtime-injection}-10.67.0.tgz  (deno.json: {"nodeModulesDir":"manual"})

EVIDENCE, working wiring, traceLifecycle static, 3 concurrent GET /tag/<t> + later sentinel (sink 51811, app 51813):
{"t":"transaction","name":"GET /tag/:t","op":"http.server","src":"route","trace":"1c14c1be47454a4493f524719d6e061b","spans":["middleware Request","middleware sentryOnRequest","middleware Parse","middleware Transform","middleware BeforeHandle","handler Handle","middleware AfterHandle","middleware sentryOnAfterHandle","middleware MapResponse"]}
{"t":"transaction","name":"GET /tag/:t","op":"http.server","src":"route","trace":"7aaa703ef3bf49ad965a10b8298eb7b4",...}
{"t":"transaction","name":"GET /tag/:t","op":"http.server","src":"route","trace":"799ec3c9a2704bafb7f8e8b0c37ca155",...}
{"ex":"Error: tagged-aaa","tags":{"reqtag":"aaa"},"trace":"1c14c1be47454a4493f524719d6e061b","url":"http://127.0.0.1:51813/tag/aaa"}
{"ex":"Error: tagged-bbb","tags":{"reqtag":"bbb"},"trace":"7aaa703ef3bf49ad965a10b8298eb7b4","url":"http://127.0.0.1:51813/tag/bbb"}
{"ex":"Error: tagged-ccc","tags":{"reqtag":"ccc"},"trace":"799ec3c9a2704bafb7f8e8b0c37ca155","url":"http://127.0.0.1:51813/tag/ccc"}
{"t":"transaction","name":"GET /sentinel","op":"http.server","src":"route","trace":"12ba8b9233c045ff8f4703f31dd3b5f4",...}
{"ex":"undefined: sentinel","trace":"12ba8b9233c045ff8f4703f31dd3b5f4","url":"http://127.0.0.1:51813/sentinel"}
Four requests, four distinct trace ids, every event carries only its own tag, no leaked transaction name.

Same wiring, traceLifecycle stream (develop default, app 51815) is equally correct:
{"ev":"Error: tagged-aaa","tags":{"reqtag":"aaa"},"trace":"e180bfb243aa449da2451260b5c7cb16"}
{"ev":"Error: tagged-bbb","tags":{"reqtag":"bbb"},"trace":"46846d54217942ee8f67dabb4b4ebc22"}
{"ev":"Error: tagged-ccc","tags":{"reqtag":"ccc"},"trace":"43e383a5c877470eb29d21d80431ad0d"}
{"t":"span","trace":"e180bfb243aa449da2451260b5c7cb16","items":["middleware sentryOnRequest","middleware Request","middleware Parse","middleware Transform","middleware BeforeHandle","handler /tag/:t","middleware sentryOnAfterHandle","middleware AfterHandle","middleware MapResponse","http.server GET /tag/:t","middleware AfterResponse"]}
(x3, one per trace id; handler span low-cardinality named by route)

Also verified on the working wiring: errors get the right SDK/route ({"ex":"Error: elysia-deno-boom","mech":"auto.http.elysia.on_error","sdk":"sentry.javascript.deno","runtime":"deno","trace":"8327...","tx":"GET /boom"} plus a matching {"t":"transaction","n":"GET /boom","op":"http.server","status":"internal_error"}); incoming distributed trace is continued (sentry-trace aaaa...-bbbbbbbbbbbbbbbb-1 -> {"t":"transaction","n":"GET /tag/:t","trace":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent":"bbbbbbbbbbbbbbbb"}); outgoing headers are set on the response (sentry-trace + baggage with sentry-transaction=GET%20%2Fusers%2F%3Aid). The `@sentry/deno/import` hook is NOT required for this: app-c-nohook.ts (line 1 removed) produced three distinct trace ids and correct tags too.

WHAT REMAINS BROKEN (the prior agent's wiring A, reproduced exactly): `Sentry.init` from `@sentry/elysia` on Deno, app 51812:
{"ex":"Error: tagged-aaa","tags":{"reqtag":"ccc"},"trace":"0b0d8afbe1f94685a4451c269fb103fe","tx":"GET /users/:id","url":"http://127.0.0.1:51812/tag/ccc"}
{"ex":"Error: tagged-bbb","tags":{"reqtag":"ccc"},"trace":"0b0d8afbe1f94685a4451c269fb103fe","tx":"GET /tag/:t","url":"http://127.0.0.1:51812/tag/ccc"}
{"ex":"Error: tagged-ccc","tags":{"reqtag":"ccc"},"trace":"0b0d8afbe1f94685a4451c269fb103fe","tx":"GET /tag/:t","url":"http://127.0.0.1:51812/tag/ccc"}
{"ex":"undefined: sentinel","tags":{"reqtag":"ccc"},"trace":"0b0d8afbe1f94685a4451c269fb103fe","tx":"GET /tag/:t","url":"http://127.0.0.1:51812/sentinel"}
one process-wide trace id, every event carrying the last request's tag and even the wrong `request.url`, and each Elysia lifecycle phase emitted as its own root transaction ("Request"/"Parse"/"Handle"/... op middleware, no http.server). Cause confirmed in source: withElysia's app.wrap only calls withIsolationScope/continueTrace/startSpanManual inside `if (isBun())` ($W/packages/elysia/src/withElysia.ts, `function isBun() { return typeof Bun !== 'undefined'; }`), and the non-Bun branch relies on HTTP instrumentation that @sentry/bun does not provide for Deno.serve.

The OTHER documented wiring is also broken on Deno: the guide's Node.js tab (`new Elysia({ adapter: node() })` + `app.listen()`, @elysiajs/node installed, run with --unstable-net; without that flag Deno refuses with "Unstable API 'Deno.listen({ reusePort: true })'"). @sentry/elysia's node:http instrumentation does not attach under Deno, so it degrades identically (app 51817):
{"ev":"Error: tagged-aaa","tags":{"reqtag":"ccc"},"trace":"172dd82f257342889c7eba3ae99401a7","tx":"GET /users/:id"}
{"ev":"Error: tagged-bbb","tags":{"reqtag":"ccc"},"trace":"172dd82f257342889c7eba3ae99401a7","tx":"GET /tag/:t"}
{"ev":"Error: tagged-ccc","tags":{"reqtag":"ccc"},"trace":"172dd82f257342889c7eba3ae99401a7","tx":"GET /tag/:t"}
plus the same phase-per-transaction output.

Files (rerunnable after `npm install ...` above; node_modules removed to save disk): $SCRATCH/deep/verify4-M-elysia-deno-isolation/{app-c.ts (working), app-c-nohook.ts, app-a.ts + instrument-a.ts (documented Deno.serve wiring, broken), app-d.ts (documented Node-adapter wiring, broken), routes.ts, deno.json, run1-*.log}. Sink: `PORT=51811 node $S/qs/sink.mjs`. All processes killed, ports 51811-51817 free.

Workaround: On Deno, initialize with `@sentry/deno` (not `@sentry/elysia`) and import only the wrapper from the Elysia package: `import * as Sentry from "@sentry/deno"; Sentry.init({...}); import { withElysia } from "@sentry/elysia"; Deno.serve(port, withElysia(new Elysia()).get(...).fetch)`. @sentry/deno instruments Deno.serve, which supplies the root span, the per-request isolation scope and continueTrace that withElysia's non-Bun branch expects. No deep import, no SDK change. A source-side fix would additionally make withElysia self-sufficient by dropping the `isBun()` gate in favor of "create a root span + isolation scope unless one already exists" (e.g. `if (!getActiveSpan())`), so the documented `@sentry/elysia` wiring also works on any runtime without HTTP instrumentation.

Docs impact: The Elysia guide (~/dev/sentry-docs/docs/platforms/javascript/guides/elysia/index.mdx, whose prerequisites currently name only "Bun or Node.js 18+") needs a Deno tab saying: "On Deno, install `@sentry/deno` alongside `@sentry/elysia`, call `Sentry.init()` from `@sentry/deno` (`@sentry/elysia`'s own `init` ships the Bun SDK, which does not instrument `Deno.serve`, so requests would share one trace and one scope), and import only `withElysia` from `@sentry/elysia`; then serve with `Deno.serve(options, app.fetch)`."
