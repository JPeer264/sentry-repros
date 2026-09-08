# Verification: Bun probes (B01-B19, X01, X02, X03, N7)

22 probes checked (there is no B15 directory). Every recorded verdict is supported by the
shipped evidence, and every README `Observed` section quotes its own result files faithfully.
Nothing needs its verdict changed. The corrections below are about missing artefacts, one
broken install file, and four report sentences that cite the wrong probe or overstate it.

## Probes that need a correction

**B14 - a report sentence is contradicted by the probe.** F15 says "Express spans and
SentryGlobalFilter error capture work once `@sentry/nestjs` is bundled together with the app".
The only shipped variant that bundles `@sentry/nestjs` (`build2.ts` / `dist2/`) does not boot:
`app-e-dist2-nest-filter-stream.log` is `ReferenceError: node is not defined at
node_modules/@sentry/nestjs/build/esm/index.js:1:1`. It is a *partial* bundle - `@sentry/bun`,
`core`, `node`, `server-utils` and `conventions` stay external. The configuration F15 means
(no `@sentry/*` external at all) exists only in the record's refutation run. The shipped
variant that works is a third one, `build4.ts`/`dist4/`, which keeps exactly `@sentry/nestjs`
external and bundles `@sentry/nestjs/setup`.

**B03 - two capability-matrix cells cite the wrong probe.**
`Server span naming: route pattern with Bun.serve({ routes }), URL otherwise [B03]` - B03's app
uses only a `fetch` handler, never `routes: {}`, and its develop spans are named bare `GET`
(`{"op":"http.server","name":"GET",...,"query":"tag=t1"}`). The parameterised evidence is in
B11 (`GET /hello/:name`), B09/B10/B12/B17/B19. The cell also omits that a plain Bun.serve
`fetch` handler is method-only under develop's stream lifecycle - which is B03's own result.
`Handler error captured with request context: works / works (Bun.serve) [B03]` - B03 calls
`captureException` inside the handler and never throws from one; B05 and B09 are the probes
where a thrown Bun.serve handler error carries `request.url`.

**B06 and B14 - `package.json` is broken.** Every `@sentry/*` specifier reads
`file:../../_toolbox/pack/sentry-*-10.67.0.tgz`, a path-anonymisation
artefact with a literal `$REPRO`. Verified by running it: `npm install` dies with
`ENOENT: no such file or directory, open '/private/tmp/../../_toolbox/pack/sentry-bun-10.67.0.tgz'`.
Only the README's explicit tarball list installs. Every other probe uses
`file:../../_toolbox/pack/...` correctly.

**B07 - no result files at all.** The directory holds the three probe scripts, the sink and the
README, and nothing else; the Run block prints the sink to the terminal. The Observed section
was unverifiable from the directory, so I re-ran it (below): it reproduces exactly. The three
sink dumps should be committed.

**B18 and B08 - the decisive sink output is not persisted.** B18's `sink-*.log` files contain
only `sink listening <port>`; the isolation evidence and the `"request": null` error events
quoted in the README exist only in README.md and `_records/results.json`. B08 is the same for
the `[]`-after-`process.exit` dumps, though its `exit-debug.log` does carry the decisive
`Captured error event \`x-exit\`` line with no transport line after it.

**B11 and B16 - Run blocks point at a scratchpad sink that is gone.** Neither directory has a
`sink.mjs`; both say `node $REPRO/_toolbox/sink.mjs`. `_toolbox/sink.mjs` is the replacement. B11 also
names `$REPRO/probes/B11/cwd-empty` while its committed log shows `$REPRO/probes/B11/cwd-empty`.

**B17 and X02 - the "only when bundled" docs claim has no unbundled control.** Every variant in
both probes runs from a `sentryBunPlugin` bundle, so neither shows what a plain `bun run`
produces. B19 is the probe that ships both legs and should carry that citation.

**B05, B08, B10, N7 - findings that cite artefacts the probe does not contain.** The manual
`startSession`/`captureSession` clause (matrix + F36) for B05; `Sentry.close()` and
`process.exitCode = n` (F11) for B08; the node:http streaming comparison (907 ms / 305 ms) and
the `startSpanManual` workaround (F4) for B10; the three 10.73.0 defects and "a v11 path does
exist" (F47) for N7. All four are in the report records' verification sections, none is
reproducible from the probe directory. F36's clause also drops a caveat the record makes: the
manual sessions come out `exited` with `errors: 0` even when the request captured an exception.

**X02 - misleading filenames.** `log-bun140-*.txt` were produced on Bun 1.4.2. The README
discloses it; the filenames do not.

**B01 - record field.** `_records/probes.json` gives B01 the verdict `see record` while every
other Bun probe carries works/partial/broken; its own summary says "develop: works".

## Re-runs (two, as allowed)

**B07 - matches.** Installed the six develop tarballs from `_toolbox/pack/` into a scratchpad
copy, ran `probe-a/b/c` against `sink-ext.mjs` on port 32358 under Bun 1.4.2, then removed
`node_modules`. `enableLogs option value: undefined`; probe-a one `log` envelope,
`item_count` 3, attributes `probe/n/ok/tag` plus `sentry.sdk.name`, `sentry.sdk.version`,
`server.address`, `sentry.timestamp.sequence`; probe-b `{"level":"warn","body":"hello",
"attributes":{"sentry.origin":"auto.log.console",...}}` plus the interpolated info item with
`sentry.message.template` / `sentry.message.parameter.0`; probe-c `item_count` 4. Bun 1.4.2
made no difference. One detail: probe-a's third item carried
`sentry.timestamp.sequence: 2`, i.e. the value in the *original* record rather than the `0` the
rebuild README quotes - which confirms the README's own explanation that the counter resets
across a millisecond boundary.

**B06 - matches.** Same install path, `SINK_PORT=47291 bun app.ts`, then `rm -rf node_modules`.
Output byte-identical to the recorded `app.log` except the runtime string:
`SDK 10.67.0 bun 1.4.2 metrics keys: count,distribution,gauge` and one `trace_metric` envelope
with `counter probe.count=1`, `gauge probe.gauge=42 millisecond`,
`distribution probe.distribution=3.5 second`, all carrying `attrs={"route":"/x"}`. The README's
claim that no `enableMetrics` string exists in the installed `@sentry/core` build also holds.
The same run confirmed the broken `package.json` above.

## Bun 1.4.2 vs the recorded 1.4.0

Most probes recorded 1.4.0 and say so (B02's `items.json` carries
`"runtime":{"name":"bun","version":"1.4.0"}`). Three were run later on 1.4.2 and declare it:
B01 (`Bun v1.4.2 (macOS arm64)` in `results-baseline.log`), X01 and N7; X02 ran on 1.4.2 under
`bun140` filenames. Both of my re-runs on 1.4.2 reproduced the 1.4.0 results exactly, and X02's
`dc-gc.mjs` gives the same channel-GC result on 1.4.2 and 1.3.14, so no finding in this set
depends on the Bun patch version. The CI-pinned Bun 1.3.14 binary is gone from this machine, so
B01, B03, B05, B06, B08, B10 and B12 record their 1.3.14 leg as not-run; only X02 obtained
1.3.14 (via `npm install bun@1.3.14`).
