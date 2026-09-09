# Consistency check: records vs. files on disk

Read-only verification of 51 framework cells, 114 refutation directories, 5 quick starts (react and
vue skipped), INDEX.md (125 rows) and the 105 entries in `_records/results.json`. Structurally the
repo holds: every cell and probe directory exists and is indexed, every one of the 91 refutation
records has its directory, every INDEX row resolves, and no `matches` flag in `results.json`
contradicts `probes.json`/`cells.json`. The failures are about evidence and coverage. 20 of 51 cells
and 86 of 114 refutation directories contain no captured envelope output at all: the sink was read
over HTTP with `curl /__items` and the result pasted straight into the record and the README, so the
verdicts those directories exist to support cannot be checked from the directories. 23 refutation
directories shipped with run files but no entry in `refutations.json`. One cell record
(`M-nextjs-bun`) states verdicts its own result files disprove. Three rebuild divergences recorded in
`results.json` were never written back into the cell records. 14 INDEX rows lost their
framework/runtime title. Counts of problems: cells 21, refutations 34, quick starts 3, INDEX rows 14,
results entries 3.

## 1. Framework cells

- All 51 READMEs exist and carry Install, Run, Expected and Observed content. 37 use separate
  `## Install` and `## Run` headings; the 14 original-round cells use one combined
  `## Install and Run` heading, which does contain both the install and the run commands.
- **Observed quotes nothing the directory holds — 6 rebuilt cells** that assert a fresh
  "Observed on 2026-09-07": `M-hono-cf` (all 10 quoted trace ids, e.g.
  `edced39361b4435a85bd449605674ae1`, occur only in README.md; `sink.log` and `sink2.log` are the
  single line `sink listening 41207`), `M-reactrouter-deno` (all 16 ids; `app-stream.log` holds only
  the listen line and the `Error: rr-deno loader boom` stack), `M-remix-bun` (all 6 ids;
  `recorder.log` is `recorder listening 36213`), `M-tanstack-cf` (all 9 ids; `wrangler.log` has zero
  envelope lines), `M-reactrouter-bun` (the one id `cd9c31f0b7924871b4fd5b2a5bb5f974`; the capture
  lines are corroborated by `app-debug.log:164-173`, the envelope items are not) and `M-nuxt-bun`
  (the boot-log block is real in `appA2.log`, the "full sink dump" blocks and
  `cb01862f26e844f1b0efa8332e1e172e` are not).
- **Observed quotes nothing the directory holds — the 14 original-round cells**: `M-elysia-cf`,
  `M-elysia-deno`, `M-express-cf`, `M-fastify-cf`, `M-fresh-bun`, `M-fresh-cf`, `M-hapi-cf`,
  `M-koa-cf`, `M-nestjs-cf`, `M-oak-bun`, `M-oak-cf`, `M-remix-deno`, `M-solidstart-deno`,
  `M-sveltekit-cf`. Each Observed section opens "Not re-run in the rebuild. The recorded evidence of
  the original run:", so the README does not misstate anything, but no file in any of the 14 holds a
  single envelope item, so none of the quoted lines is checkable from the directory.
