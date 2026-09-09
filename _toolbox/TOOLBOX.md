# Toolbox for probe agents

You are one of many agents probing the Sentry JavaScript SDKs for Bun, Deno and Cloudflare Workers.
Everything you need is prepared. Read this whole file before doing anything.

## Ground rules

- `S=$SCRATCH`
- Work ONLY inside `$SCRATCH/deep/<your task id>/` (create it). Never modify `~/dev/sentry-javascript`, the
  worktree, or another agent's directory. Everything else is read-only.
- Other agents run at the same time. Pick random ports between 20000 and 60000 for every server you
  start. Never use 3030, 3031, 3999, 8787, 9229 to 9254.
- Kill every process you started before you finish (`kill $pid; wait $pid`).
- Do not create GitHub issues, PRs, comments, or write to Linear. Read-only there.
- Time-box: if a setup step fails twice for environmental reasons, record `not-run` with the exact
  error and move on. A `not-run` with a clear reason is more useful than a guess.

## The SDK version to test: develop only

**Test `develop` ONLY. Do not install or test `10.73.0`.** `develop` is `getsentry/sentry-javascript`
at `6f2da7483d` (the v11 line, package version 10.67.0), built in the worktree
`W=~/dev/sentry-worktrees/audit-runtime-docs`.

Two ways to install it:

- **Tarballs (preferred, and required for anything Vite, rollup, Next.js or Cloudflare):**
  `npm install $REPRO/_toolbox/pack/*.tgz <your other deps>` in your task dir with a `package.json`. The tarballs are
  `@sentry/{bun,node,deno,cloudflare,hono,elysia,core,server-utils,server-runtime-injection,opentelemetry}`
  at 10.67.0. If you need a framework SDK that is not in `$REPRO/_toolbox/pack` (`@sentry/nextjs`, `@sentry/nuxt`,
  `@sentry/sveltekit`, `@sentry/astro`, `@sentry/react-router`, `@sentry/tanstackstart-react`,
  `@sentry/remix`, `@sentry/solidstart`, `@sentry/nestjs`), pack it yourself from the worktree:
  `(cd $W/packages/<name> && npm pack --pack-destination $REPRO/_toolbox/pack)`. If that package has no `build/`
  directory, build it first: `(cd $W && yarn build:dev:filter @sentry/<name>)`. Say so in your notes if
  a package could not be packed.
- **Worktree symlinks** for Bun and Deno without a bundler: symlink
  `node_modules/@sentry/<name>` to `$W/packages/<name>`.

`bun add` cannot resolve the tarballs' transitive `@sentry/*@10.67.0` deps; use `npm install` and then
run with `bun`, which reads the resulting `node_modules` fine.

On develop the defaults are: `traceLifecycle: 'stream'` (spans arrive as `span` envelopes; a server span
without a router is named by method only), `attachStacktrace: true`, no `enableLogs` option (logs are
always on), no `enableMetrics` option. Pass `traceLifecycle: 'static'` when you want `transaction`
envelopes with nested `spans[]`, which is usually easier to assert on. `@sentry/cloudflare` on develop
exports `withSentry` from the main entry and `wrapRequestHandler` from `@sentry/cloudflare/request`;
there is no `/nodejs_compat` subpath, no `instrumentD1WithSentry`, no `honoIntegration`, and RPC uses
`rpcTracePropagationBindings`. The Cloudflare Vite plugin takes top-level `autoInstrumentation` and
`buildTimeInstrumentation`, both default true, so a bare `sentryCloudflareVitePlugin()` already wraps
the entry and injects channels.

Templates you can copy (`cp -R $SCRATCH/qs/<name> $SCRATCH/deep/<id>/`): `$SCRATCH/qs/bun` (Bun app, symlinked SDK,
express + mysql), `$SCRATCH/qs/deno` (Deno app, `deno.json` with `nodeModulesDir: "manual"`),
`$SCRATCH/qs/cloudflare-v11pack` (Cloudflare app, real `node_modules` from the tarballs plus vite,
`@cloudflare/vite-plugin`, wrangler, mysql). Their `node_modules` may have been cleaned to save disk;
reinstall with `npm install $REPRO/_toolbox/pack/*.tgz ...` if a template is empty.

**Disk is tight.** Install only what you need, prefer one app per task instead of one per variant, and
when you are done with a build you no longer need, remove its `node_modules` (`rm -rf node_modules` is
the one allowed `rm` form).

## Runtimes on this machine

