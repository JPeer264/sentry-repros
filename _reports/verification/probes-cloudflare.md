# Verification: Cloudflare probes (C01-C16, C18, C25, C26, N2-N6, N10)

25 probes checked. **C17 and C19 to C24 have no probe directory**: `probes/` holds C01-C16, C18,
C25 and C26 only, `_records/probes.json` has no entry for C17, C19, C20, C21, C22, C23 or C24, and
`INDEX.md` lists none of them. C17, C19, C20, C21 and C22 nevertheless appear in the deep report as
full probe records whose Repro blocks name `$REPRO/probes/<ID>/10.73.0` - paths that do not exist,
because those were 10.73.0-only runs and the rebuild rule was develop only
(`_toolbox/TOOLBOX.md:18-20`, "Test `develop` ONLY"). C23 and C24 are unused ids that nothing cites.

Every recorded verdict of the 25 shipped probes is supported by a result file in its own directory,
and no verdict needs changing. Twenty-four of the twenty-five Observed sections quote their own
files faithfully; **N3 does not** - its shipped README is an earlier draft whose sink ids belong to
a run whose files were not kept. The rest of the corrections are three matrix or finding citations
that point at the wrong probe, six findings whose remedy or failing half exists only in the record,
and a handful of quoted lines with no shipped source.

Two standing caveats apply to the whole set and are not repeated per probe. Every Cloudflare cell in
the capability matrix reads `develop / 10.73.0`, and every probe here was rebuilt on develop only,
so every "/ 10.73.0" half is record-only. And probe refutation runs were never shipped:
`refutations/` holds only framework cells (`verify4-*`, `verify5-*`), so anything the report
attributes to a "$SCRATCH/deep/verify2-*" run cannot be checked from a directory.

Three capabilities the brief asked about are not probed at all in this set and are not claimed to
be: `enable_nodejs_http_server_modules` with `httpServerHandler` and `mysql2 disableEval` live in
the framework cells (`cells/M-express-cf`, `M-nestjs-cf`, `M-koa-cf`, `M-hapi-cf`, `M-elysia-cf`),
not in C01-C26. No probe record claims them, so there is nothing to correct.

## Probes that need a correction

**N3 - the shipped README is a stale draft.** Its Observed section quotes ports 44320-44323 and
eight sink trace ids (`1ff3618df7f74563ad81d00b9d35b871`, `213cba3c7de9469f98546cdfef63f120`,
`2a1488c7dcfc4cadb99d69bfadcad11a`, ...) that appear in **no file in the directory**. The shipped
`out-dev*.sink.json` and `out-devA.app.log` come from the ports 44330-44333 run
(`out-devA.app.log` says `localhost:44330`), and that run's text is sitting unused in `README.new`:
`out-devA.sink.json` really contains `{"n": "SELECT users", "trace": "fa365ef92fb4401c846635fa215d07a7",
..., "origin": "auto.db.mysql"}`, which is the line `README.new` quotes. The substance is identical
in both drafts - devA wraps everything, devB is empty, devC has no db span, devD warns, devE is
silent, devF is a type error - so the verdict is unaffected. Ship `README.new` as `README.md` and
drop the `README.head` / `README.new` / `README.observed` / `README.files` / `sink.pid` leftovers.
N3 is also the only probe in this set that ships a `node_modules`, at 349 MB.

**Three matrix or finding citations point at the wrong probe.**
`Library spans: database driver, Cloudflare: works / works with the Vite plugin [C16, quick start C-vite]`
- C16 is the OpenAI probe and installs no database driver, and `quickstarts/cloudflare` has none
either (no mysql dependency, no db span in `results-vite.json`). The evidence is N3:
`out-devA.sink.json` has an `auto.db.mysql` span and `out-devC.sink.json`
(`buildTimeInstrumentation: false`) has none.
`Server span naming, Cloudflare: method only under stream, URL under static; Hono gives route names [C15]`
- C15 produces only route-named segments; it can support the last clause and nothing else. Bare `GET`
with `source: url` under stream is C10's own result (`drive.log`, `raw.json`), and URL-named
transactions under static are C13 (`POST /throw`), C06 (`GET /d1`) and C07 (`GET /r2`).
F31 `[C10, C14; confirmed twice]` - C14 produces no dedupe evidence at all: `drive.sh` sends a
unique `sentinel-$RANDOM` every run precisely to dodge Dedupe, and the behaviour survives only as
note 1 of the C14 record. C10 (`dedupe.log`, `sentinel-again.log`, `app.log:105-106`) is the probe
that shows it.

