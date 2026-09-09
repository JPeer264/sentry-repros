# N8 - `deno serve` entry shape, including `--parallel`

Runtime: deno 2.9.0 | SDK: `@sentry/deno` 10.67.0 (develop line, tarballs in `_toolbox/pack/`)

## What it reproduces

One small Deno app (`app.ts`) initialises `@sentry/deno` against a local envelope sink, opens a
module-scope `mysql` connection and exports `default { fetch: handler }`. The handler serves `/ok`,
`/db` (a `SELECT` through the module-scope connection), `/tag?id=<n>` (sets a per-request tag and
captures a message), `/boom` (throws, uncaught) and `/sentinel` (captures a message). The same module
is served four ways: through `deno serve serve.ts` with one worker, through
`deno serve --parallel serve.ts` (16 workers), through plain `Deno.serve` (`run.ts`) as a baseline,
and through a docs-shaped copy without the `import "@sentry/deno/import"` hook line
(`serve-nohook.ts` / `app-nohook.ts`). The question is whether the `export default { fetch }` entry
shape gets the same instrumentation as `Deno.serve`, and whether `--parallel` - which re-executes the
entry module once per worker thread, so N `Sentry.init` calls in one process - duplicates telemetry or
leaks per-request scope data across workers.

## Install

From this directory:

```
npm install --no-audit --no-fund
```

`package.json` points the four `@sentry/*` dependencies at the 10.67.0 tarballs in
`_toolbox/pack/`. `deno.json` sets `nodeModulesDir: "manual"`, so Deno uses that `node_modules`
as-is. MariaDB must be reachable on `127.0.0.1:3307` (user `root`, no password, database `app`,
table `users`); pass a different port with `MYSQL_PORT`.

## Run

`./run.sh` runs all four scenarios in order and leaves the outputs in this directory. It is exactly
the commands below (sink on 39147, single worker on 58211, parallel on 58223, `Deno.serve` on 41551;
check the ports are free with `lsof -nP -iTCP:<port>`).

```
export SINK=http://127.0.0.1:39147/ MYSQL_PORT=3307
DENO_FLAGS="--no-prompt --allow-net --allow-env --allow-read --allow-sys --config deno.json"

PORT=39147 node sink.mjs > sink.log 2>&1 & spid=$!
sleep 1

# 1. deno serve, single worker
deno serve $DENO_FLAGS --port 58211 serve.ts > serve-single.log 2>&1 & apid=$!
sleep 5
node drive.mjs 58211 39147 6 > out-single.txt 2>&1
curl -s 'http://127.0.0.1:39147/__items?raw=1' > raw-single.json
kill -9 $apid; sleep 2

# 2. deno serve --parallel
deno serve --parallel $DENO_FLAGS --port 58223 serve.ts > serve-par.log 2>&1 & apid=$!
sleep 10
node drive.mjs 58223 39147 40 > out-par.txt 2>&1
kill -9 $apid; sleep 2

# 3. plain Deno.serve baseline
PORT=41551 deno run $DENO_FLAGS run.ts > run-denoserve.log 2>&1 & apid=$!
sleep 5
node drive.mjs 41551 39147 3 > out-denoserve.txt 2>&1
kill -9 $apid; sleep 2

# 4. docs-shaped entry, no @sentry/deno/import line
deno serve $DENO_FLAGS --port 58223 serve-nohook.ts > serve-nohook.log 2>&1 & apid=$!
sleep 6
node drive.mjs 58223 39147 4 > out-nohook.txt 2>&1
kill -9 $apid

kill $spid
```

`deno serve` does not exit on SIGTERM, which is why every app process is killed with `-9`.

`drive.mjs <appPort> <sinkPort> <sentinelCount>` clears the sink, then sends 1 `/ok`, 1 `/db`, 10
concurrent `/tag?id=r0..r9`, 3 `/boom` and `<sentinelCount>` `/sentinel` requests, waits for a
sentinel event to land in the sink, and prints envelope counts, the span lines, an event tally and
how many `tagged:*` events carry their own `req` tag. `sink.mjs` is `_toolbox/sink.mjs` with the
span mapping rendered as `<op> <name> [origin=…] [src=…] [trace=…]` and the event mapping trimmed to
message / tags / trace / request url.

## Expected

Recorded verdict: **works**.

