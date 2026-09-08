# C02 - Request isolation under concurrency on Workers

Runtime: Cloudflare Workers (`wrangler dev` 4.x, workerd local) | SDK: `@sentry/cloudflare` 10.67.0
(develop line, tarballs in `_toolbox/pack/`)

## What it reproduces

A minimal Worker wrapped in `Sentry.withSentry` exposes `/a?tag=<X>`, which calls
`Sentry.setTag('req', X)` and `Sentry.setUser({ id: X })`, then awaits a 300 ms timer so that all
invocations overlap inside the same isolate, then calls `Sentry.captureException(new Error('boom X'))`.
A `/sentinel` route captures a plain `sentinel` message so the driver knows every earlier envelope has
arrived, and doubles as the check that no request-scoped tag leaked onto a later, unrelated invocation.
The driver fires five concurrent `GET /a?tag=t0..t4` requests and then the sentinel, and asserts that
each of the five error events carries exactly its own `req` tag and user id, that the five errors have
five distinct trace ids, that each of those traces produced its own `http.server` span, and that the
sentinel event carries no `req` tag at all. The whole thing runs twice: once with the default
isolate-wide cached client and once with `cacheClient: false` (`--var UNCACHED:1`), because the cached
client is shared across invocations and is the case where cross-request bleed would show up. Only the
develop line is exercised here; the record's second column (10.73.0, which has no `cacheClient` option)
is not re-run, so this directory holds one app instead of the record's `develop/` + `10.73.0/` pair.

## Install

From this directory:

```
npm install --no-audit --no-fund
```

(That resolves the four `@sentry/*` tarballs in `_toolbox/pack/` plus `wrangler@4` from
`package.json`. The explicit equivalent is
`npm install --no-audit --no-fund ../../_toolbox/pack/sentry-cloudflare-10.67.0.tgz ../../_toolbox/pack/sentry-core-10.67.0.tgz ../../_toolbox/pack/sentry-opentelemetry-10.67.0.tgz ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz wrangler@4`.)

## Run

From this directory. `run.sh` starts the sink, starts `wrangler dev`, runs the driver, and kills both.
Ports are arbitrary; pick free ones.

```
bash run.sh cached   41733 41734 run4
bash run.sh uncached 41735 41736 run4
```

Each run writes `logs-<variant>-<label>/{sink.log,app.log,drive.out}` and prints `drive.out`.

The equivalent by hand, for one variant:

```
PORT=41733 node sink.mjs > sink.log 2>&1 & spid=$!
sleep 1
npx wrangler dev --port 41734 --inspector-port 0 --persist-to ./persist-cached \
  --var SINK_PORT:41733 > app.log 2>&1 & apid=$!
# add --var UNCACHED:1 for the cacheClient: false variant
sleep 20
node drive.mjs 41734 41733
kill $apid; wait $apid
kill $spid; wait $spid
```

`sink.mjs` is `_toolbox/sink.mjs` unchanged; it already keeps `tags`, `user` and `trace_id` on events
and the envelope `trace_id` on span envelopes, which is everything the verdict needs.

## Expected

Recorded verdict: **works** (develop, both variants).

With the default cached client and with `cacheClient: false`, 5 overlapping `GET /a?tag=X` requests
produced 5 error events that each carry exactly their own tag, 5 distinct trace ids, one `http.server`
span per error trace, and a clean sentinel. The cached isolate-wide client isolates via per-invocation
forked isolation scopes (`packages/cloudflare/src/utils/invocationContext.ts`).

Recorded evidence lines:

```
develop/cached:   verdict {"isolated":true,"sentinelClean":true,"errors":5,"distinctErrorTraces":5,"httpServerForErrorTraces":5}
develop/uncached: verdict {"isolated":true,"sentinelClean":true,"errors":5,"distinctErrorTraces":5,"httpServerForErrorTraces":5}
```

Recorded note (side observation): on develop (stream lifecycle) the `http.server` span items carry no
scope tags as attributes, and develop names the server span `GET`. On 10.73.0 the transaction envelope
carried `tags.req` instead.

## Observed on 2026-09-07

**Matches** the recorded verdict, on both variants, with a freshly installed `node_modules`
(`npm install --no-audit --no-fund`, 43 packages) and a fresh `wrangler dev` per variant. Commands
run: `bash run.sh cached 41733 41734 run4` and `bash run.sh uncached 41735 41736 run4`. The verdict
object came back byte for byte identical to the recorded one; only trace ids and ports differ, and
those are random per run. Full output in `logs-cached-run4/drive.out` and
`logs-uncached-run4/drive.out`.