- **Record claims a verdict its files disprove — `M-nextjs-bun`.** `cells.json` and `cells-all.json`
  record db spans `broken` ("produced no `db` span") and route names `partial` ("spurious `/app`
  prefix"). `items-static.json` holds
  `"name":"GET /api/db",...,"spans":["resolve page components","executing api route (app) /api/db/route","db mysql2.pool.connect","db mysql2.connect","db SELECT id, name FROM users","start response"]`
  and `items-stream.json` shows origin `auto.db.mysql2.diagnostic_channel`; both files name the route
  `GET /api/users/[id]` with `"source":"route"` and no `/app` prefix.
- **Files show a result the record does not carry — `M-nuxt-bun` and `M-remix-bun`.** `M-nuxt-bun`'s
  record says "Under `@sentry/bun` a module-scope pool query yields `db SELECT users`"; the run logs
  show only `[instrumentation:mysql2] Bun/Deno, subscribing eagerly` and no db span.
  `M-remix-bun`'s record says the recorder received `sentry-trace: a19cc67a…-884e3f78b27078a5`; the
  README's own rebuild reports `sentryTrace: null, baggage: null` in both modes. Both divergences are
  in `results.json` (`matches: partial`); neither is in the cell record.
- Checked but not a problem: `M-koa-deno` db spans `broken` while `items-hook-nokoa.json` holds
  `{"type":"transaction","name":"SELECT id, name FROM users","op":"db","source":"custom",...}` — the
  record's own detail describes exactly that standalone-root behaviour. `M-sveltekit-bun` db spans
  `broken` while `items-node-static.json` holds `db mysql2.*` — that file is the Node control leg the
  README names.

## 2. Refutations

- **Result files but no record (23)** — `verify4-M-astro-bun-outgoingfetch`,
  `verify4-M-elysia-deno-incomingtrace`, `verify4-M-elysia-deno-isolation`,
  `verify4-M-nestjs-deno-outgoingfetch`, `verify4-M-nestjs-deno-routenames`,
  `verify4-M-nuxt-bun-outgoingfetch`, `verify4-M-nuxt-deno-incomingtrace`,
  `verify4-M-nuxt-deno-isolation`, `verify4-M-oak-deno-outgoingfetch`,
  `verify4-M-reactrouter-bun-dbspans-v2`, `verify4-M-reactrouter-deno-dbspans`,
  `verify4-M-remix-bun-incomingtrace`, `verify4-M-remix-bun-isolation`,
  `verify4-M-remix-bun-outgoingfetch`, `verify4-M-remix-deno-outgoingfetch`,
  `verify4-M-solidstart-deno-isolation`, `verify4-M-tanstack-bun-incomingtrace`,
  `verify4-M-tanstack-bun-isolation`, `verify4-M-tanstack-bun-outgoingfetch`,
  `verify4-M-tanstack-bun-routenames`, `verify5-M-elysia-deno-incomingtrace`,
  `verify5-M-elysia-deno-isolation`, `verify5-M-solidstart-deno-isolation`. The six Bun/Deno items
  named in the task are all confirmed, and 17 more sit alongside them. Six of the 23 recovered a
  `**Verdict:** works-after-all` line into their README from the cell-keyed journal entry
  (astro-bun-outgoingfetch, elysia-deno-incomingtrace, elysia-deno-isolation, nestjs-deno-routenames,
  verify5-elysia-deno-incomingtrace, verify5-elysia-deno-isolation); the other 17 READMEs say "No
  result was recorded under this directory name or under the cell and capability."
- Two of the unrecorded directories carry their own verdict document that `refutations.json` does not
  have: `verify4-M-remix-bun-incomingtrace/README-rerun.txt` — "VERDICT: works-after-all (Mode B
  bundle + a 6-line express isolation/continueTrace middleware)" — and
  `verify4-M-remix-bun-outgoingfetch/REPRO.md`, whose "Answer:" section resolves the capability in
  full and which is backed by `items-bunfetch-stream.json` and `items-bunall-static.json`.
- **Records whose directory is missing: none.** All 91 resolve.
- **Records whose files do not show the recorded outcome (11, all `works-after-all`)** —
  `verify4-M-astro-bun-dbspans` (record quotes
  `transaction | GET /db2 | ['db mysql2.connect', 'db SELECT id, name FROM users WHERE id > ?']`;
  `runA.log`-`runD.log` and `runG.log` hold only `[@astrojs/node] Server listening on ...`,
  `sink.log` holds `sink listening 44311`, and the only channel line anywhere is the negative probe
  `appbun3.log:2 [PROBE] orchestrion:mysql2:query start.hasSubscribers= false`),
  `verify4-M-nextjs-bun-dbspans` (the FIXED transaction with `db SELECT id, name FROM users` exists
  only in README.md and REPRO.md:47-50; `app-keep.log` holds only the Next.js banner),
  `verify4-M-koa-deno-dbspans` (`run-e-static.log` is the single line `listening 41765`),
  `verify4-M-nestjs-cf-errors` (`wrangler-A/B/C.log` show the NestJS stack and
  `[wrangler:info] GET /error 500`, but no event item anywhere; `sink.log` is a node `EADDRINUSE`
  crash on 127.0.0.1:47311), `verify4-M-koa-deno-errors`, `verify4-M-elysia-deno-routenames`
  (`app-a.log`, `app-c.log`, `v4a.log` are 37 bytes each, `v4r2.log` is 0 bytes),
  `verify4-M-elysia-deno-outgoingfetch`, `verify4-M-fastify-deno-outgoingfetch` (`app-a/b/c.log` are
  12 bytes), `verify4-M-nuxt-bun-incomingtrace`, `verify4-M-reactrouter-bun-incomingtrace` and
  `verify4-M-solidstart-bun-incomingtrace` (`log-bunpreset.txt` holds only the listen and shutdown
  lines).
- Not a problem, but the reason the check is weak: only 28 of the 114 directories hold a captured
  envelope dump. `verify4-M-solidstart-bun-dbspans` and `verify4-M-fresh-deno-dbspans` initially
  looked unbacked and are not — `run-bun-pin.log:153` and `prod5.log:107` carry
  `Sentry Logger [log]: [Tracing] Finishing "db" span "SELECT id, name FROM users"` and
  `... "SELECT * FROM users"`.

## 3. Quick starts