`export default { fetch }` run through `deno serve` is instrumented exactly like `Deno.serve`: init
applies, the `node_modules` load hook applies (module-scope mysql produces a db span), errors are
captured, and one `http.server GET` span is emitted per request. `--parallel` starts 16 independent
Sentry clients in one process (16 x `Sentry.init`) but produces no duplicated telemetry: 55 requests
-> 55 spans, one per request. No session envelope is ever sent (the Deno SDK ships no release-health
code), so nothing can be duplicated there either. Per-request tags never leak: 10 concurrent `/tag`
requests gave 10/10 events with their own tag, single-worker and parallel.

Recorded evidence lines:

```
deno serve, single worker:
{"type":"span","items":["db SELECT users [origin=auto.db.mysql] [src=?] [trace=2aeb2e6b]","http.server GET [origin=auto.http.deno] [src=?] [trace=2aeb2e6b]"]}
{"type":"event","message":"tagged:r5","tags":{"req":"r5","worker":"ae7a96a2"},"trace":"8ce7d394","request":"http://127.0.0.1:58211/tag?id=r5"}
counts -> event: 12, span: 21 (= 1 /ok + 1 /db + 10 /tag + 3 /boom + 6 /sentinel; 3 identical /boom throws deduped to 1 event)
/db -> 200 {"worker":"ae7a96a2","rows":[{"id":1,"name":"alice"},{"id":2,"name":"bob"}]}

The handler really is wrapped by the integration under `deno serve`:
Error: serve boom
    at Object.handler [as fetch] (.../dev/app.ts:22:39)
    at handler (ext:deno_http/00_serve.ts:1168:26)
    at .../packages/deno/src/integrations/deno-serve.ts:72:13
    at .../packages/deno/src/wrap-deno-request-handler.ts:129:25

deno serve --parallel:
[serve-worker-10] INIT worker=1b5d47db pid=86946
[serve-worker-0 ] INIT worker=1a45de2f pid=86946   (16 INIT lines, one pid)
[serve-worker-15] MYSQL-MODULE-SCOPE worker=3ac1bd86   (16 module-scope connections)
deno serve: Listening on http://0.0.0.0:58223/ with 16 threads
counts -> event: 25, span: 55  (55 requests -> 55 spans, exactly one each; 0 session/sessions envelopes)
tagged events=10 matching=10   (no tag leak across the 16 workers)

Same app under plain Deno.serve: identical shape
  18 http.server GET [origin=auto.http.deno] [src=?]
   1 db SELECT users [origin=auto.db.mysql] [src=?]

Docs-shaped entry without `import "@sentry/deno/import"` under deno serve:
  19 http.server GET [origin=auto.http.deno] [src=?]   -> errors and server spans still work, db span gone
```

## Observed on 2026-09-07

Matches the recorded verdict on every load-bearing point. One difference, dedupe, is described at
the end; it does not touch the claim.

`deno serve`, single worker (`out-single.txt`, `serve-single.log`, sentinelCount 6):

```
INIT worker=92f3c144 pid=73365
MYSQL-MODULE-SCOPE worker=92f3c144
deno serve: Listening on http://0.0.0.0:58211/

/db -> 200 {"worker":"92f3c144","rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]}
/boom -> 500 Internal Server Error

counts -> event: 19, span: 21
tagged events=10 matching=10

--- span lines (deduped with count) ---
   21 http.server GET [origin=auto.http.deno] [src=?] [trace=*]
    1 db SELECT users [origin=auto.db.mysql] [src=?] [trace=*]

--- sample raw items ---
{"type":"span","items":["db SELECT users [origin=auto.db.mysql] [src=?] [trace=e5d37ac4]","http.server GET [origin=auto.http.deno] [src=?] [trace=e5d37ac4]"]}
{"type":"event","message":"tagged:r0","exception":"undefined: tagged:r0","mechanism":"generic","handled":true,"tags":{"worker":"92f3c144","req":"r0"},"trace":"e54b9127","request":"http://127.0.0.1:58211/tag?id=r0"}
```

21 `http.server` spans for 21 requests (1 `/ok` + 1 `/db` + 10 `/tag` + 3 `/boom` + 6 `/sentinel`),
the db span shares the trace id of its request span, and the handler is wrapped by the integration
with the same frames as recorded (`serve-single.log`):

```
Error: serve boom
    at Object.handler [as fetch] (file:///.../probes/N8/app.ts:47:11)
    at handler (ext:deno_http/00_serve.ts:1168:26)
    at file:///.../probes/N8/node_modules/@sentry/deno/build/esm/integrations/deno-serve.js:72:13
    at file:///.../probes/N8/node_modules/@sentry/deno/build/esm/wrap-deno-request-handler.js:129:25
```

