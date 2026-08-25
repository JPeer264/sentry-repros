# sentry-cloudflare-waituntil-repro

Worker + Durable Object that captures telemetry **after** the response, the scenarios of
[getsentry/sentry-javascript#22545](https://github.com/getsentry/sentry-javascript/issues/22545):

| Endpoint | What happens after the response |
| --- | --- |
| `/burst?n=20` | nothing; 20 DO RPC calls in one trace (control case) |
| `/checkout` | worker `waitUntil` span tree with a log, a metric and an error; DO `waitUntil` audit span |
| `/detached` | DO work that is neither awaited nor in `waitUntil`; fires 500 ms after the RPC settled |

`cacheClient: true` (the default) delivers all of it. `cacheClient: false` (one client per invocation)
drops the `/detached` telemetry because the client is disposed before the work fires.

The worker is built with Vite and `sentryCloudflareVitePlugin()`: `src/index.ts` contains no Sentry
wrapper, the plugin wraps the handler and the DO class at build time and takes the options from
`src/instrument.server.ts`.

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
pnpm load r1 on         # 100 requests: 50 burst, 25 checkout, 25 detached
pnpm validate r1 on     # polls Sentry until every request delivered what it should
pnpm cpu r1 on          # Cloudflare CPU per request for the load window
```

`validate` prints `"passed": true` or the list of what is missing, per trace. For `off` it expects
the `/detached` telemetry to be absent.

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
```

## Notes

- `Env` and the runtime types come from `wrangler.jsonc` (`worker-configuration.d.ts`). Run
  `pnpm types` after a change to the config.
- Keep `tracesSampleRate: 1`: an unsampled trace looks like a lost one.
- Deploy a fresh worker per run (the scripts do). Worker names and DO namespaces are reused
  otherwise, and old isolates keep the old code for a while.
- CPU numbers vary by ±40 % between hosts. Compare `on` vs `off` only from runs made
  directly after each other, in both orders.
