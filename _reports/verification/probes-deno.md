# Verification: Deno probes (D01-D18, N1, N8, N9)

21 probes checked, no re-runs. Every probe program tests the case its record names, and every
recorded verdict is behaviourally right. Two probes cannot be checked against their own directory:
**D08** ships no result file at all, and **N9** quotes two lines that exist in no shipped file.
Everything else is a citation or an artefact problem, plus one record field (`D16`).

One rule applies to the whole set and is not a defect: the Deno rebuild is **develop-only**
(`@sentry/deno` 10.67.0 tarballs from `_toolbox/pack`). Every capability-matrix cell of the form
"X / Y" therefore has a `/ 10.73.0` half that no shipped file can show; it is sourced from the
record. D09's README states the rule explicitly ("10.73.0 is not installed and must not be").

## Probes that need a correction

**D08 - no result files at all.** The directory holds `deno.json`, `package.json`,
`package-lock.json`, `sentry.ts`, `natural.ts`, `denoexit.ts`, `flush.ts` and `README.md`, and
nothing else. The Run block pipes every `curl .../__items` to the terminal. The three programs do
test exactly what the record claims (natural exit / `Deno.exit(0)` with no flush / `await
Sentry.flush(5000)` before exit, with three distinct error messages so the missing one is
decidable), but the verdict rests on README prose plus `_records/results.json`. This is the Deno
counterpart of B07 in ERRATA.md. F11's `Sentry.close()` and `process.exitCode` variants have no file
here either, same as on the Bun side.

**N9 - two quoted lines are in no shipped file.** The Observed section quotes the workaround event
with `"trace_id": "3a87513472624a42ac80c5b8ebc5a717"`; grep for that id over `probes/N9` hits
`README.md` only - `items-prod-workaround.json` carries `4e08b69ba68a49e78b717e731dc53179`. The
quote is from a second, clean-install run whose logs ship (`verify-prod-workaround.log`, port 51936)
but whose items file does not. The K2 evidence line `{"url": "/echo", "headers": {..."host":
"127.0.0.1:41338"}}` is nowhere: `run.sh`'s `drive()` uses `curl -s -o /dev/null -w '%{http_code}'`,
so no response body is ever saved, and `echo.log` holds only `echo on 41338`. The span half of K2
(no `http.client` span in `items-prod.json`) is verifiable; the header half is not.

**D16 - record field, and the 99 MB figure.** `_records/probes.json` gives D16 the verdict
`see record` while its own summary opens "develop: works" and its README says "works"; every other
Deno probe carries works/partial/broken. Same fix ERRATA.md already records for B01. Separately, the
size the report cites ("99 MB minimal", F27 "at 99 MB") exists only as README prose - the compiled
binary was truncated to a 0-byte placeholder, and `compile.log` records only the embedded-file sizes
(`node_modules/* (37.55MB - 33.5MB unique)`, `Files: 33.82MB`). `compile.log` was also produced with
`--output file://$REPRO/probes/D16/bin/app`, not the `--output /tmp/d16-bin/app` the Run block
documents.

**D07, D15, D02 - decisive terminal output not persisted.** D07's Observed quotes probe stdout
(`DONE logger calls, waiting 7s, no explicit flush` / `EXIT`) that the Run block never redirects; the
strings exist in `probe-logger.ts`, the output does not. D15 quotes `run.sh: --- app never listened
on 51818`, which `run.sh:37` really prints but only to the terminal. D02's "Run order" block
(`deno exit=0 label=hook-all`, `items: [...]`) is `run.sh` stdout; it is exactly reconstructible from
`items-<label>.json`, which does ship. None of these changes a verdict.

**D14 - a shipped variant that is never run.** `main-http-hook.ts` ships and is listed under Files as
"the same app behind `import "@sentry/deno/import"`, for the hook variant", but the Run block never
invokes it and there is no `*-hook*` result file in the directory.