`deno serve --parallel` (`serve-par.log`, `out-par.txt`, sentinelCount 40):

```
[serve-worker-8 ] INIT worker=4741dd9a pid=73689
[serve-worker-0 ] INIT worker=e1e595cc pid=73689
[serve-worker-15] INIT worker=2a8e2e32 pid=73689      (16 INIT lines, one pid)
[serve-worker-6 ] MYSQL-MODULE-SCOPE worker=cac3f834  (16 module-scope connections)
deno serve: Listening on http://0.0.0.0:58223/ with 16 threads

counts -> event: 53, span: 55
tagged events=10 matching=10

--- span lines (deduped with count) ---
   55 http.server GET [origin=auto.http.deno] [src=?] [trace=*]
    1 db SELECT users [origin=auto.db.mysql] [src=?] [trace=*]

    1 tagged:r0 | {"worker":"b298ac25","req":"r0"}
    1 tagged:r2 | {"worker":"a21ac0f3","req":"r2"}
    1 tagged:r4 | {"worker":"4f748641","req":"r4"}
    1 tagged:r9 | {"worker":"b97697a1","req":"r9"}
```

55 requests -> exactly 55 `http.server` spans, one per request, spread over five workers with no
duplication, and no `session` or `sessions` envelope appeared in any of the four runs (only `event`
and `span` show up in every `counts ->` line).

Plain `Deno.serve` baseline (`out-denoserve.txt`, sentinelCount 3):

```
counts -> event: 16, span: 18
   18 http.server GET [origin=auto.http.deno] [src=?] [trace=*]
    1 db SELECT users [origin=auto.db.mysql] [src=?] [trace=*]
```

Docs-shaped entry without the hook (`out-nohook.txt`, sentinelCount 4):

```
counts -> event: 17, span: 19
   19 http.server GET [origin=auto.http.deno] [src=?] [trace=*]
```

Errors and server spans still work, the db span is gone, exactly as recorded.

### Difference from the record

Dedupe did not fire in this rebuild. The record has `event: 12` single-worker (3 identical `/boom`
throws collapsed to 1 event, 6 identical sentinels to 1) and `event: 25` under `--parallel`; here
every event was delivered: `event: 19` single-worker (10 tagged + 3 boom + 6 sentinel) and
`event: 53` parallel (10 tagged + 3 boom + 40 sentinel). `dedupeIntegration()` is in
`getDefaultIntegrations` of this build (`node_modules/@sentry/deno/build/esm/sdk.js:22`) and the raw
payloads in `raw-single.json` show the three `serve boom` events carrying byte-identical stack frames
and no fingerprint, so on paper `_shouldDropEvent` should have matched. Not chased further, since it
is orthogonal to the entry-shape claim: span counts, the wrapping stack, the db span, the 16-worker
INIT/pid picture, the absence of session envelopes and the 10/10 tag isolation all reproduce exactly.
Because dedupe does not fire, the record's per-worker dedupe side note (3 throws -> 2 events under
`--parallel`) cannot be reproduced here either; the 3 throws arrived as 3 events, split 1/2 across
two workers, which still shows the per-worker split.

Second, cosmetic: the 40 `/sentinel` hits landed on 2 workers here where the record saw 13, which is
Deno's request scheduling, not SDK behaviour; the `users` table on this machine holds `ada` / `linus`
where the record shows `alice` / `bob`; MariaDB is on port 3307 here where the record used 43307; and
the `/boom` throw sits at `app.ts:47:11` rather than `app.ts:22:39` because the rebuilt app has init
and the mysql setup in the same file.

## Files

- `app.ts` - `Sentry.init`, module-scope `mysql` connection and the `handler` with `/ok`, `/db`, `/tag`, `/boom`, `/sentinel`
- `serve.ts` - `export default { fetch: handler }`, the `deno serve` entry shape
- `run.ts` - the same handler passed to `Deno.serve`, the baseline
- `app-nohook.ts` / `serve-nohook.ts` - the same pair without the `import "@sentry/deno/import"` line
- `deno.json` - `nodeModulesDir: "manual"`
- `sink.mjs` - envelope sink with the span and event mappings described above
- `drive.mjs` - request driver and sink report
- `run.sh` - runs all four scenarios with the ports from the Run section
- `out-*.txt`, `serve-*.log`, `run-denoserve.log`, `raw-single.json`, `sink.log`, `run-all.log` - output of the run above
