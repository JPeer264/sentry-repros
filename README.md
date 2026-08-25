# sentry-cloudflare-waituntil-repro

Worker + Durable Object + Workflow that capture telemetry **after** the response, the scenarios of
[getsentry/sentry-javascript#22545](https://github.com/getsentry/sentry-javascript/issues/22545):

| Endpoint | What it exercises |
| --- | --- |
| `/burst?n=20` | 20 sequential DO RPC calls in one trace (control case, nothing after the response) |
| `/checkout` | worker `waitUntil` span tree with a log, a metric and an error; DO `waitUntil` audit span |
| `/detached` | DO work that is neither awaited nor in `waitUntil`; fires 500 ms after the RPC settled |
| `/multi-trace` | two independent traces whose spans end in the same turn past the flush point; call it at most every 7 s |
| `/async-probe` | captures separated by real awaits around the flush point, inside `waitUntil` and detached |
| `/single-capture?delay=N` | exactly one log, N ms after the response, and nothing after it |
| `/scope-probe` | does a DO RPC invocation see the caller's isolation scope, or a previous invocation's? |
| `/scope-size` | scope sizes per request: nothing may accumulate on a long-lived client |
| `/call?method=add\|greet\|processData\|fibonacci` | RPC methods with different argument shapes |
| `/wf-probe` | starts a Workflow; handler and workflow report their client and isolate, dedupe pairs, detached captures |

`cacheClient: true` (the default) delivers all of it. `cacheClient: false` (one client per invocation)
drops the detached telemetry because the client is disposed before the work fires.

The worker is built with Vite and `sentryCloudflareVitePlugin()`: `src/index.ts` contains no Sentry
wrapper, the plugin wraps the handler, the DO and the Workflow at build time and takes the options
from `src/instrument.server.ts`.

`cacheClient` ships with [getsentry/sentry-javascript#23151](https://github.com/getsentry/sentry-javascript/pull/23151).
`deploy` refuses a worker that the plugin did not wrap.

## Setup

```bash
pnpm install
export SENTRY_DSN=<dsn>
export WORKERS_SUBDOMAIN=<subdomain>          # https://<worker>.<subdomain>.workers.dev
export SENTRY_TARGET=<org>/<project>          # for validate, needs a logged-in `sentry` CLI
export CLOUDFLARE_ACCOUNT_ID=<account id>     # for cpu, `wrangler login` is enough
```

## Run

```bash
pnpm run run r1 on     # cacheClient: true
pnpm run run r1 off    # cacheClient: false
```

One run = one fresh worker `repro-<run>-cache-<on|off>` with the same string as Sentry `environment`.
`run` chains the four steps, which also work on their own:

```bash
pnpm deploy r1 on       # vite build + wrangler deploy
pnpm load r1 on         # Artillery: 100 requests at 5/s, 50 burst, 25 checkout, 25 detached
pnpm validate r1 on     # polls Sentry until every request delivered what it should
pnpm cpu r1 on          # Cloudflare CPU per request for the load window
```

`validate` prints `"passed": true` or the list of what is missing, per trace. For `off` it expects
the `/detached` telemetry to be absent.

The load is [`scripts/load.yml`](scripts/load.yml); `scripts/load-processor.cjs` hands out the fixed
mix and the request ids (`<run>-<kind>-001` ...) that `validate` looks for. `WORKER_URL=<base url>`
points `load` at any worker, e.g. a local `pnpm dev`.

### Switches

`wrangler.jsonc` `vars`, overridable per deploy through the environment
(`EDGE_CASES=false pnpm deploy b1 on`) or locally in `.dev.vars`:

| Var | Default | Effect |
| --- | --- | --- |
| `EDGE_CASES` | `true` | `false` removes every post-response and detached capture, so SDK variants emit identical telemetry (1:1 CPU comparisons; `validate` then fails on purpose) |
| `RPC_TRACE_PROPAGATION` | `true` | `false`: DO invocations start their own traces |
| `SENTRY_TRACES_SAMPLE_RATE` | `1` | keep 1, an unsampled trace looks like a lost one |
| `SENTRY_DEBUG` | `false` | SDK debug logger, not under load |

The other probes (`/multi-trace`, `/async-probe`, `/single-capture`, `/scope-probe`, `/wf-probe`) are
checked by hand: call them with an `x-request-id` header and look the id up in Sentry
(`repro.request_id` on spans), or watch the envelopes locally.

## Benchmark

[`BENCHMARK.md`](BENCHMARK.md): `cacheClient` on vs off vs released v10 on real Workers, five fresh
workers per cell, medians of CPU, response time and DO time, with the raw per-worker data in
[`benchmarks/`](benchmarks/).

## Local development

```bash
echo 'SENTRY_DSN=http://key@127.0.0.1:9999/1' > .dev.vars
node scripts/envelope-catcher.mjs &          # prints every envelope
pnpm dev
curl -s localhost:5173/checkout
WORKER_URL=http://localhost:5173 pnpm load local on
```

## Notes

- `Env` comes from `wrangler.jsonc` (`worker-configuration.d.ts`). Run `pnpm types` after a change
  to the config.
- Deploy a fresh worker per run (the scripts do). Worker names and DO namespaces are reused
  otherwise, and old isolates keep the old code for a while.
- CPU numbers vary by ±40 % between hosts. Compare `on` vs `off` only from runs made
  directly after each other, in both orders.
