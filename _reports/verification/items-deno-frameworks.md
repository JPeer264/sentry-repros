# Verification: DOC-F18 .. DOC-F34 (frameworks on Deno)

Checked against sentry-docs master `aebda0ee4` (the audit cited `046ce5942` / `b568ebbd3`),
the cell records in `_records/cells-all.json`, the cell READMEs, the `verify4-*` / `verify5-*`
refutation directories, `_records/refutations.json`, `_records/results.json`,
`quickstarts/deno/`, and `MIGRATION.md` on `getsentry/sentry-javascript@develop`.
Read-only: nothing outside this directory was written, no reproduction was re-run.

## Headline

- **No docs finding is wrong.** Every "the docs say X" and every "grep returns nothing" claim
  still holds on today's master. Nine items cite line numbers that moved (the Guides
  restructure, `#19241`, shifted several pages); one grep claim is now stale.
- **The docs side is not where the problems are. The evidence side is.** Eight of seventeen
  drafts state a limit the evidence refutes, omit a verified shipped-export fix, or omit a
  step without which the documented app does not run.

| Verdict | Items |
| --- | --- |
| correct-and-open | F18 Hono, F19 Elysia, F23 Hapi, F25 Fresh, F27 Next.js, F29 SvelteKit, F30 Astro, F32 TanStack |
| partially-correct | F20 Express, F21 Fastify, F22 Koa, F24 Oak, F26 NestJS, F28 Nuxt, F31 React Router, F33 Remix, F34 SolidStart |
| correct-but-fixed-on-master | none |
| wrong | none |

## Docs side

Holds verbatim: F19 (elysia :25, the two-runtime platform-include :6/:9-12), F20/F21/F22/F23
(the four `sdk: sentry.javascript.node` + `fallbackGuide` frontmatters and the bare
`getting-started-node` bodies), F26 (nestjs :1-9, deno beta Alert :12-16), F28
(nitro-deployment-presets.mdx:7, still an 11-line file documenting only Cloudflare Pages),
F34 (solidstart :1-7, the :444-470 verification step, the missing
`javascript.solidstart.mdx` prerequisites include).

Line numbers that moved:

| Item | Cited | Today |
| --- | --- | --- |
| F18 | hono deno tab :320-348, "Report Unhandled Exceptions" :384 | :302-324, :360 |
| F24, F25 | deno guide run flags :106, :125 | :100, :119 |
| F25 | Fresh grep hit `cloudflare/features/agents-sdk.mdx:39` | `cloudflare/agent-tracing/agents-sdk.mdx:43` (+ a 2nd hit on the v10-to-v11 page) |
| F27 | options.mdx `traceLifecycle` :729 | :755 |
| F28 | nuxt cli-import.mdx `node --import` :33 | :37 |
| F29 | sveltekit expandable :21-35, non-Node bullet :30-31 | :21-36, :32 |
| F30 | astro runtime Alert :22-31 | :21-29 |
| F31 | `server-node` index.mdx:7; start cmds :413-414; warnings :430/:449 | :9; :400-401; :417/:436 |
| F32 | `--import` heading :300; start script :369-376 | :286; :354-358 |
| all | guides/deno/index.mdx :1-232 | :1-230 |

Greps re-run: `deno` over the express/fastify/koa/hapi/nestjs/nextjs/nuxt/sveltekit/astro/
react-router/tanstackstart-react/remix/solidstart/elysia guides = **0** each; the reverse grep
for each framework over `guides/deno/` = **0** each; `oak` over docs + platform-includes = **0**;
`@sentry/deno/import|registerHooks` = **0**; `enableRuntimeChannelInjection` = **0**;
`installGlobals` = **0**. The Hono grep returns exactly the 2 breadcrumbs hits the audit named.

One stale claim: **F33** says a grep for `orchestrion` returns zero. It now returns **2**, both on
`docs/platforms/javascript/common/migration/v10-to-v11/index.mdx` (:689 and :1297). Remix on Deno
is still undocumented, so the finding stands, but the sentence needs fixing.

