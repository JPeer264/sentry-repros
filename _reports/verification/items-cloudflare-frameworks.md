# Verification: DOC-F35 to DOC-F51 (frameworks on Cloudflare Workers)

Checked against sentry-docs master `aebda0ee4` (the audit cited `046ce5942` / `b568ebbd3`),
sentry-javascript `develop`, and the cell records, cell READMEs and `verify4-*` refutations in
this repo. Read-only; no reproduction was re-run.

## Headline

All 17 findings are real: **no item is wrong**, and **nothing was fixed on master**. Every
absence claim I re-ran still returns zero hits, and every quoted line is still there. What
changed is line numbers, plus three claims that a page landing today made stale.

| Verdict | Items |
| --- | --- |
| correct-and-open | F35, F36, F38, F39, F43, F44, F46, F47, F48, F50, F51 (11) |
| partially-correct | F37, F40, F41, F42, F45, F49 (6) |
| correct-but-fixed-on-master | none |
| wrong | none |

## Docs side

**Line numbers moved on 8 items.** The biggest shifts are in the shared includes:

- Nuxt include: Cloudflare branch `:255-316` (cited `:261-322`), all sub-anchors -6.
- SvelteKit include: hooks branch `:299-347` (cited `:311-365`), Vite step `:351-376`,
  `sentrySvelteKit()` at `:369`, wrangler config `:378-387`.
- Remix include: Pages branch `:250-294`, "Capture Server-Side Errors" `:296-329`,
  the bare `@sentry/remix` import at `:314`.
- Astro: `astro.mdx` is 142 lines, not 148; the include's `withSentry` block is `:127-142`.
- TanStack Start: page is 281 lines; wrangler step `:102-123`, client config `:125`,
  error capture `:184`, source maps `:221`, verify `:232`.