**Six findings whose failing half or remedy is record-only.**
F36 (sessions): no file in `probes/C12` imports `startSession` / `captureSession` / `endSession`
from `@sentry/core`; the working path comes from the refutation run in the report's own C12 card.
Same clause the Bun verifier flagged for B05.
F32 (`/request`): `traceLifecycle: 'static' ... fixes it` is not in the probe - none of
`wrangler.jsonc`, `wrangler-als.jsonc`, `wrangler-noflags.jsonc` or `src/index.ts` passes
`traceLifecycle`. Only the module-scope `setAsyncLocalStorageAsyncContextStrategy()` fix is shipped.
F31 (cached client): `cacheClient: false or removing the Dedupe integration restores per-request
delivery` is exercised nowhere - `functions/_middleware.js` (C10) and `src/index.ts` (C26) never
pass it, and the string does not occur in `probes/C26` at all.
F37 (Astro): the failing path the finding is about - the auto-wrap via env vars, and the browser SDK
booting inside the Worker - is explicitly "not rebuilt here" in the C18 README. Only the working
`main: sentry.server.config.ts` + `withSentry` setup is shipped.
F46 (optional integrations): "The other five ... work on all three runtimes" is shipped for Bun only.
`probes/N6` holds one Bun app plus `exports.mjs`, a static export-surface check over the Deno and
Cloudflare builds. The N6 record's own method note describes one app per runtime under
`$REPRO/probes/N6/{develop,v10730}/{bun,deno,cf}`, which the rebuild flattened away.
F50 (debug IDs): "the documented flow (`@sentry/vite-plugin`, or the wizard, or
`sentry-cli sourcemaps inject`) does produce debug IDs" is not run - `probes/N10/package.json`
installs neither, and `vite.config.ts` uses only `cloudflare()` + `sentryCloudflareVitePlugin()`.
The shipped positive control is a hand-appended `_sentryDebugIds` snippet, not the documented flow.

**C09 - the report says "confirmed twice" where the rebuild recorded a partial mismatch.**
`_records/results.json` has C09 as `matches: partial`: the ALS control did not deliver the sentinel
in the bare `curl /hello` then `curl /sentinel` sequence, over three timed runs (`als-curl.log`,
`als-curl2.log`, `als-curl3.log`). The primary finding reproduced exactly. F32's
`[C09; confirmed twice]` gives no hint that a sub-claim disagreed.

**F33 says "transaction" where develop emits a span envelope.** `raw.json` in C10 is 5 span
envelopes and 2 events; `GET /app.js` is a `span` envelope named bare `GET` with `url.path` as an
attribute. "Produces a transaction" is the 10.73.0 (static lifecycle) wording.

**F45 drops the caveat its own probe makes prominent.** Every websocket handler invocation in N5
shares one trace id for the lifetime of the Durable Object isolate: all six `webSocketMessage` and
both `webSocketClose` spans in `raw.json` are on `1b28741a3f1e4d049674dcf6f143d16e`, and so are the
two message and two close spans in `raw2.json`, from a fresh pair of sockets after the first pair
closed. A finding about undocumented websocket spans should carry it.