## Evidence side

**Limits the evidence refutes** (the draft states something as impossible that a recorded
refutation made work):

- **F20 Express** - route names, error capture and db spans are listed as unavailable, but the
  cell records all three as `works` (hook + a 6-line JSON load hook) and its headline reads
  "Express on Deno is fully instrumentable on develop". The draft is the no-hook half of the
  cell presented as the whole cell.
- **F22 Koa** - "parameterized route names are not available", contradicted by
  `verify4-M-koa-deno-routenames` (`works-after-all`) *and* by the errors refutation, which
  records that the esbuild + orchestrion build the draft itself prescribes yields
  `GET /users/:id` with source `route`.
- **F24 Oak** - "the naming middleware runs after `await next()`, so error responses keep the
  unparameterized name", refuted for the `router.use(...)` form the draft's own setup prescribes.
- **F26 NestJS** - "the route pattern never appears", refuted by
  `verify4-M-nestjs-deno-routenames` (`works-after-all`, injection left on plus a 6-line JSON
  load hook).
- **F34 SolidStart** - "server transactions cannot be parameterized by the SDK", refuted with a
  middleware built on `setHttpServerSpanRouteAttribute`, a shipped `@sentry/server-utils` export.

**Outgoing fetch.** Every cell reproduces the gap; the question is only whether a *shipped*
fix exists. Applying the audit's own rule:

| Fix found | Items | Draft names it? |
| --- | --- | --- |
| `winterCGFetchIntegration` (@sentry/vercel-edge) | F21 Fastify, F27 Next.js, F28 Nuxt, F34 SolidStart | only F27, F28 |
| `fetchIntegration` (@sentry/cloudflare) | F20 Express, F29 SvelteKit, F30 Astro, F31 React Router | only F29, F30 |
| `fetchIntegration` (@sentry/elysia, real export at packages/elysia/src/index.ts:60) | F19 Elysia | yes |
| `installGlobals()` (@remix-run/node) | F33 Remix | yes |
| hand-written @sentry/core integration only -> stays a limit | F18 Hono, F22 Koa, F23 Hapi, F25 Fresh, F26 NestJS, F32 TanStack | correctly kept as a limit |

So F20, F21, F31 and F34 under-report a verified shipped fix. Package facts that matter:
`@sentry/vercel-edge` is already a dependency of `@sentry/nextjs`; `@sentry/cloudflare` is
already a dependency of `@sentry/sveltekit` **and of `@sentry/nuxt`** (so F28 should prefer it
over vercel-edge); `@sentry/astro` and `@sentry/react-router` depend on neither, so those pages
must say "install it".

**No draft presents a hand-written integration as the documented fix.** One place does: the
audit page's "Page:" narrative for **F18** tells the docs to ship a `denoFetchIntegration()`
assembled from `@sentry/core` primitives. That breaks the audit's own rule and should come out
of the page proposal.

**Claims with no recorded evidence:**

- **F31** - "Database spans, with the Vite plugin and the `ssr` config above". The cell records
  `partial` (mysql2 unusable, module-scope pool detaches the span onto its own trace), the rerun
  re-confirms it, and `verify4-M-reactrouter-deno-dbspans` recorded no verdict while its
  bundled-driver run failed with `SqlString2.format is not a function`. No run used
  `ssr: { noExternal: true, ... }`.
- **F28** - isolation and incoming trace are listed as working on the `node-server` preset, but
  only route names / `http.server` spans / `getActiveSpan()` were measured there; the isolation
  and incoming-trace refutation dirs recorded no result, and the cell's `broken` verdicts are
  `deno_server` measurements. The fetch fix was verified on `deno_server`, mostly under `stream`.
- **F34** - the isolation limit's mechanism ("triggered by the first dynamic import of a route
  chunk") is borrowed from the Fresh refutation; nothing recorded it for SolidStart.

## Wiring side

