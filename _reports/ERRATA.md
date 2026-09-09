# Errata for the deep probe report

Corrections found by the verification pass of 2026-09-08 that apply to the published deep probe report (`deep-probe-report.html`). The report page itself is not regenerated; read these next to it.

## Capability matrix, Bun column

- Row "Server span naming": the citation [B03] is wrong. B03 never uses `Bun.serve({ routes })` and its develop spans are named bare `GET`. The parameterized-name evidence is in B11 (`GET /hello/:name`, `origin: auto.http.bun.serve`), B09, B17 and B19. Add: under the default stream lifecycle a plain `Bun.serve` fetch handler produces method-only span names.
- Row "Handler error captured with request context", the `Bun.serve` half: cite B05 or B09, whose routes throw and whose events carry `request.url`. B03 calls `captureException` inside the handler and never throws.
- Row "Release health sessions", and finding F36: the clause "manual `startSession`/`captureSession` per request works" comes from a verification run that is not in the shipped probe B05. Treat it as record-only. That run also recorded a caveat the report drops: the manual sessions come out as `exited` with `errors: 0` even when the request captured an exception.

## Findings

- F4 (streaming on `Bun.serve`): the `node:http` comparison (907 ms full, 305 ms on abort) and the `startSpanManual` workaround come from the verification directory, not from the shipped probe B10. Record-only. The shipped `/stream` route records a 1 ms span (2 ms in the original run); "records a 0 ms span" is exact only for `/stream-cancel`.
- F11 (short-lived scripts): the `Sentry.close(2000).then(() => process.exit())` and `process.exitCode = n` variants have no file in the shipped probe B08. Record-only.
- F15 (NestJS on Bun): "once `@sentry/nestjs` is bundled together with the app" names a configuration that the shipped probe B14 does not contain. B14's variant that bundles `@sentry/nestjs` while leaving `@sentry/bun`, `core`, `node` and `server-utils` external does not boot (`ReferenceError: node is not defined`). The working shape in the record is "no `@sentry/*` package external at all" (a verification run with NestJS 12.0.1 and express 5.2.1); the working shape in the shipped probe is `build4` (everything `@sentry/*` external except `@sentry/nestjs/setup`).
- Docs coverage line for B17 ("mysql2 spans appear only when bundled"): probe B17 ships no unbundled control leg; the plain-run contrast is in B19 and in the `No diagnostics-channel injection detected` warning of B16.
- X02: the log files are named `log-bun140-*.txt` but were produced with Bun 1.4.2, as the README says.

## Probes whose sink output was not persisted

B07, B08, B18 and N7 print their sink dumps to the terminal; the README's Observed section carries the lines, the directory does not. B06 and B07 were re-run on 2026-09-08 and matched.

## Deno column and findings

**Capability matrix, "Server span naming", Deno cell.** "…method only (`GET`) under the stream
lifecycle, URL under static… [D03, D12]" - neither probe ever runs `traceLifecycle: 'static'`, so the
static half is uncited. The evidence is in D04 (`out-develop-static.txt`: `{"type": "transaction",
"name": "GET /probe", "op": "http.server", "source": "url", ...}`), D09
(`result-static.json`: `"name": "POST /throw", "source": "url"`) and D14 (`drive-http-static.out`:
`transaction: GET /hello/world | source url`). The stream half is right and is D03's and D12's own
result.