- `QS-cloudflare` and `QS-browser` are clean. `results-waituntil.json` holds one span, the sentinel
  event and a second span and no captured `waitUntil` error; `results-request.json` holds
  `transaction` items where the other four hold `span` items; `results-cdn-tracing.json` holds no
  `log` and no `replay_*` item while `results-cdn.json` holds `replay_event`/`replay_recording` but
  no `log`; `results-npm-ip.json` has `"sentry-trace": null, "baggage": null`. Every one of those
  matches the JSON summary.
- `QS-node` — item shapes and counts match (`2 event + 5 span + 1 log`, no `transaction` item, 45
  `Integration installed` lines in `app-import.log`), but the quoted `/debug-span` envelope uses
  `trace_id 5393eb9d38124fa2865eca3d0a233367` and the quoted debug line `process: 30045`, while
  `results-import.json` has `6980a053fd4348c6b82e3172314b7390` and `app-import.log` has
  `process: 42746`. That block is from an earlier run than the results files.
- `QS-deno` — same pattern: the quoted `/debug-span` envelope uses
  `trace_id 983e6dd9d6e940e1bbd0ffff8e292360`, which occurs only in README.md;
  `results-quickstart.json` carries the identical shape under `d048e15b956b4204b51de02aa7c26964`.
- Record carries fewer variants than the directory ships: `QS-node`'s `variants` omits the express
  library check that README.md documents and `results-express-flag.json` / `results-express-self.json`
  carry (`["handler /users/:id","http.server GET /users/:id"]`); `QS-bun`'s `variants` omits
  `bundle-minimal`, documented at README.md:23, :58 and :284 and carried by
  `results-bundle-minimal.json`.
- `quickstarts/vue/` exists with no README, no `results-*.json` and no record. Same in-progress shape
  as `quickstarts/react/`, which was excluded from this check.

## 4. INDEX.md

- All 125 rows point at an existing directory, and every Recorded, Rebuilt and Matches column agrees
  with `probes.json` and `results.json`. No row fails those columns.
- 14 rows lost their title: the Framework-on-runtime cell reads `M-elysia-cf on`, `M-elysia-deno on`,
  `M-express-cf on`, `M-fastify-cf on`, `M-fresh-bun on`, `M-fresh-cf on`, `M-hapi-cf on`,
  `M-koa-cf on`, `M-nestjs-cf on`, `M-oak-bun on`, `M-oak-cf on`, `M-remix-deno on`,
  `M-solidstart-deno on`, `M-sveltekit-cf on`. `build-index.py` reads `_records/cells.json`, which
  holds only the 37 rebuilt cells, and falls back to `{'framework': cid, 'runtime': ''}`;
  `cells-all.json` has the real values (`Elysia 1.4.30` on `Cloudflare Workers (wrangler 4.129.0 dev…`).
- `build-index.py` never opens `extra-results.json`, contrary to how the index is described. No rows
  are lost by it: all four entries (`D09`, `D16`, `M-tanstack-deno`, `M-nextjs-cf`) are already
  present in `results.json` with identical `matches` and `difference` values.
- The index has no rows for the 114 directories under `refutations/`, although its own header says
  "Every entry is a directory with a README (Install, Run, Expected, Observed)" and all 114 have one.

## 5. results.json

- 105 entries; every `id` resolves to a `probes.json` or `cells.json` record and every `path` to an
  existing directory. `matches` is `yes` for 101 and `partial` for 4 (`C09`, `M-nextjs-bun`,
  `M-nuxt-bun`, `M-remix-bun`), and the tail line `Rebuild status: 105 results; matches: {'yes': 101,
  'partial': 4}` agrees. No `matches` flag contradicts the recorded verdict: every `yes` entry states
  in its own `difference` text that no verdict changed, and each `partial` entry names the verdicts
  that did.
- The gap is write-back, not the flag. For `M-nextjs-bun` the difference says "route names … Verdict
  is now a clean works" and "db spans: recorded broken, observed works"; for `M-nuxt-bun` "db spans do
  not [reproduce]"; for `M-remix-bun` the recorder saw `sentryTrace null` in both modes. None of the
  three was written back to `cells.json` or `cells-all.json`, so a reader of the cell record alone
  gets the superseded verdict.
- Two `matches: yes` entries record a divergence confined to a control leg and say so explicitly, so
  the flag stands: `B11` (the baseline binary now reports the Express error with mechanism
  `auto.middleware.express`) and `M-astro-bun` (the node control leg produced `"spans": []` where the
  record had `db SELECT id, name FROM users WHERE id > 0`).

## Confirmed

51/51 cell READMEs present with all four sections; 30/51 cells with no discrepancy; 31/51 cells
carrying captured envelope files; 91/91 refutation records with an existing directory; 80/114
refutation directories with no discrepancy; 2/5 quick starts fully consistent; 125/125 INDEX rows
resolving to an existing directory with correct Recorded/Rebuilt/Matches columns; 105/105
`results.json` entries with a resolvable id and path and no wrong `matches` flag.
