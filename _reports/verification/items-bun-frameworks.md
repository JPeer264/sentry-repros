# Verification: the 17 "framework on Bun" docs items (DOC-F1..F17)

Checked 2026-09-08, read-only. Docs read at `~/dev/sentry-docs` master `aebda0ee4`; the audit cited
`046ce5942` (not an ancestor of today's master) and `b568ebbd3`. SDK read at `~/dev/sentry-javascript`
develop. Per-item detail in `items-bun-frameworks.json`.

**Verdict: every item is worth filing, none is fixed on master, and 14 of 17 need edits before they are.**
Three are clean (DOC-F3 Express, DOC-F5 Koa, DOC-F8 Fresh). The rest carry at least one sentence the
evidence does not support, and eleven describe a setup that differs from the app files that produced it.

## Docs side

No cited page has been fixed. Every quote and every absence claim still holds:

- `sentryBunPlugin`, `@sentry/bun/plugin` and `Bun.build` still have **0 hits** across `docs/` and
  `platform-includes/`. Oak has 0 hits. The Fresh framework has 0 hits (the three "fresh" matches are
  the English word). `guides/bun/` still contains one guide page plus one integration page and names
  no framework.
- Per-guide greps re-run and still 0: bun in express/, fastify/, koa/, hapi/, nestjs/, nextjs/, nuxt/,
  sveltekit/, astro/, react-router/, tanstackstart-react/, remix/, solidstart/; and the framework name
  in `guides/bun/`.
- The Bun guide's "Bundled Code Limitation" alert is unchanged in wording.

What did change is **line numbers**, because two commits (`ae4b46502`, `4baeabd4f`) landed after the
audit pin. The recurring ones:

| cited | today |
| --- | --- |
| `bun/index.mdx:96-98` (alert) | `:90-92`, block `:90-94` |
| `bun/index.mdx:106` (`bun --preload`) | `:100` (file is 212 lines, not 214) |
| `hono/index.mdx:290-317` (Bun snippet) | `:278-300` |
| `nextjs/index.mdx:144-147` (`register()`) | block `:122-134` |
| `nuxt/index.mdx:68` (start command) | `:72` |
| `react-router/manual-setup.mdx:413-414` / `:449` | `:400-401` / `:436` |
| `tanstackstart-react/manual-setup/index.mdx:372` / `:391` | `:358` / `:377` |
| `solidstart/index.mdx:289` / `:309-310` | `:277` / `:297-298` (two scripts) |

Unchanged and exact: elysia `:4-5/:23-25/:47-50/:56`, express/fastify/koa/hapi frontmatter and includes,
`getting-started-node/javascript.mdx:88,95`, `getting-started-use/javascript.hapi.mdx:17,42`, the
SvelteKit adapter box `:36-48`, the Astro alert (`:21-29`, cited as `:21-28`), `bunserver.mdx:18`,
`transaction-name/index.mdx:90-103`, `solidstart/install/cli-import.mdx:33,45`,
`nitro-deployment-presets.mdx:7,9-11`, remix `index.mdx:12-16`.

Two citations are imprecise rather than moved: `nestjs/index.mdx:75` is the `main.ts` "import this first"
snippet, not the init snippet (the init is the `getting-started-config` include at `:57`), and
`remix/manual-setup.mdx:64` is the profiling install (the plain one is `:49`).

Docs pages the drafts should have cited and did not:

- `common/configuration/integrations/{fastify,koa,hapi,nest,mysql,mysql2}.mdx` all say "This integration
  only works in the Node.js and Bun runtimes", and 81 pages list `javascript.express` and `javascript.bun`
  together in `supported:`. So "no page mentions Express and Bun together" is only true of *guide* pages.
- `common/migration/v10-to-v11/index.mdx:713-721` already says the `setupExpressErrorHandler` /
  `setupKoaErrorHandler` / `setupHapiErrorHandler` calls are no longer needed — that is a v11 change, not a
  Bun finding, and DOC-F3/F5/F6 present it as one.
- The same guide documents the Vite-plugin and config subpath moves the drafts silently rely on:
  `@sentry/sveltekit/vite` (`:1245-1252`), `@sentry/react-router/vite` (`:1263`), `@sentry/remix/vite`
  (`:1287`), `@sentry/nextjs/config` (`:1022`) — while the guides themselves still show the old imports.
- `react-router/manual-setup.mdx:273` already documents `export const instrumentations =
  [Sentry.createSentryServerInstrumentation()]`, which is the missing piece of DOC-F14.
- `tanstackstart-react/manual-setup/index.mdx:220-241` documents the `sentryTanstackStart()` Vite plugin
  that DOC-F15 omits.
- `guides/nuxt/install/limited-server-tracing.mdx` and `guides/solidstart/install/limited-server-tracing.mdx`
  already document `autoInjectServerSentry: 'top-level-import'` and warn it instruments only native Node APIs.
- `platform-includes/performance/enable-stream-mode/javascript.elysia.mdx:25` inverts the `traceLifecycle`
  default the same way DOC-R1 fixes elsewhere — but DOC-R1 lists only the bun, deno and cloudflare includes.

## Evidence side

The dominant defect is one shared Bun bug reported five different ways. Bun's `node:diagnostics_channel`
registry drops a channel's subscribers once the channel object is collected, so the subscriptions
`Sentry.init()` makes are gone a tick later. Recorded refutations show a strong reference on `globalThis`
(or importing the driver in the init file) restores database spans:
`verify4-M-astro-bun-dbspans`, `-nextjs-`, `-sveltekit-`, `-tanstack-`, `-solidstart-`, `-nuxt-`, `-remix-`,
`-reactrouter-` and `-fastify-` are all **works-after-all**. Five drafts (F10, F12, F13, F15, and F17 in a
different phrasing) nevertheless state "database spans are not recorded on Bun" as a flat limit. For F12,
F13 and F15 the audit page's own finding paragraph still carries the fix — the drafts are a regression
from the audit, not from the evidence.

Other claims the evidence contradicts:

- **DOC-F10** — the `app`-directory rule does not degrade names to source `url`; source stays `route` and
  the symptom is a `/app` prefix plus an event/transaction name mismatch, from a Next.js path bug that
  reproduces on Node. `bunHttpServerIntegration({ spans: false })` was never run in this evidence base.
- **DOC-F14** — "the server SDK is inert on Bun" is wrong: the documented `instrumentations` export alone
  produces route-named `http.server` spans on Bun. The integrations must be runtime-gated (unguarded
  `fetchIntegration()` double-spans on Node).
- **DOC-F15** — isolation, incoming trace and outgoing fetch are recorded **broken**, and the three
  refutation directories the draft leans on have no recorded result at all.
- **DOC-F17** — the enabling change for db spans is the channel pin, not "the driver loaded at startup",
  and `mysql` v2 (an injected driver) did produce spans with the pin.
- **DOC-F7** — under the static lifecycle a fetch-only Oak mount is named by raw pathname, not bare `GET`;
  and `app.listen()` does emit server spans, it just loses errors, db spans, isolation and log correlation.
- **DOC-F6** — an unbundled Hapi app plus `setupHapiErrorHandler` does capture the handler error.
- **DOC-F1** — `external: ['@sentry/*', 'hono']` behaves exactly like the unbundled run; `external:
  ['@sentry/*']` alone takes the app down with 500s (probe X01).
- **DOC-F9** — "URL-sourced names" is the static-lifecycle result; under the `stream` default the name
  collapses to `http.server GET`.

Unrecorded evidence is a systemic risk: `verify4-M-{astro,nuxt}-bun-outgoingfetch`,
`verify4-M-reactrouter-bun-dbspans-v2`, `verify4-M-remix-bun-{isolation,incomingtrace,outgoingfetch}` and
`verify4-M-tanstack-bun-{isolation,incomingtrace,outgoingfetch,routenames}` have directories but no entry
in `_records/refutations.json`. DOC-F15 and parts of DOC-F11 and DOC-F16 rest on them.

## Wiring side

Eleven items describe a setup that differs from the files that produced the result. The repeating gaps:

- **Incomplete `Bun.build` calls.** DOC-F2 and DOC-F4 drop `entrypoints`, `outdir`, `sourcemap` and (F4)
  `external`, so the snippet cannot be run as written; F2's entry is `app2.ts`/`dist/app2.js`.
- **Missing plugin subpaths.** `@sentry/sveltekit/vite` (F12 — the bare import throws), `@sentry/remix/vite`
  (F16), `@sentry/solidstart/vite` (F17), `@sentry/tanstackstart-react/vite` (F15, plugin omitted entirely).
- **Missing required wiring.** `sentryHandle()` and the `experimental` kit options (F12),
  `vite.ssr.noExternal: ['mysql2']` (F13), the `instrumentations` export (F14), `src/start.ts` middlewares
  and `sentryTanstackStart()` (F15), `nitro({ serverDir: './server' })` and `@sentry/nitro` (F17).
- **Commands that were never run.** `bun --bun next build/start` (the runs used
  `./node_modules/.bin/next`), `bun .output/server/index.mjs` for Nuxt (every run used `bun run ...`), and
  no run command at all in F7 and F8.
- **Install lines that do not reproduce the run.** Every cell installed a set of develop tarballs with npm
  ("`bun add` cannot resolve the transitive `@sentry/*@10.67.0`"); `@sentry/bun` is absent from the
  package.json of the astro, sveltekit, nextjs, reactrouter and tanstack cells and appears only in their
  refutation apps; F4's install line yields no `mysql2`, on which its headline bullet depends.
- **Versions.** F1 says Hono 4.10.x where the cell pins ^4.13.7; F4's mysql2 result comes from Fastify
  5.12.3; every cell rerun ran Bun 1.4.2, not the recorded 1.4.0; 10.67.0 throughout is the unreleased
  develop/v11 line.

## DOC-F11 and the Nuxt breaking change

`ec50b3e8f1` — *feat(nuxt)!: Bundle server config into Nitro build (#24094)* — **does affect DOC-F11's
wiring**. The server config is now bundled into the Nitro build and imported by a generated Nitro plugin,
so `Sentry.init` runs at startup with no `node --import` and no inject mode, on Nitro 2 and 3; both
`autoInjectServerSentry` modes are deprecated (`packages/nuxt/src/common/types.ts:60-64`, warning at
`packages/nuxt/src/module.ts:213`) and kept working until v12; the old
`.output/server/sentry.server.config.mjs` path now gets a shim that prints "remove this flag".

So: drop `autoInjectServerSentry: 'top-level-import'` from the Bun section — its whole rationale (Bun
ignores `NODE_OPTIONS` and has no `--import`) is now the default behaviour. The `sentry.server.config.ts`
*source* file stays and is still where the integrations go. The two `@sentry/bun` integrations are
unaffected: the root cause they fix (Bun never publishes `http.server.request.start`) is unchanged. The
same commit also obsoletes the Node start command at `nuxt/index.mdx:72` that DOC-F11 proposes to sit
next to.

## Two audit-page paragraphs to fix

For **DOC-F3** and **DOC-F5** the audit page's own "Page:" paragraph says the capabilities work "with no
`Bun.build` step" and that only the mysql span needs the bundle. The cell records say the opposite (without
the bundle: URL-sourced names, no child spans, no error capture), and both item bodies agree with the cells.
The HTML paragraphs are stale and must be corrected with the items.