**D05, D10, D16, N1 - quotes pruned without an ellipsis.** D05's `http boom caught` line drops
`hasContextLine`, `trace_id`, `user` and `request` from the line in `drive-catch.out`, and its
`drive-throw.out` block starts five response lines into the file. D10's transaction lines drop
`trace_id`, `sdk` and `hasRequestData`. D16's `drive-binary.log` lines drop `trace_id`, `request`,
`release` and `environment`, and its `run-binary.log` quote keeps 4 of 10 frames. N1's
`dev-deploy2/items.json` quote is a field-pruned rendering. Substance is exact in every case; D01,
D09, D11, D12, D14, D15 and D17 do the same thing but label it "trimmed", which is the right
treatment.

**D09 - stale files.** Eleven files whose names embed the env arguments (for example
`result-bodies-off LIFECYCLE=static BODIES=off.json`) all contain the default configuration. The
README discloses this; they should be deleted rather than left beside the real results.

**D11 - an SDK-doc mismatch the report does not carry.** The D11 README observes that
`denoCronIntegration` is not a default integration although its JSDoc says it is, and the SDK at the
pin agrees: `packages/deno/src/sdk.ts:29-49` `getDefaultIntegrations` does not list it, while
`packages/deno/src/integrations/deno-cron.ts:64` reads "Enabled by default in the Deno SDK.". This
changes the reproduction (an app that omits `integrations: [denoCronIntegration()]` neither crashes
on 2.9.0 nor sends check-ins) and belongs in F22.

## Report sentences to fix

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

## Checks against the SDK that hold

- **F24's develop fix.** `packages/deno/src/utils/streaming.ts` has no cancel handler at the audit
  pin (`audit-runtime-docs`, 6f2da7483d); at develop head (`audit-runtime-docs-v2`, 03aaf42455) lines
  106-107 read `cancel(reason) { return reader.cancel(reason); }`. The octet-stream half stands in
  both trees: `classifyResponseStreaming` lists only `text/event-stream` and `text/plain` without
  Content-Length.
- **F21's "ships mysql2Integration in the defaults".** `packages/deno/src/sdk.ts:46-47` spreads
  `getErrorIntegrations()` and `getTracingIntegrations()` from `@sentry/server-utils`, and
  `packages/server-utils/src/integrations/index.ts:30-56` lists `mysql2Integration()` (and
  `openAIIntegration()`, which F19's develop half needs).
- **F18's "nothing warns".** `detectOrchestrionSetup` is defined in
  `packages/server-utils/src/orchestrion/detect.ts` and referenced only from
  `packages/node/src/sdk/index.ts`; `packages/deno/src` never calls it.
- **F22's root cause.** `packages/deno/src/integrations/deno-cron.ts:23` is
  `Deno.cron = new Proxy(Deno.cron, {`, inside `setupOnce`, which is why `Sentry.init` itself throws
  on a getter-only `Deno.cron`.
- **F17's crash path.** `packages/server-runtime-injection/rollup.npm.config.mjs:62` rewrites
  `node_modules` to `vendored` in the build output, which is why the shipped crash frame reads
  `@sentry/server-runtime-injection/build/esm/vendored/debug/src/node.js:124:30`.

## Probes confirmed

D01, D02, D03, D04, D06, D07, D09, D10, D11, D12, D13, D14, D15, D17, D18, N1, N8 reproduce their
recorded verdict from shipped files, with the citation and artefact notes above. D05 and D16 are
confirmed too; their entries carry a fidelity note and a record-field note respectively. D13 is worth
a separate mention: it is the only Deno probe with no bracket citation anywhere in
`deep-probe-report.html`, so nothing in the report depends on it, yet it is the cleanest evidence in
the set - `drive.out` shows `GET /users/:id` (source `route`) with the `db SELECT id, name FROM users`
span parented on the transaction's own `span_id`, from a `mysql` connection opened at module scope
before `init` ran.