| Tool | Version | Path |
| --- | --- | --- |
| node | v26.5.0 | `node` |
| bun | 1.4.0 | `bun` |
| bun (CI pin) | 1.3.14 | `$SCRATCH/bun1314/bun-darwin-aarch64/bun` |
| deno | 2.9.0 | `deno` |
| deno (CI pin) | 2.8.3 | `$SCRATCH/deno283/deno` |
| wrangler | 4.x | `npx wrangler` inside a dir that has it in `node_modules`, or `npx wrangler@4` |
| docker | 29 | MariaDB container already running, see below |

## Envelope sink

Start your own: `PORT=<port> node $REPRO/_toolbox/sink.mjs > sink.log 2>&1 &`. Point the SDK at it with
`tunnel: "http://127.0.0.1:<port>/"` (works on all three runtimes; on Cloudflare the Worker reaches
the host at `127.0.0.1`). Then:

- `curl -s http://127.0.0.1:<port>/__items` returns a JSON array. Items: `event` (`message`,
  `exception`, `mechanism`, `handled`, `sdk`, `runtime`, `hasContextLine`), `transaction` (`name`,
  `op`, `source`, `status`, `spans[]` as `"<op> <description>"`), `span` (`items[]` as
  `"<op> <name>"`, stream lifecycle), `log` (`items[]` as `"<level>: <body>"`), and `{type}` for
  everything else (`sessions`, `session`, `trace_metric`, `check_in`, `client_report`, ...).
- `curl -s -X DELETE http://127.0.0.1:<port>/__items` clears it.
- If you need fields the sink does not keep (trace ids, user, tags, request data, release, session
  fields), copy `$REPRO/_toolbox/sink.mjs` into your dir and extend the compact mapping, or write the raw
  payloads to a file.

Envelope timing: logs and metrics are flushed on a timer, wait 7 seconds before reading them. For
events and spans, send a sentinel (`Sentry.captureMessage('sentinel')`) after the behavior under
test and wait until the sentinel is in the sink; everything sent before it has then arrived. Never
"sleep and hope" for events.

Sampling gotcha: a `fetch` made from a Sentry-initialized process without an active span carries a
`sentry-trace` header that marks the server-side transaction as not sampled. Drive your app from a
separate plain `node` or `curl` process (see `$SCRATCH/qs/bun/drive.mjs`), or wrap the client calls in
`Sentry.startSpan` in the probe process.

## Database

MariaDB 11 on `127.0.0.1:3307`, user `root`, no password, database `app`, table `users(id, name)`
with two rows. The `mysql@2` and `mysql2` drivers work. Create connections or pools at MODULE SCOPE:
on Bun a driver whose module first loads inside a request produces no spans (known finding K11).
There is no Postgres, Redis or Mongo; for those drivers, say `not-run` unless you can start a
container yourself (`docker run -d --rm --name deep-<id>-<db> ...`; remove it when done).

## Runtime-specific facts already established (do not re-derive, but do report if you see otherwise)

Bun:
- Init: `import "./instrument";` as the first line of the entry, or `bun --preload ./instrument.ts app.ts`.
- Plain `bun run` records errors, `Bun.serve` spans (route names only with `routes: {}`), `fetch`
  and `node:http` client spans with `sentry-trace`/`baggage`, logs. It records NO library spans
  (databases, AI, Express, Koa, Hapi, Fastify); the SDK warns only with `debug: true`.
- Library spans need a bundle: `build.ts` with
  `Bun.build({ entrypoints: ["./app.ts"], outdir: "./dist", target: "bun", external: ["@sentry/*"], sourcemap: "external", plugins: [sentryBunPlugin()] })`
  where `import { sentryBunPlugin } from "@sentry/bun/plugin"`, then `bun dist/app.js`.
  This gives Express/Koa/Hapi/Fastify spans and errors, database spans and AI spans. Hono works with
  `@sentry/hono/bun`; when bundling, never split `hono` and `@sentry/hono` across the bundle boundary
  (either both external, or no `external` at all).
- K11: a driver whose instrumented module first loads inside a request gets no spans; on Bun 1.4.0
  the injected channel does not even fire in that case. Module-scope connections work.

Deno:
- `deno.json`: `nodeModulesDir: "auto"` (or `"manual"` with a prepared `node_modules`); the hook only
  transforms packages under a local `node_modules`. First line of the entry: `import "@sentry/deno/import";`.
  The bare `--import=@sentry/deno/import` flag does not resolve; `--import=./node_modules/@sentry/deno/build/import.mjs` does.
- Run with `deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main.ts`.
- Without the hook: errors, method-named `Deno.serve` spans, `node:http` server and client spans with
  headers, logs; no library spans and no warning. With the hook: `mysql` spans (module-scope connection
  is fine and per-request also works on Deno), Fastify works even without the hook, Hono works.
