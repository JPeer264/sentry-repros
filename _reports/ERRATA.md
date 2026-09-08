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