```
[cached]   app /a x5 -> done t0 | done t1 | done t2 | done t3 | done t4
[cached]   app /sentinel -> 200 sentinel
[cached]   verdict {"isolated":true,"sentinelClean":true,"errors":5,"distinctErrorTraces":5,"httpServerForErrorTraces":5}
[cached]   sink: {"type":"event","exception":"Error: boom t0",...,"trace_id":"32b84ec1df384ac5a44651d0c3aabac1","user":{"id":"t0","ip_address":"127.0.0.1"},"tags":{"req":"t0"},"request":{"url":"http://127.0.0.1:41734/a?tag=t0",...}}
[cached]   sink: {"type":"event","exception":"Error: boom t1",...,"trace_id":"4297f158f9044653b85157099dd08087","user":{"id":"t1","ip_address":"127.0.0.1"},"tags":{"req":"t1"},...}
[cached]   sink: {"type":"event","exception":"Error: boom t2",...,"trace_id":"137bcb9edf90480bbf62e2985be53e66","user":{"id":"t2","ip_address":"127.0.0.1"},"tags":{"req":"t2"},...}
[cached]   sink: {"type":"event","exception":"Error: boom t3",...,"trace_id":"69b87655da03431bbda14e0509e3f8be","user":{"id":"t3","ip_address":"127.0.0.1"},"tags":{"req":"t3"},...}
[cached]   sink: {"type":"event","exception":"Error: boom t4",...,"trace_id":"3fc56927f7594e8b8e57f91ea9c37e8a","user":{"id":"t4","ip_address":"127.0.0.1"},"tags":{"req":"t4"},...}
[cached]   sink: {"type":"span","trace_id":"32b84ec1df384ac5a44651d0c3aabac1","items":["http.server GET"],"raw":[{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}
[cached]   sink: {"type":"span","trace_id":"4297f158f9044653b85157099dd08087","items":["http.server GET"],...}
[cached]   sink: {"type":"span","trace_id":"137bcb9edf90480bbf62e2985be53e66","items":["http.server GET"],...}
[cached]   sink: {"type":"span","trace_id":"69b87655da03431bbda14e0509e3f8be","items":["http.server GET"],...}
[cached]   sink: {"type":"span","trace_id":"3fc56927f7594e8b8e57f91ea9c37e8a","items":["http.server GET"],...}
[cached]   sink: {"type":"event","message":"sentinel",...,"trace_id":"9d556c6af633410081173d97d0b2e457","user":{"ip_address":"127.0.0.1"},"request":{"url":"http://127.0.0.1:41734/sentinel",...}}
[uncached] app /a x5 -> done t0 | done t1 | done t2 | done t3 | done t4
[uncached] app /sentinel -> 200 sentinel
[uncached] verdict {"isolated":true,"sentinelClean":true,"errors":5,"distinctErrorTraces":5,"httpServerForErrorTraces":5}
[uncached] sink: {"type":"event","exception":"Error: boom t1",...,"trace_id":"f70cb6c778a142aeb1d701f65ae5601a","user":{"id":"t1","ip_address":"127.0.0.1"},"tags":{"req":"t1"},...}
[uncached] sink: {"type":"event","exception":"Error: boom t0",...,"trace_id":"b62b21bfc4cd4811951a5bd3d284380b","user":{"id":"t0","ip_address":"127.0.0.1"},"tags":{"req":"t0"},...}
[uncached] sink: {"type":"event","exception":"Error: boom t2",...,"trace_id":"9bac239ffbb44f2985714dbeab846540","user":{"id":"t2","ip_address":"127.0.0.1"},"tags":{"req":"t2"},...}
[uncached] sink: {"type":"event","exception":"Error: boom t3",...,"trace_id":"95966fd3a89a4636bdd5a06ea0bc87c0","user":{"id":"t3","ip_address":"127.0.0.1"},"tags":{"req":"t3"},...}
[uncached] sink: {"type":"event","exception":"Error: boom t4",...,"trace_id":"672323e6abf84f799eba91fd9f95a826","user":{"id":"t4","ip_address":"127.0.0.1"},"tags":{"req":"t4"},...}
[uncached] sink: {"type":"span","trace_id":"b62b21bfc4cd4811951a5bd3d284380b","items":["http.server GET"],"raw":[{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}
[uncached] sink: {"type":"event","message":"sentinel",...,"trace_id":"ad57dd23a82442b78e56f43990bb215d","user":{"ip_address":"127.0.0.1"},...}
```

The recorded side observation holds: every `http.server` span item is named `GET`, carries
`origin auto.http.cloudflare`, and carries no `req` tag as an attribute. The request-scoped tag and
user live only on the error event, and the sentinel event carries neither.

`cacheClient` exists in this build, so the `uncached` variant really does take the per-invocation
client path rather than silently reusing the cached one:

```
node_modules/@sentry/cloudflare/build/esm/dev/baseSdk.js:40:  const cacheEnabled = options.cacheClient !== false;
node_modules/@sentry/cloudflare/build/esm/dev/client.js:33:    this.isCachedClient = options.cacheClient === true;
```

### Differences from the record

- Scope: the record ran this same script against a second app on `@sentry/cloudflare@10.73.0`. This
  rebuild is develop-only, so it holds one app instead of the record's `develop/` + `10.73.0/` pair,
  and the record's 10.73.0 column is not re-verified here.
- Nothing else. Both variants reproduce the recorded verdict object exactly.

### Older log directories

`logs-*-run4/` is the current run. `logs-cached-run1/`, `logs-uncached-run1/`, `logs-cached-run3/`
and `logs-uncached-run3/` are earlier rebuild passes and agree with run4. `logs-cached-run2/` is from
an aborted attempt whose sink port (47311) was already held by an unrelated process, so its envelopes
went to a foreign sink; ignore it. `run.sh` does not abort when the sink port is taken, so check that
`logs-<variant>-<label>/sink.log` says `sink listening <port>` before trusting a run.

Note on teardown: killing the `wrangler dev` parent can leave its `workerd` child holding the app
port. After a run, check `lsof -nP -iTCP:<appPort> -sTCP:LISTEN` and kill the leftover pid.
