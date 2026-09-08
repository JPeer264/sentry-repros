# verify4-M-elysia-bun-sdkname

## What it re-tests

Independent re-test of the capability **sdk name** of cell `M-elysia-bun` (see `$REPRO/cells/M-elysia-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `RERUN.sh`, `app-baseline.log`, `app-inline-static.log`, `app-inline-static.ts`, `app-metadata-fix.log`, `app-metadata-fix.ts`, `app-metadata-full.log`, `app-metadata.log`, `app-patched.log`, `app-run1.log`, `app-static.log`, `app.ts`, `instrument.ts`, `package-lock.json`, `package.json`, `sink-inline-static.log`, `sink-metadata-fix.log`, `sink-patched.log`, `sink-run1.log`, `sink.log`, `sink.mjs`, `sink2.mjs`, `sinkpid.txt`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** confirmed-broken

Reproduced exactly, and could not refute it with any wiring. @sentry/elysia 10.67.0 (develop, 6f2da7483d) on bun 1.4.0, elysia 1.4.

Probe dir: $SCRATCH/deep/verify4-M-elysia-bun-sdkname/ (RERUN.sh has every command; node_modules removed after the run, RERUN.sh reinstalls it).

Wirings tried, all with `Sentry.withElysia(new Elysia())` wrapping the fresh instance before routes, `bun app.ts`, no --preload, no bundler:

A) separate instrument.ts imported as the first line of app.ts, traceLifecycle 'stream' (default)  -> BROKEN
B) init inline at the top of the entry file, traceLifecycle 'static'                                -> BROKEN
The repo's own e2e app (~/dev/sentry-worktrees/audit-runtime-docs/dev-packages/e2e-tests/test-applications/elysia-bun/src/app.ts) uses exactly shape B (inline init, traceLifecycle 'static'), so the reference app is affected too. `grep -rn "sentry.javascript.elysia"` over packages/ and dev-packages/ returns zero hits: nothing in the repo asserts the SDK name, which is why this ships unnoticed.

A) sink, stream lifecycle, GET /users/42 + /boom + sentinel:
  CLIENT_SDK_METADATA={"sdk":{"name":"sentry.javascript.bun","packages":[{"name":"npm:@sentry/bun","version":"10.67.0"}],"version":"10.67.0"}}
  event | env=sentry.javascript.bun@10.67.0 | pkgs=npm:@sentry/bun | elysia-boom
  event | env=sentry.javascript.bun@10.67.0 | pkgs=npm:@sentry/bun | sentinel
  span  | env=sentry.javascript.bun@10.67.0 | ... sentryOnRequest | Request | ... | GET /users/:id

B) sink, static lifecycle, inline init:
  CLIENT_SDK_METADATA={"sdk":{"name":"sentry.javascript.bun","packages":[{"name":"npm:@sentry/bun","version":"10.67.0"}],"version":"10.67.0"}}
  transaction | env=sentry.javascript.bun@10.67.0 | pkgs=npm:@sentry/bun | GET /users/:id (http.server)
  event       | env=sentry.javascript.bun@10.67.0 | pkgs=npm:@sentry/bun | elysia-boom

The `CLIENT_SDK_METADATA` line is `Sentry.getClient().getOptions()._metadata` read in the app itself, so this is settled inside `init`, before any transport or event processor, and no init placement, entry shape, lifecycle, or bundler variant can move it.

Root cause confirmed at source, exactly as reported. packages/elysia/src/sdk.ts:

  export function init(userOptions: ElysiaOptions = {}): NodeClient | undefined {
    const options = { ...userOptions, platform: 'javascript', runtime: getRuntime(), serverName: ... };
    applySdkMetadata(userOptions, 'elysia', ['elysia', options.runtime.name]);
    ...
    return initNode(options);
  }

`applySdkMetadata` (packages/core/src/utils/sdkMetadata.ts) does `(options._metadata = options._metadata || {}).sdk = ...`. When the caller passes no `_metadata`, the spread has already produced an `options` object with no `_metadata` key, so `applySdkMetadata` creates a brand-new object on `userOptions` that `options` never sees. `options` then reaches `@sentry/bun`'s `_init`, which does `applySdkMetadata(userOptions, 'bun')` correctly (packages/bun/src/sdk.ts:143 — before its own spread) and stamps `sentry.javascript.bun`.

Sibling packages get the ordering right, which shows this is a plain slip and not a design choice: packages/hono/src/bun/sdk.ts:25, node/sdk.ts:20, deno/sdk.ts:25 all call `applySdkMetadata(options, 'hono', [...])` on the already-copied object.

One-line SDK fix, proven: patch `applySdkMetadata(userOptions, "elysia"` -> `applySdkMetadata(options, "elysia"` in node_modules/@sentry/elysia/build/{esm,cjs}/sdk.js, rerun wiring A unchanged:
  CLIENT_SDK_METADATA={"sdk":{"name":"sentry.javascript.elysia","packages":[{"name":"npm:@sentry/elysia","version":"10.67.0"},{"name":"npm:@sentry/bun","version":"10.67.0"}],"version":"10.67.0"}}
  event | env=sentry.javascript.elysia@10.67.0 | pkgs=npm:@sentry/elysia,npm:@sentry/bun | elysia-boom
  span  | env=sentry.javascript.elysia@10.67.0 | ... GET /users/:id
Both the envelope header and the event payload then carry `sentry.javascript.elysia` with both packages listed, on stream and static lifecycle alike.

Same `init` is used by the elysia-node entry, so @sentry/elysia on node is affected identically (not separately run here).

## Workaround

User-land workaround, verified end to end: pass an empty `_metadata` object to `Sentry.init`, which makes the spread in `init` share the object reference so the elysia metadata written onto `userOptions` also lands on `options`.

  Sentry.init({
    dsn: '...',
    tracesSampleRate: 1.0,
    _metadata: {},
  } as any);

Result (probe file app-metadata-fix.ts, static lifecycle):
  CLIENT_SDK_METADATA={"sdk":{"name":"sentry.javascript.elysia","packages":[{"name":"npm:@sentry/elysia","version":"10.67.0"},{"name":"npm:@sentry/bun","version":"10.67.0"}],"version":"10.67.0"}}
  transaction | env=sentry.javascript.elysia@10.67.0 | pkgs=npm:@sentry/elysia,npm:@sentry/bun | GET /users/:id (http.server)
  event       | env=sentry.javascript.elysia@10.67.0 | pkgs=npm:@sentry/elysia,npm:@sentry/bun | sentinel

`_metadata` is an internal option and needs a TypeScript cast, so this is a stopgap for someone blocked on SDK-name-based routing or quotas, not something to put in a guide. The real fix is the one-line reorder in packages/elysia/src/sdk.ts (move `applySdkMetadata` above the spread, as @sentry/bun and @sentry/hono already do, or call it on `options`).

## Docs impact

The elysia guide's front matter already declares `sdk: sentry.javascript.elysia` (~/dev/sentry-docs/docs/platforms/javascript/guides/elysia/index.mdx:4), but the shipped package reports `sentry.javascript.bun` on every event, transaction and span, so until the SDK is fixed the page needs a note under the install/configure step: "Known issue: events sent by `@sentry/elysia` are currently tagged with `sdk.name: sentry.javascript.bun` instead of `sentry.javascript.elysia`. This only affects the SDK name shown on the event and any filtering or quota rules keyed on it; instrumentation, spans and error capture are unaffected." No docs-side wiring change helps, so the page must not suggest a different init placement, entry shape, or trace lifecycle as a remedy.
