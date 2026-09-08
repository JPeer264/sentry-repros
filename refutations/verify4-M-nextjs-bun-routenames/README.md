# verify4-M-nextjs-bun-routenames

## What it re-tests

Independent re-test of the capability **route names** of cell `M-nextjs-bun` (see `$REPRO/cells/M-nextjs-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `REPRO-v2.md`, `REPRO.md`, `app-v3-casedir-bun.log`, `app-v3-casedir-node.log`, `app-v3-control-bun-stream.log`, `app-v3-control-bun.log`, `app-v4-casedir-node.log`, `app1.log`, `app2.log`, `app3.log`, `app4.log`, `app5.log`, `app6.log`, `build-v2-control.log`, `build-v3-casedir.log`, `build1.log`, `build2.log`, `build3.log`, `casedir/`, `nested/`, `nextapp/`, `pids-v2.txt`, `pids-v3.txt`, `pids.txt`, `pids2.txt`, `rootnamed/`, `sink-v2.log`, `sink-v3.log`, `sink1.log`, `sink2.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. Route names on Next.js 15.5.4 app router + @sentry/nextjs 10.67.0 (develop) under `bun --bun` are correct and consistent between events and transactions. The reported `/app` prefix and the event/transaction name disagreement were an artifact of the probe's own directory layout, and they reproduce identically on plain node, so nothing about them is bun-specific.

What I ran (all in $SCRATCH/deep/verify4-M-nextjs-bun-routenames/):

CONTROL, project root `nextapp/` (not named `app`), app dir `nextapp/app/`, wiring exactly as the reported recipe (`withSentryConfig` from `@sentry/nextjs/config`, `instrumentation.ts` with `register()` + `onRequestError`, `Sentry.init({ traceLifecycle: 'static' })`), built and served with `bun --bun ./node_modules/.bin/next build` / `next start -p 52908`:

{"type":"event","message":"users-probe-99","sdk":"sentry.javascript.nextjs","runtime":"node","transaction":"GET /api/users/[id]","trace_id":"f852d1d40f4e4f5789a4aa469ee1bf41"}
{"type":"transaction","name":"GET /api/users/[id]","op":"http.server","source":"route","status":"ok","trace_id":"f852d1d40f4e4f5789a4aa469ee1bf41","spans":["resolve page components","executing api route (app) /api/users/[id]/route","start response"]}
{"type":"event","exception":"Error: verify4 route handler boom","mechanism":"auto.function.nextjs.route_handler","handled":false,"transaction":"GET /api/error","trace_id":"d00d8b069e9c4e3e954e08231deb8c6c"}
{"type":"transaction","name":"GET /api/error","op":"http.server","source":"route","status":"internal_error","trace_id":"d00d8b069e9c4e3e954e08231deb8c6c"}

No `/app` prefix, `source: "route"`, and `event.transaction` equals the transaction name on the same trace_id. Same app with `traceLifecycle: 'stream'` (port 52909) also agrees:

{"type":"span","trace_id":"e5dcd4604557430ab24e4ead9b08866a","items":["executing api route (app) /api/users/[id]/route","start response","http.server GET /api/users/[id]"],"raw":[...,{"name":"GET /api/users/[id]","status":"ok","is_segment":true,"origin":"auto"}]}
{"type":"event","message":"users-probe-99","transaction":"GET /api/users/[id]","trace_id":"e5dcd4604557430ab24e4ead9b08866a"}

VARIANT reproducing the report: identical sources copied to `casedir/app/` so the Next.js project root is itself named `app` (this is what the original probe had: `M-nextjs-bun/app/` containing `app/api/...`). Under `bun --bun next start -p 52910`:

{"type":"transaction","name":"GET /app/api/users/[id]","op":"http.server","source":"route","status":"ok","spans":["resolve page components","executing api route (app) /app/api/users/[id]/route","start response"]}
{"type":"event","exception":"Error: verify4 route handler boom","mechanism":"auto.function.nextjs.route_handler","transaction":"GET /api/error","trace_id":"382cc20271df406fb2ee7edcb79de3c3"}
{"type":"transaction","name":"GET /app/api/error","op":"http.server","source":"route","status":"internal_error","trace_id":"382cc20271df406fb2ee7edcb79de3c3"}

The same casedir build served with plain `node ./node_modules/.bin/next start -p 38477` is byte-for-byte the same failure:

{"type":"transaction","name":"GET /app/api/users/[id]","op":"http.server","source":"route","status":"ok","trace_id":"597708a593df4aa395ee7e75e0115c7d"}
{"type":"event","exception":"Error: verify4 route handler boom","transaction":"GET /api/error","trace_id":"7455549702bd410a8dac164f5e5a72ad"}
{"type":"transaction","name":"GET /app/api/error","op":"http.server","source":"route","status":"internal_error","trace_id":"7455549702bd410a8dac164f5e5a72ad"}

ROOT CAUSE (Next.js, not Sentry, not bun). node_modules/next/dist/server/route-modules/app-route/helpers/get-pathname-from-absolute-path.js:

  function getPathnameFromAbsolutePath(absolutePath) {
      let appDir = '/app/';
      if (!absolutePath.includes(appDir)) { appDir = '\\app\\'; }
      const [, ...parts] = absolutePath.split(appDir);
      const relativePath = appDir[0] + parts.join(appDir);
      ...
  }

It strips everything up to and including the FIRST `/app/` in the resolved page path. When the project root (or any ancestor directory) is named `app`, that first `/app/` is the ancestor, so the real app-router segment survives: `/…/casedir/app/app/api/error/route.ts` -> `/app/api/error/route`. module.js:574-582 then does `tracer.setRootSpanAttribute('next.route', route)`. @sentry/nextjs hoists that attribute onto the root span and the isolation scope in packages/nextjs/src/server/handleOnSpanStart.ts:57-86, so the transaction becomes `GET /app/api/error`. `captureRequestError` instead uses Next's `errorContext.routePath` (packages/nextjs/src/common/captureRequestError.ts:41), which is correct, which is exactly why the two names disagree. Both build manifests (`.next/app-path-routes-manifest.json`) are identical in control and variant (`{"/api/error/route": "/api/error", ...}`), confirming the divergence is purely this runtime helper.

Cross-check against the repo's own reference app, dev-packages/e2e-tests/test-applications/nextjs-16-bun (read-only): it uses the same `withSentryConfig` from `@sentry/nextjs/config`, `traceLifecycle: 'static'`, and tests/route-handler.test.ts asserts `transactionEvent?.transaction === 'GET /route-handler/[xoxo]/node'` with no `/app` prefix — matching my control. That app additionally installs `@sentry/bun` and adds `bunHttpServerIntegration({ spans: false })` + `fetchIntegration()`, but those are for request isolation, not route names; my control produced correct names without them.

Not re-tested here: the isolation finding (the missing third concurrent event) from the same probe — that is a different capability and the reference app's `bunHttpServerIntegration({ spans: false })` is the documented answer to it.

Probe files and logs: .../deep/verify4-M-nextjs-bun-routenames/REPRO-v2.md, nextapp/ (control sources, package.json + package-lock.json kept; node_modules removed after the run), casedir/app/ (variant, node_modules was a symlink to nextapp/node_modules), build-v2-control.log, build-v3-casedir.log, app-v3-control-bun.log, app-v3-control-bun-stream.log, app-v3-casedir-bun.log, app-v4-casedir-node.log, sink-v3.log.

## Workaround

Do not name the Next.js project root directory (or any ancestor directory of it) `app`. Rename it to anything else (`web`, `my-app`, the project name) and rebuild — route names come out as `GET /api/users/[id]` with `transaction_info.source: "route"`, and events and transactions carry the same name. There is no SDK-side or bun-side setting that helps; `traceLifecycle: 'static'` and `'stream'` behave the same, and plain node fails identically, so this is a Next.js path-resolution bug (`getPathnameFromAbsolutePath` splits on the first `/app/`), not an SDK or runtime issue.

## Docs impact

No change needed to the bun-on-Next.js docs for route names: on Next.js 15.5.4 with `bun --bun next build` / `next start`, app-router route handlers are reported as `GET /api/users/[id]` with `transaction_info.source: "route"` under `traceLifecycle: 'static'` and as an `http.server` segment span of the same name under `'stream'`, and `event.transaction` matches. The only wiring the docs must correct is the import path, which affects every runtime: `withSentryConfig` now lives on the `@sentry/nextjs/config` subpath (`import { withSentryConfig } from '@sentry/nextjs/config'`), not on the main `@sentry/nextjs` entry.