- K2: outgoing `fetch` gets no span and no headers. K3: with the hook active, any `require('*.json')`
  fails (`SyntaxError: Unexpected token ':'`), so Express, Hapi, Fastify crash at import; Koa fails
  on `generator-function/require.mjs`. This is a Deno bug (denoland/deno#36240).

Cloudflare:
- `wrangler.jsonc`: `"compatibility_date": "2026-05-01"` (the local workerd here rejects newer dates),
  `"compatibility_flags": ["nodejs_compat"]`. Run `npx wrangler dev --port <port> --inspector-port 0`;
  readiness line: `Ready on http://localhost:<port>`. Add `--test-scheduled` to get the `/__scheduled`
  endpoint for `scheduled` handlers.
- `withSentry((env) => ({...}), { fetch, scheduled, queue, ... })`. Errors, method-named request spans,
  `http.client` spans with headers, logs work out of the box. D1, R2, Queue producers, Workers AI on
  `env` are instrumented automatically; Durable Objects, Workflows, Agents need their wrapper.
- Vite: `vite.config.ts` with `cloudflare()` from `@cloudflare/vite-plugin` and
  `sentryCloudflareVitePlugin()` from `@sentry/cloudflare/vite`; `vite build` writes
  `dist/<worker>/wrangler.json`; run `npx wrangler dev --config dist/<worker>/wrangler.json`. Use a
  real `node_modules` (tarballs or npm), not symlinks, for Vite.
- `nodejs_als` alone boots the base SDK; no flag at all fails with `No such module "node:async_hooks"`.

## What to return

Your final answer is the StructuredOutput. For each version you tested give a verdict:
`works` (behaves as the claim says), `broken` (does not), `partial` (say which part), `not-run`
(say why). Paste the sink lines that carry the verdict, verbatim and trimmed. Give the exact commands
and the path of your probe files so someone can rerun them. If you looked at the docs, say what the
relevant page claims (file:line under `~/dev/sentry-docs/docs/platforms/javascript/guides/<guide>/`
or `~/dev/sentry-docs/platform-includes/`), but do not spend long on docs; another agent does that.

## Commands you must not run (they block on a permission prompt that nobody can answer)

- No `rm` in any form, not even on your own files. Use a fresh directory name instead
  (`attempt2/`, `run-b/`). The single exception is the literal `rm -rf node_modules`.
- No `mv` or `cp` onto an existing path. Write to a new path.
- No `kill $(cat something)` or `pkill`. Capture the pid when you start a process (`cmd & pid=$!`)
  and `kill $pid` that variable only.
- No `git` commands that write, no `sudo`, no `docker rm` of containers you did not start.
- If a command is denied, do not retry it; find another way or record `not-run` with the reason.

## Framework SDK tarballs (added for the framework matrix)

`$REPRO/_toolbox/pack` now also holds `@sentry/{nextjs,nuxt,sveltekit,astro,react-router,tanstackstart-react,remix,solidstart,nestjs,vue,react,svelte,solid,browser}` at 10.67.0, all built from the same worktree commit. Install the ones your framework needs together with the runtime SDK, for example:

```
npm install $REPRO/_toolbox/pack/sentry-nuxt-10.67.0.tgz $REPRO/_toolbox/pack/sentry-node-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
            $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
            $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz $REPRO/_toolbox/pack/sentry-browser-10.67.0.tgz $REPRO/_toolbox/pack/sentry-vue-10.67.0.tgz
```

npm resolves the tarballs' `@sentry/*@10.67.0` dependencies only if you pass every one they need on the
same command line, so list them all. If npm still complains about an unresolved `@sentry/*@10.67.0`,
add that tarball too.

## Two tarball sets

- `_toolbox/pack/`: 31 packages from develop at `6f2da7483d` (2026-09-04), the pin of the probes, the cells, the refutations and the four first getting-started paths.
- `_toolbox/pack-develop-03aaf424/`: 43 packages from develop at `03aaf42455` (2026-09-08), used by every getting-started path run from 2026-09-08 22:00 on, including the browser, browser-framework, meta-framework and serverless paths. Both sets carry the version 10.67.0, so never mix the two directories in one install, and name the set in the README of every reproduction.

### Angular tarball

The first `sentry-angular-10.67.0.tgz` in `pack-develop-03aaf424/` was packed from the package root (21 source files, no build output) because `@sentry/angular` builds with ng-packagr into `build/`, where the publishable package.json lives. Re-packed on 2026-09-09 from `packages/angular/build` of the `03aaf42455` worktree; the Angular quick start keeps its own copy in `quickstarts/angular/vendor/` because it ran before the fix.