**Capability matrix, "Outgoing fetch span and headers", Deno cell.** "broken / broken (breadcrumb
only) [D04]" - D04's app never captures an event, so it emits no breadcrumbs at all (`grep -c
breadcrumb` over `out-develop-stream.txt` and `out-develop-static.txt` is 0). The breadcrumb evidence
is D02's `raw-hook-all.json`: `breadcrumb: {"category": "fetch", "data": {"method": "GET", "url":
"http://127.0.0.1:41207/__target", "status_code": 200}, "type": "http"}`, on the same request that
produced no span and no headers.

**Capability matrix, "Release health sessions", Deno cell, and F36.** "manual sessions work [D05]"
has no leg in the shipped probe - `main-d05.ts` uses only the automatic
`denoHttpIntegration({ sessionFlushingDelayMS: 2000 })` path. This is the Deno half of the B05/F36
entry already in ERRATA.md, and the record's own caveat applies here too (the manual sessions cannot
be marked `crashed`).

**F26 (Oak).** The `app.listen()` half is fully supported. The fix half - "Oak works when mounted on
`Deno.serve`… `Deno.serve({ port }, req => app.fetch(req, {}, info))` runs Oak inside the
instrumented handler: route errors are captured automatically and linked to the span" - has no
variant in the shipped D12: `app.ts`, `app-active.ts`, `oak-hook.ts` and `oak-nohook.ts` all end in
`app.listen({ port, hostname })`, and grep for `app.fetch` over `probes/D12/*.ts` finds only two
comment lines. Record-only, same class as the ERRATA's F15/B14 entry.

**F19 (OpenAI) contradicts the matrix cell it sits under.** The matrix says "develop works only via
createRequire [D17]", which is what the probe shows (`grep -c gen_ai`: `items-hook.log` 0,
`items-nohook.log` 0, `items-cjs2.log` 1). F19 instead says the way out is an import-map remap
(`"openai": "npm:openai/index.js"`) or `--conditions=require`; neither exists in `probes/D17`. F19's
middle clause - "a dynamic import after init is transformed… the transformer injects a `require()`
into an ES module and the app dies", echoed in the short version as "it turns any `.mjs` it does
transform into a crash" - also has no leg: no D17 entry dynamic-imports `openai`, and no shipped file
shows that crash. What D17 does show is `probe-format.ts`'s `load format for
openai/resources/chat/completions/completions.mjs => undefined`, and a static ESM import coming back
untransformed (`ESM create source: create(body, options) {`) with no crash.

**F41 (permissions).** Every field-level claim is supported by `out2/matrix.txt`. The recommended
guide line, `deno run --allow-net=<ingest> --allow-read=. --allow-sys=hostname,osRelease --allow-env
main.ts`, is not the flag set any shipped leg runs - `dev-nh-d` uses the unscoped `--allow-net
--allow-env --allow-read --allow-sys`, a superset. The scoped minima come from the record's
verification runs. Same for F17's "a scoped `--allow-env=DEBUG` is not enough": D02's five labels are
all-four, net-only and net+env, with no scoped `--allow-env` run anywhere.

**F49 (Fresh) - two wording fixes.** "transactions are named by raw path" - the shipped spans are
named by HTTP method only; only `/` keeps a path (`items-prod.json`: `"name": "GET /"` for the index,
bare `"GET"` for `/api/alice`, `/api2/bob`, `/boom`). And "A three-line middleware registered after
`app.use(staticFiles())` fixes both" - `items-prod-workaround.json` shows the error captured with
request context, but its span is still named bare `GET`, so the shipped run fixes the error capture
only.

**F20, F21, F48, F27 - "both versions" clauses.** F20's "confirmed on 2.8.3 and 2.9.0" is 2.9.0-only
for D15 (the README says the 2.8.3 binary is gone; X03 is the other citation). F21's 10.73.0
`mysql2Integration` clause, F48's "[N8; works on both versions]" and F23/F16/F25's 10.73.0 halves are
all record-only for the same develop-only reason.

## Deno probes whose output was not persisted

- D08 ships no result file at all (the `curl .../__items` reads went to the terminal); the verdict rests on the README and `_records/results.json` until the three dumps are committed.
- D16: the 99 MB binary size exists only as README prose; the binary is a 0-byte placeholder and `compile.log` holds the embedded-file sizes only. The Run block's `--output` path also differs from the one `compile.log` shows.
- N9: the workaround event quoted in the README (trace `3a87513472624a42ac80c5b8ebc5a717`) comes from a second run whose items file does not ship, and the K2 echo body was never saved because `drive()` discards response bodies.
- D02, D07, D15: run.sh terminal lines quoted in the Observed sections (`deno exit=0 label=...`, `DONE logger calls...`, `--- app never listened on ...`) are held by no shipped file; every value is derivable from the items files.
- D05: the D05 README quotes two blocks with fields and lines cut without an ellipsis; the verdict is unaffected.
- Unrecorded but shipped, worth adding to F22: `denoCronIntegration` is not a default integration (`packages/deno/src/sdk.ts:29-49`) although its JSDoc says it is (`deno-cron.ts:64`); an app that omits `integrations: [denoCronIntegration()]` neither crashes on 2.9.0 nor sends check-ins.
- D14 ships `main-http-hook.ts` that no Run line invokes; D09 keeps eleven stale result files whose names embed env arguments.

The full per-probe check is in `verification/probes-deno.md` and `probes-deno.json`.

## Cloudflare column and findings

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

## Cloudflare probes whose output was not persisted or not rebuilt

- C17, C19, C20, C21 and C22 have report records with `$REPRO/probes/C<n>/10.73.0` paths, but no directory and no entry in `_records/probes.json`: they were 10.73.0-only runs that the develop-only rebuild did not carry. F38 (SvelteKit, Nuxt, Next.js on Workers, React Router 7 and TanStack Start) therefore rests on C15 and on records only; the framework cells `cells/M-*-cf/` are the shipped evidence for those frameworks.
- C07: the three HTTP responses quoted in the README went to the terminal; C14: the last `sink:` line of the debug run is in no shipped file; C03: the `[tracePropagationTargets: []] sink:` line is a hand-written summary; C25: the negative-control block is trimmed to three of seven items; N2: the quoted sentinel line was copied from the record (`runtime` is a string in the shipped file).
- N3: the shipped README was a stale draft quoting ids and ports from an earlier run; replaced by the draft that matches the shipped `out-dev*.sink.json` (2026-09-08). N3 still holds an untracked 349 MB `node_modules`, which the README's Install line restores.
- N6: the runtime evidence for the five optional integrations is Bun plus an export-surface check for Cloudflare and Deno; the record's `probePath` (`probes/N6/develop/bun`, `raw-bun-dev.ndjson`) does not exist, the shipped files are `probes/N6/` and `raw.ndjson`.
- N4 ships the leftovers of an abandoned attempt (`drive-n4b.mjs`, `run-agent-rpcprop.txt`, `tscheck/docs-sample-fixed.ts`, `tscheck/tsconfig.fixed.json`, `tscheck/run-types*.txt`), as its README says.
- C02 and C18 carried the verdict `see record` in `_records/probes.json`; normalized to `works` (2026-09-08). Nineteen READMEs named the sink as `_toolbox/qs/sink.mjs`; corrected to `_toolbox/sink.mjs`.

The full per-probe check is in `verification/probes-cloudflare.md` and `probes-cloudflare.json`.