- Cloudflare index: `## Known Limitations` is `:368`, not `:364` (affects F38's anchor).
- Fresh's incidental example moved: `features/agents-sdk.mdx:39` is now
  `agent-tracing/agents-sdk.mdx:43`.

**`nextjs.mdx` is line-exact** — still 56 lines, every cited line unchanged, `@sentry/cloudflare`
still absent from the page, `disableEval` still zero hits repo-wide.

**The v10-to-v11 migration guide landed today and makes three absence claims stale**
(`docs/platforms/javascript/common/migration/v10-to-v11/index.mdx`):
`patchExpressModule` now has 2 hits (`:748`, `:1375`), and `sentryOrchestrionPlugin` /
`@sentry/server-utils/orchestrion` / `buildTimeInstrumentation` 1 hit each (`:1297`).
That touches the F37 audit-page paragraph and the F40/F43 "appears nowhere" claims. No
how-to page documents them, so the substance survives.

**The Vite plugin page was NOT fixed.** `vite-plugin.mdx` changed since the audit (RPC
propagation section, agent-tracing link) but `_experimental.useDiagnosticsChannelInjection`
is still presented as required at `:30` and documented `defaultValue="false"` at `:162-166`,
against `packages/cloudflare/src/vite/index.ts:37,52-54` where `buildTimeInstrumentation` and
`autoInstrumentation` are top-level and both default `true`. The F37 and F50 corrections stand.

## Evidence side

**Two items claim things the evidence does not support:**

- **DOC-F49 (TanStack Start)** — "Works today: … client-side errors" is unsupported.
  `M-tanstack-cf` records seven capabilities with no `client errors` entry, and `results.json`
  says "all seven capabilities reproduce". The audit page's "all eight capabilities passed"
  is unsupported for the same reason. Worse, "the page's wiring is exactly what was
  exercised" is false: the run used `sentryTanstackStart()` in `vite.config.ts`, which the
  page never mentions (0 hits; the page has no Vite section at all), and the cell's own
  headline is that this is *the* thing the docs omit — it supplies both route names and db
  spans. The P2 "no gap surfaced" framing understates a real content gap.
- **DOC-F37 (Express)** — the Known-limits bullet ("route errors are swallowed by Express
  with no event", "no route names, no handler spans" on a plain wrangler build) contradicts
  two of its own refutations: `setupExpressErrorHandler` from `@sentry/server-utils` fixes
  capture, `patchExpressModule` from `@sentry/core/server` fixes names and handler spans
  (stream lifecycle only). The audit page states both; the item body does not.

**`mysql2` is described inconsistently across items.** F40 (Hapi) and F41 (Oak) say flatly
that `mysql2` cannot run / fails on workerd, but F36, F37, F43 and F44 all say it works with
`disableEval: true`, and three refutations measured that. Hapi and Oak just never passed the
flag. Both bullets need softening.

**Six items drop a verified workaround that the audit page carries.** F40 (hapi's `onRequest`
premature-close fix), F41 (Oak's corrected `try/finally` middleware), F42 (Fresh's `main.ts`
route-naming middleware), F45 (Nuxt's `beforeResponse` Nitro plugin), F46 (SvelteKit's
intermediate `handle`), F51 (SolidStart's vinxi/radix3 middleware). Each is a
"works-after-all" or a shipped recipe in the refutation record; the item bodies state only
the gap.

**One notable omission, F50 (Remix):** the `wrapRequestHandler` isolation defect — the only
`@sentry/cloudflare` wrapper that never calls `setAsyncLocalStorageAsyncContextStrategy`, so
tags/user/request data bleed across concurrent requests in the same isolate — is in the audit
page but not the item body, even though the draft lists "per-request isolation" under Works
today and the Hydrogen pages document exactly that shape.

**One finding is covered by no item at all:** DOC-F36 (Elysia) does not mention that
`platform-includes/performance/what-instrumentation-provides/javascript.elysia.mdx:3-5`
promises a span per Elysia lifecycle phase, while on workerd every transaction came back with
`spans: []`. That is a direct contradiction in the very file the item proposes to edit.

**One audit-page paragraph contradicts its own refutation, in the item body's favour:**
DOC-F46's finding text prescribes `ssr: { noExternal: [/^@sentry\//] }` as "the minimal fix",
but `verify4-M-sveltekit-cf-dbspans` warns that the regex force-bundles `@sentry/sveltekit`
and boots the Node SDK. The item body's three-package list is the correct one.

## Wiring side

Four items would not produce a working app as written:

- **F40 (Hapi)** — omits that routes must be registered and `server.start()` called inside
  the first `fetch` when build-time instrumentation is on (module scope fails to boot).
- **F42 (Fresh)** — omits the esbuild `require`-banner shim, without which the first query
  dies with `Dynamic require of "diagnostics_channel" is not supported`.
- **F45 (Nuxt)** — omits `nitro.alias: { 'readable-stream': 'node:stream' }` and
  `nitro.cloudflare: { nodeCompat: true, deployConfig: false }`; the db-spans claim ("no extra
  configuration") is true only of Sentry configuration.
- **F49 (TanStack Start)** — the wiring it describes is only half on the page it calls correct.

Partial: **F43 (NestJS)** omits the esbuild banner/alias set; **F51 (SolidStart)** omits the
hand-written `wrangler.jsonc` (Nitro emits none for `cloudflare-module`).

## DOC-F50 specifics

- `MIGRATION.md` on `develop` (`:1350-1362`, already published at
  `docs/.../migration/v10-to-v11/index.mdx:1287-1297`): `sentryRemixVitePlugin` moved to
  `@sentry/remix/vite` and **now applies the build-time instrumentation transform**; opt out
  with `sentryRemixVitePlugin({ buildTimeInstrumentation: false })`.
- The cell did **not** use it. `cells/M-remix-cf/vite.config.ts` is
  `plugins: [remix({…}), ...sentryCloudflareVitePlugin({ autoInstrumentation: false })]` from
  `@sentry/cloudflare/vite`. `sentryRemixVitePlugin` appears in this repo only in the Bun and
  Deno Remix cells, and there from the old bare `@sentry/remix` specifier.
- So the draft's "database spans need `sentryCloudflareVitePlugin()`" is **supported by the
  runs** (the cell plus `verify4-M-remix-cf-dbspans`, which reran it bare and across three
  `noExternal` variants) but is **not the only path on the v11 line and probably not the
  intended one**: `packages/remix/src/vite/index.ts` composes the route-manifest plugin with
  `makeOrchestrionPlugin`, and `packages/remix/src/vite/types.ts:12-21` documents
  `buildTimeInstrumentation` with `@default true`. That path is **untested on Cloudflare**.
  The item should test it or say plainly why it prescribes the Cloudflare plugin instead.

## Best-supported items

F44 (Next.js) and F47 (Astro) are the cleanest: every citation still resolves, the evidence
matches capability for capability, and the proposed changes follow directly from what ran.