- **F26 NestJS - the documented app does not boot.** The cell's setup calls
  `globalThis.__SENTRY_ORCHESTRION__ = { runtimeUnavailable: true }` mandatory and every probe
  ran with `NO_INJECT=1`; the draft's setup omits it and names no alternative. The public lever
  is `enableRuntimeChannelInjection: false`, which the Next.js item already uses.
- **F31 React Router** - the cell's working shape is a hand-written `node:http` server entry
  (`createRequestHandler` over `http.createServer`) whose first line imports the instrument
  file; "a bare `Deno.serve` handler gets neither" the server span nor the isolation scope, and
  `react-router-serve` / `NODE_OPTIONS` are unusable on Deno. The draft never says what the
  server entry is.
- **F34 SolidStart** - omits `NODE_ENV=production` for the build, which the cell says is what
  runs the orchestrion pass, i.e. what produces the mysql2 spans the item claims.
- **F33 Remix** - omits the ordering rule (`installGlobals()` in the server entry must run
  *after* the instrument import, or every transaction and span disappears process-wide), the
  mandatory `createRequire` banner, and that `@remix-run/server-runtime` must be bundled. Also
  `guides/remix/` has no `install/` directory today, so the proposed page path creates one.
- **F22 Koa** - db-span recipe omits the load-bearing `mysql.createConnection` (not
  `createPool`) rule.
- **F18 Hono** - "or `deno add npm:@sentry/hono`" is unverified; the cell installed with npm and
  the Deno quickstart deliberately never ran `deno add`.

The `deno run --allow-net --allow-env --allow-read --allow-sys` flag set every @sentry/deno
draft uses is right, and `quickstarts/deno` shows why: the guide's own
`--no-prompt --allow-net` set crashes at startup with
`NotCapable: Requires env access` inside the vendored `debug` package.

## Migration guide answer

Yes to both, and both are v10 -> v11 changes, i.e. they apply to the 10.67.0-develop build the
audit ran:

- **DOC-F31** must write `import { sentryReactRouter } from '@sentry/react-router/vite'`
  (MIGRATION.md, "React Router: Vite plugin moved to `@sentry/react-router/vite`";
  `sentryOnBuildEnd`, `makeConfigInjectorPlugin` and `SentryReactRouterBuildOptions` moved too).
  `packages/react-router/package.json` exposes the `./vite` subpath.
- **DOC-F33** must write `import { sentryRemixVitePlugin } from '@sentry/remix/vite'`
  (MIGRATION.md, "Remix: Vite plugin moved to `@sentry/remix/vite`"). The same entry says the
  plugin now applies the build-time instrumentation transform and that a manually added
  `sentryOrchestrionPlugin()` from `@sentry/server-utils/orchestrion/vite` should be removed -
  worth re-checking whether F33's separate esbuild orchestrion step is still required.

Both moves are documented in `docs/platforms/javascript/common/migration/v10-to-v11/index.mdx`
(:1263 and :1287), but **no guide page uses either subpath yet** - a grep for
`@sentry/remix/vite` / `@sentry/react-router/vite` outside the migration page returns nothing.

## Recurring corrections worth applying across the set

1. Re-anchor the moved line numbers (table above).
2. Wherever a shipped export fixes outgoing fetch, say so; where only a hand-written
   integration does, keep the limit and name the SDK gap
   (`@sentry/deno` ships no fetch tracing integration; `@sentry/node`'s is undici-only).
3. Two Deno bugs drive most of the "cannot be used" language across F20, F22, F23, F26, F29,
   F31 and F33: `denoland/deno#36240` (any registered module hook makes `require('*.json')`
   compile as JS) and the missing global-fetch integration. Both have small, verified user-land
   compensations. State them once in the shared `guides/deno/index.mdx` note the items already
   propose, and stop restating them as hard framework limits.
4. Two docs pages outside the audit's citations also need correcting and are already contradicted
   by these runs: `common/configuration/integrations/fetchIntegration.mdx:10` ("only works inside
   the Cloudflare Workers runtime") and
   `platform-includes/getting-started-use/javascript.hapi.mdx:17,42` (`setupHapiErrorHandler`,
   which `@sentry/deno` does not export).