**Quoted lines with no shipped source.** C07's Observed opens with three HTTP response bodies
("`/r2 -> {"text":"hello r2",...}`") that exist only in `README.md` and `src/index.ts` - the Run
block curls them to the terminal. C14's last Observed line, `sink: {"type": "transaction",
"arrived": "1788771624.720", ...}`, is in no file (`grep -c 1788771624.720 app-static-debug.log` is
0). Same class as B07/B18/B08 in the Bun pass. C02 and C12 quote lines out of `node_modules`, which
is not shipped; both are correct against the SDK source and should cite it instead
(`packages/cloudflare/src/baseSdk.ts:95`, `client.ts:64`; and `index.ts`, which exports no session
API). N2's Observed prints the sentinel with `"runtime":{"name":"cloudflare"}` where
`run-prisma-sink.txt` has `"runtime": "cloudflare"` - copied from the record, not the file.

**Stale sink path in seven READMEs.** C01, C04, C10, C11, C14, C16 and N10 all describe their sink
as "`_toolbox/qs/sink.mjs`". `_toolbox/qs/` does not exist; `_toolbox/sink.mjs` is the file, and
C10's `sink.mjs` is byte-identical to it. Same class as the B11/B16 scratchpad-sink finding.

**Record fields.** `_records/probes.json` gives C02 and C18 the verdict `see record` while every
other Cloudflare probe carries works/partial/broken and both READMEs state a verdict ("works").
Same normalisation the Bun verifier asked for on B01. The N6 record's `probePath` still points at
`$REPRO/probes/N6/develop/bun` and `raw-bun-dev.ndjson`, neither of which exists.

## Report sentences to fix

1. Matrix, *Library spans: database driver*, Cloudflare - replace `[C16, quick start C-vite]` with
   N3 (devA vs devC).
2. Matrix, *Server span naming*, Cloudflare - `[C15]` supports only "Hono gives route names"; add
   C10 for method-only under stream and C13/C06/C07 for URL under static.
3. F31 - drop C14 from the citation or say the Workers half rests on a record note; and mark
   "`cacheClient: false` or removing the Dedupe integration restores per-request delivery" and the
   "(C26)" workflow leg as record-only.
4. F32 - mark "`traceLifecycle: 'static'` ... fixes it" record-only, and note that the rebuild's ALS
   control leg did not reproduce the sentinel delivery ("confirmed twice" overstates it).
5. F33 - "produces a transaction" should be "produces a span envelope" for develop.
6. F36 - mark the `@sentry/core` session path record-only for Cloudflare, as already done for B05.
7. F37 - the dead auto-wrap path and the browser-SDK-in-the-Worker symptom are record-only; C18
   ships only the working setup.
8. F38 - `[C17, C19, C22, C15]` and `[C20, C21]`: only C15 has a shipped probe.
9. F45 - add the isolate-lifetime trace pinning.
10. F46 - "work on all three runtimes" is shipped for Bun plus an export surface for the other two.
11. F50 - the "documented flow does produce debug IDs" refutation is record-only.
12. Docs coverage, C06 - "wrapping it again does not duplicate spans" is record-only; the shipped
    probe says the wrapper is not exported on develop.
13. "Behaviors with no page at all: ... C20 ..." - C20 has no directory.

## SDK claims spot-checked at the audit pin (6f2da7483d)

Every SDK-level cause the records name holds, by file and line:

- `packages/cloudflare/src/wrapRequestHandlerWithInit.ts:169` - `span.end();` inside the catch, with
  no error status, before `captureException`. This is C01/F28's missing `http.response.status_code`.
- `packages/cloudflare/src/request.ts` - `wrapRequestHandler` never calls
  `setAsyncLocalStorageAsyncContextStrategy()`, while `withSentry.ts:40`, `pages-plugin.ts:78`,
  `durableobject.ts:54` and `instrumentations/instrumentWorkerEntrypoint.ts:153` all do. C09/F32.
- `packages/cloudflare/src/instrumentations/worker/instrumentFetcher.ts:5-6` - JSDoc says "create a
  span and propagate trace headers"; the body only merges headers. C08/C25/F40.
- `packages/cloudflare/src/instrumentations/worker/instrumentEnv.ts` - branches for D1 (:64),
  Queue (:70), R2 (:77) and the AI binding (:94); none for KV. F35 and the Native-runtime-APIs cell.
- `packages/cloudflare/src/workflows.ts:115-120,151` -
  `const isFinalAttempt = !hasStepContext || attempt > retryLimit;` gates the capture. C26/F34.
- `packages/cloudflare/src/integrations/httpServer.ts:88-91` - `maxRequestBodySize` wins and the
  `dataCollection.httpBodies` check is the fallback. C13/F30.
- `packages/cloudflare/package.json` exports are exactly `["./package.json", ".", "./request",
  "./vite"]`, and `prismaIntegration` is re-exported at `src/index.ts:125`. N2/F42.
- `packages/cloudflare/src/index.ts` exports no `instrumentD1*` and no session API; no
  `contextLinesIntegration` exists anywhere under `packages/cloudflare/src`. C06, C12/F36, N6/F46.
- `enableRpcTracePropagation` appears nowhere in `packages/cloudflare/src`;
  `rpcTracePropagationBindings` is declared at `src/client.ts:360`. C25, N4/F44.
- `packages/cloudflare/src/instrumentations/agents/types.ts:61-70` - `getAgentAttributes` sets only
  `GEN_AI_AGENT_NAME` from `instance._ParentClass?.name`, while the JSDoc at `types.ts:39` still
  describes `name` as "reported as the `cloudflare.agent.name` span attribute";
  `instrumentChatAgentConversation.ts:35` stores `uuid4()`. N4/F44.
- `packages/cloudflare/src/vite/index.ts:42` says options come from a co-located `instrument.*` file
  while `vite/instrumentFile.ts:15` hardcodes `'instrument.server'`; `withSentry.ts:35-37` routes a
  `WorkerEntrypoint` class to `instrumentWorkerEntrypoint`. N3/F43.
- The debug-id grep over `packages/cloudflare/src/vite/` returns 0 hits and
  `packages/bun/src/plugin.ts` is a single re-export of `sentryOrchestrionPlugin`. N10/F50.

## Probes confirmed

C01, C02, C03, C04, C05, C06, C07, C08, C10, C11, C13, C15, C16, C25, C26, N2, N4, N5, N10 -
verdict supported by a result file in the directory, Observed faithful to those files, program
exercising the case the summary names. C09, C12, C14, C18 and N6 also have their verdicts supported;
their corrections are about report sentences and, for C18 and N6, about legs the record covers that
the rebuild did not ship. N3's verdict is supported; its README is the problem.

No probe installs a broken `package.json`: every `file:` tarball path in all 25 directories resolves
to a file under `_toolbox/pack/`, so the `$REPRO`-anonymisation breakage the Bun verifier found in
B06/B14 does not occur here.

## Re-runs

None. The brief forbade running probes, installing anything, or running git; every finding above
comes from reading the shipped files and the SDK worktree.
