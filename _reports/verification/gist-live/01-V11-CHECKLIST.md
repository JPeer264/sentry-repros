# v11 docs minimum: getting started and manual setup

The docs changes a new user hits on the way from install to the first event, on Node, Bun, Deno and Cloudflare Workers, plus the framework pages that contradict a verified run. Every line links to its draft in [P0](#file-p0-md), [P1](#file-p1-md) or [P2](#file-p2-md). Tiers: **must** blocks or misleads the first setup on develop; **should** is wrong or incomplete for something most users do next; **later** is hygiene. Items owned by a Linear ticket are marked; they still belong in the release, only filed elsewhere.

## Every runtime guide

- [ ] **Must land with v11** · P0 · DOC-R1. The stream-mode includes call static the default: [Fix inverted traceLifecycle default in the stream mode includes](#2-fix-inverted-tracelifecycle-default-in-the-stream-mode-includes)
- [ ] **Must land with v11** · P1 · DOC-Q1. The verify step promises a transaction that develop never sends: [Rewrite the tracing verify step for the stream lifecycle on the Node, Bun, Deno and Cloudflare guides](#79-rewrite-the-tracing-verify-step-for-the-stream-lifecycle-on-the-node-bun-deno-and-cloudflare-guides)
- [ ] **Must land with v11** · P1 · DOC-Q3. Base-setup spans are named by method; the pages say named transactions: [State on the four guides that route names need a framework integration or a routes map](#80-state-on-the-four-guides-that-route-names-need-a-framework-integration-or-a-routes-map)
- [ ] **Should land with v11** · P2 · X1. "Tracing is enabled by default" on the first page of all three guides: [Fix "Tracing is enabled by default" in the Bun, Deno and Cloudflare enable-tracing includes](#86-fix-tracing-is-enabled-by-default-in-the-bun-deno-and-cloudflare-enable-tracing-includes)

## Migration to v11

- [ ] **Must land with v11** · P1 · X2 · owned by JS-2599. No v10-to-v11 page; the per-runtime instrumentation step is the missing content: [Add a v10-to-v11 migration page covering Bun, Deno and Cloudflare instrumentation setup](#27-add-a-v10-to-v11-migration-page-covering-bun-deno-and-cloudflare-instrumentation-setup)
- [ ] **Must land with v11** · P0 · DOC-R20 · owned by SDK-1351. The Bun OpenTelemetry setup includes import a package that no longer exists: [Rewrite the Bun OpenTelemetry setup includes against develop](#4-rewrite-the-bun-opentelemetry-setup-includes-against-develop)
- [ ] **After the release** · P2 · DOC-R8. V7 migration tables name removed integrations: [Fix removed integration names in the Bun and Deno v7 migration tables](#90-fix-removed-integration-names-in-the-bun-and-deno-v7-migration-tables)

## Node

- [ ] **Should land with v11** · P2 · DOC-Q5. --require banner, and a first-line ESM import equals --import: [Update the Node getting-started page for --require and for first-line ESM imports](#95-update-the-node-getting-started-page-for---require-and-for-first-line-esm-imports)

## Bun

- [ ] **Must land with v11** · P0 · DOC-B1. The instrumentation step is backwards and never names the plugin: [Rewrite the Bun guide's instrumentation step around @sentry/bun/plugin](#1-rewrite-the-bun-guides-instrumentation-step-around-sentrybunplugin)
- [ ] **Should land with v11** · P1 · DOC-B2. The integrations table does not match what the SDK installs: [Correct the Bun integrations table in platform-includes/.../javascript.bun.mdx](#15-correct-the-bun-integrations-table-in-platform-includesjavascriptbunmdx)
- [ ] **Should land with v11** · P2 · DOC-Q4. Two warnings on the documented path that no page explains: [Explain the channel-injection warnings on the Bun guide](#94-explain-the-channel-injection-warnings-on-the-bun-guide)
- [ ] **Should land with v11** · P2 · DOC-B4. No Bun version floor, npm install in the Hono tab, no breadcrumbs page: [Fix Bun guide hygiene: version floor, Hono install command, breadcrumbs, v7 wording](#81-fix-bun-guide-hygiene-version-floor-hono-install-command-breadcrumbs-v7-wording)

## Deno

- [ ] **Must land with v11** · P1 · DOC-D1. No instrumentation step; the import hook is undocumented: [Document the @sentry/deno/import hook in the Deno guide](#17-document-the-sentrydenoimport-hook-in-the-deno-guide)
- [ ] **Must land with v11** · P1 · DOC-D3. The documented permission flags crash the app under the hook, and silently degrade without it: [Show one complete deno run command with all four permission flags in the Deno guide](#19-show-one-complete-deno-run-command-with-all-four-permission-flags-in-the-deno-guide)
- [ ] **Must land with v11** · P0 · DOC-R2. The crons page recommends an integration that crashes init on Deno 2.9: [Stop recommending denoCronIntegration() on the Deno crons page](#3-stop-recommending-denocronintegration-on-the-deno-crons-page)
- [ ] **Should land with v11** · P1 · DOC-D2. The integrations table lists 8 of 39: [Correct the Deno integrations table in platform-includes/.../javascript.deno.mdx](#18-correct-the-deno-integrations-table-in-platform-includesjavascriptdenomdx)
- [ ] **Should land with v11** · P2 · DOC-D6. Install shows only the npm: specifier; deno add and the import map are missing: [Show deno add and an import map in the Deno guide's install step](#83-show-deno-add-and-an-import-map-in-the-deno-guides-install-step)
- [ ] **After the release** · P2 · DOC-R17. Deno serve is never mentioned: [Add deno serve to the Deno guide run commands](#92-add-deno-serve-to-the-deno-guide-run-commands)

## Cloudflare Workers

- [ ] **Must land with v11** · P0 · DOC-Q2. The Vite plugin options file is undocumented and the plugin is a silent no-op without wranglerConfigPath: [Document the instrument.server file and the wranglerConfigPath requirement on the Cloudflare Vite plugin page](#6-document-the-instrumentserver-file-and-the-wranglerconfigpath-requirement-on-the-cloudflare-vite-plugin-page)
- [ ] **Must land with v11** · P1 · DOC-C1 · v11-gated, under SDK-1296. The nodejs_compat entrypoint the guide documents is gone on develop: [Remove the @sentry/cloudflare/nodejs_compat entrypoint from the Cloudflare docs for v11](#21-remove-the-sentrycloudflarenodejs_compat-entrypoint-from-the-cloudflare-docs-for-v11)
- [ ] **Must land with v11** · P1 · DOC-C5 · v11-gated, under SDK-1296. WrapRequestHandler is imported from an entry that no longer exports it: [Import wrapRequestHandler from @sentry/cloudflare/request and drop the honoIntegration page](#25-import-wraprequesthandler-from-sentrycloudflarerequest-and-drop-the-honointegration-page)
- [ ] **Must land with v11** · P1 · DOC-C4 · v11-gated, under SDK-1296. The Vite plugin page documents options that no longer exist and calls the plugin a no-op: [Update features/vite-plugin.mdx to the shipped Cloudflare Vite plugin options](#24-update-featuresvite-pluginmdx-to-the-shipped-cloudflare-vite-plugin-options)
- [ ] **Should land with v11** · P1 · DOC-R14. Errors inside ctx.waitUntil() are never captured; the page covers spans only: [Document that errors inside ctx.waitUntil() are not captured](#76-document-that-errors-inside-ctxwaituntil-are-not-captured)
- [ ] **Should land with v11** · P2 · DOC-C8. Bare Sentry.init snippets, a browser integration, two compatibility dates without a rule: [Fix snippet errors across the Cloudflare includes and framework pages](#85-fix-snippet-errors-across-the-cloudflare-includes-and-framework-pages)
- [ ] **Should land with v11** · P2 · DOC-Q6. Wrangler dev stack traces have no context lines until source maps are uploaded: [Say on the Cloudflare guide that readable stack traces need the source maps step](#96-say-on-the-cloudflare-guide-that-readable-stack-traces-need-the-source-maps-step)
- [ ] **Should land with v11** · P1 · DOC-C3 · v11-gated, under SDK-1296. EnableRpcTracePropagation is replaced; five options have no entry: [Replace enableRpcTracePropagation in the Cloudflare docs and add five missing SdkOption entries](#23-replace-enablerpctracepropagation-in-the-cloudflare-docs-and-add-five-missing-sdkoption-entries)

## Frameworks whose page contradicts a verified run

- [ ] **Must land with v11** · P0 · DOC-F50. Remix on Workers: the documented import captures nothing: [Rewrite the Remix on Cloudflare page for Workers and fix the Vite plugin options](#7-rewrite-the-remix-on-cloudflare-page-for-workers-and-fix-the-vite-plugin-options)
- [ ] **Must land with v11** · P0 · DOC-F36. Elysia on Workers: runtime list says Bun or Node only: [Add an Elysia on Cloudflare Workers page and drop the Bun/Node-only runtime claim](#8-add-an-elysia-on-cloudflare-workers-page-and-drop-the-bunnode-only-runtime-claim)
- [ ] **Must land with v11** · P0 · DOC-F19. Elysia on Deno: the documented init loses isolation and route names: [Document Elysia on Deno: init from @sentry/deno, keep withElysia](#9-document-elysia-on-deno-init-from-sentrydeno-keep-withelysia)
- [ ] **Must land with v11** · P0 · DOC-F11. Nuxt on Bun: presets page says out of the box: [Add a Bun section to the Nuxt Nitro deployment presets page](#10-add-a-bun-section-to-the-nuxt-nitro-deployment-presets-page)
- [ ] **Must land with v11** · P0 · DOC-F28. Nuxt on Deno: the deno_server preset has no request instrumentation: [Correct the Nuxt Nitro preset page for Deno: keep the node-server preset](#11-correct-the-nuxt-nitro-preset-page-for-deno-keep-the-node-server-preset)
- [ ] **Must land with v11** · P0 · DOC-F13. Astro on Bun: the runtime alert says not supported: [Name Bun in the Astro runtime alert and add a Running on Bun section](#12-name-bun-in-the-astro-runtime-alert-and-add-a-running-on-bun-section)
- [ ] **Must land with v11** · P0 · DOC-F30. Astro on Deno: the runtime alert says not supported: [Correct the Astro runtime note: Deno with @deno/astro-adapter works](#13-correct-the-astro-runtime-note-deno-with-denoastro-adapter-works)
- [ ] **Must land with v11** · P0 · DOC-F29. SvelteKit on Deno: the adapter note says not supported: [Correct the SvelteKit adapter note: adapter-node runs on Deno](#14-correct-the-sveltekit-adapter-note-adapter-node-runs-on-deno)

## Frameworks whose page misses the wiring or the limits

- [ ] **Should land with v11** · P1 · DOC-F1. Hono on Bun: [Document Hono on Bun: unbundled run and the Bun.build plugin variant](#29-document-hono-on-bun-unbundled-run-and-the-bunbuild-plugin-variant)
- [ ] **Should land with v11** · P1 · DOC-F2. Elysia on Bun: [Add a Bun database instrumentation section to the Elysia guide](#30-add-a-bun-database-instrumentation-section-to-the-elysia-guide)
- [ ] **Should land with v11** · P1 · DOC-F18. Hono on Deno: [Document the verified Hono on Deno setup and its outgoing fetch limit](#44-document-the-verified-hono-on-deno-setup-and-its-outgoing-fetch-limit)
- [ ] **Should land with v11** · P1 · DOC-F35. Hono on Workers: [Document Hono on Cloudflare Workers: compatibility_date and build-time database spans](#57-document-hono-on-cloudflare-workers-compatibility_date-and-build-time-database-spans)
- [ ] **Should land with v11** · P1 · DOC-F44. Next.js on Workers: [Document outgoing fetch and database spans for Next.js on Cloudflare Workers](#65-document-outgoing-fetch-and-database-spans-for-nextjs-on-cloudflare-workers)
- [ ] **Should land with v11** · P1 · DOC-F45. Nuxt on Workers: [Document server route naming for Nuxt on Cloudflare Workers](#66-document-server-route-naming-for-nuxt-on-cloudflare-workers)
- [ ] **Should land with v11** · P1 · DOC-F46. SvelteKit on Workers: [Document route naming and database-span setup for SvelteKit on Cloudflare Workers](#67-document-route-naming-and-database-span-setup-for-sveltekit-on-cloudflare-workers)

## Not in this list

The 34 framework pages that do not exist yet (DOC-F3 to DOC-F17, DOC-F20 to DOC-F34, DOC-F37 to DOC-F43, DOC-F48, DOC-F51), the generated integrations tables and the runtime matrix (X3, DOC-R6), the feature pages (D1, bindings, Durable Objects, Workflows, Agents SDK), and the remaining completeness items. They improve coverage after the release and do not block a first setup.

Counts: 21 must, 18 should, 2 later.
