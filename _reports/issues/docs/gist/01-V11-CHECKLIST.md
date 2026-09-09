# v11 docs minimum: getting started and manual setup

The docs changes a new user hits on the way from install to the first event, on Node, Bun, Deno, Cloudflare Workers and in the browser, plus the framework pages that contradict a verified run. Every line links to its draft in [P0](#file-p0-md), [P1](#file-p1-md) or [P2](#file-p2-md). Tiers: **must** blocks or misleads the first setup on develop; **should** is wrong or incomplete for something most users do next; **later** is hygiene. Items owned by a Linear ticket are marked; they still belong in the release, only filed elsewhere.

## Every runtime guide

- [ ] **Must land with v11** · P0 · DOC-R1. The stream-mode includes call static the default: [Fix inverted traceLifecycle default in the stream mode includes](#12-fix-inverted-tracelifecycle-default-in-the-stream-mode-includes)
- [ ] **Must land with v11** · P1 · DOC-Q1. The verify step and the stream-mode includes describe the static lifecycle as the default: [Rewrite the tracing verify step for the stream lifecycle on the Node, Bun, Deno and Cloudflare guides](#88-rewrite-the-tracing-verify-step-for-the-stream-lifecycle-on-the-node-bun-deno-and-cloudflare-guides)
- [ ] **Must land with v11** · P1 · DOC-Q3. Nothing on the four guides says where a route name comes from: [State on the four guides that route names need a framework integration or a routes map](#90-state-on-the-four-guides-that-route-names-need-a-framework-integration-or-a-routes-map)
- [ ] **Should land with v11** · P2 · X1. "Tracing is enabled by default" on the first page of all three guides: [Fix "Tracing is enabled by default" in the Bun, Deno and Cloudflare enable-tracing includes](#112-fix-tracing-is-enabled-by-default-in-the-bun-deno-and-cloudflare-enable-tracing-includes)

## Migration to v11

- [ ] **Must land with v11** · P1 · X2 · owned by JS-2599. The v10-to-v11 page has no Bun plugin section and no Deno hook paragraph: [Add the per-runtime channel-instrumentation setup to the v10-to-v11 page](#35-add-the-per-runtime-channel-instrumentation-setup-to-the-v10-to-v11-page)
- [ ] **Must land with v11** · P0 · DOC-R20 · owned by SDK-1351. The Bun OpenTelemetry setup includes import a package and exports that no longer exist: [Delete the Bun OpenTelemetry setup includes and drop Bun from custom-setup](#14-delete-the-bun-opentelemetry-setup-includes-and-drop-bun-from-custom-setup)
- [ ] **After the release** · P2 · DOC-R8. V7 migration tables name removed integrations: [Fix removed integration names in the Bun and Deno v7 migration tables](#115-fix-removed-integration-names-in-the-bun-and-deno-v7-migration-tables)

## Browser

- [ ] **Must land with v11** · P0 · DOC-Q7. The tracing verify snippet is a SyntaxError: await in a non-async function: [Fix the tracing verify snippet on the browser getting-started page: await inside a non-async function](#1-fix-the-tracing-verify-snippet-on-the-browser-getting-started-page-await-inside-a-non-async-function)
- [ ] **Should land with v11** · P1 · DOC-Q8. The CDN tab names the tracing bundle and adds replayIntegration(), which records nothing: [Match the CDN bundle named on the browser config page to the integrations its snippet uses](#91-match-the-cdn-bundle-named-on-the-browser-config-page-to-the-integrations-its-snippet-uses)
- [ ] **Should land with v11** · P1 · DOC-Q9. Sentry.logger is a silent no-op on the CDN bundles and no page says which bundle has logs: [State on the logs pages which browser CDN bundles include Sentry.logger](#92-state-on-the-logs-pages-which-browser-cdn-bundles-include-sentrylogger)
- [ ] **After the release** · P2 · DOC-Q10. The sample tracePropagationTargets drops headers on 127.0.0.1: [Say on the browser config page that the sample tracePropagationTargets matches localhost only](#122-say-on-the-browser-config-page-that-the-sample-tracepropagationtargets-matches-localhost-only)
- [ ] **After the release** · P2 · DOC-Q11. The verify-flow replay is discarded within the first five seconds: [Tell browser readers to wait before triggering the verify error if they expect a replay](#123-tell-browser-readers-to-wait-before-triggering-the-verify-error-if-they-expect-a-replay)

## React

- [ ] **Must land with v11** · P0 · DOC-Q12. Three React Router v6 and v7 snippets do not run on React 19: [Fix the React Router v6 and v7 page snippets that fail on React 19](#2-fix-the-react-router-v6-and-v7-page-snippets-that-fail-on-react-19)
- [ ] **Should land with v11** · P1 · DOC-Q13. On React 19 the root error hooks silence the ErrorBoundary features: [Say on the React error boundary page how reactErrorHandler and ErrorBoundary interact on React 19](#93-say-on-the-react-error-boundary-page-how-reacterrorhandler-and-errorboundary-interact-on-react-19)
- [ ] **Should land with v11** · P1 · DOC-Q14. The denylist claim does not cover Redux or Pinia state: [Scope the built-in denylist claim on the data-collection include to request data](#94-scope-the-built-in-denylist-claim-on-the-data-collection-include-to-request-data)
- [ ] **Should land with v11** · P1 · DOC-Q15. The Profiler span ops are named wrong: [Rename the Profiler span ops on the React component monitoring page](#95-rename-the-profiler-span-ops-on-the-react-component-monitoring-page)
- [ ] **After the release** · P2 · DOC-Q16. The routing snippet uses the deprecated V7 API: [Move the React guide routing snippet to the version-agnostic React Router API](#124-move-the-react-guide-routing-snippet-to-the-version-agnostic-react-router-api)
- [ ] **After the release** · P2 · DOC-Q17. The verify step says transactions and its test span ends before the error: [Rewrite the React verify step for the stream lifecycle and fix the test span](#125-rewrite-the-react-verify-step-for-the-stream-lifecycle-and-fix-the-test-span)
- [ ] **After the release** · P2 · DOC-Q18. Sessions need a release, on the Vue, Angular and Svelte guides too: [Say on the React, Vue, Angular and Svelte guides that release health sessions need a release](#126-say-on-the-react-vue-angular-and-svelte-guides-that-release-health-sessions-need-a-release)

## Angular

- [ ] **Must land with v11** · P0 · DOC-Q32. Three snippets do not compile under the tsconfig ng new generates: [Fix the Angular manual-setup, error handler and component tracking snippets that fail to build](#7-fix-the-angular-manual-setup-error-handler-and-component-tracking-snippets-that-fail-to-build)
- [ ] **Should land with v11** · P1 · DOC-Q33. No working registration for a subclassed SentryErrorHandler: [Show a working provider for a subclassed SentryErrorHandler on the Angular error handler page](#99-show-a-working-provider-for-a-subclassed-sentryerrorhandler-on-the-angular-error-handler-page)
- [ ] **Should land with v11** · P1 · DOC-Q34. The component tracking span ops are named wrong: [Rename the component tracking span ops on the Angular page](#100-rename-the-component-tracking-span-ops-on-the-angular-page)
- [ ] **After the release** · P2 · DOC-Q35. Transactions wording and a 0 ms verify span: [Rewrite the Angular manual-setup verify and tracing text for the stream lifecycle](#133-rewrite-the-angular-manual-setup-verify-and-tracing-text-for-the-stream-lifecycle)
- [ ] **After the release** · P2 · DOC-Q36. Deprecated bootstrap call, missing logs option, stray line: [Fix the Angular pages' deprecated bootstrap call, the missing logs onboarding option and the stray export](#134-fix-the-angular-pages-deprecated-bootstrap-call-the-missing-logs-onboarding-option-and-the-stray-export)

## Svelte

- [ ] **Must land with v11** · P0 · DOC-Q41. The Svelte v5 verify snippet binds onClick, which compiles to nothing: [Change onClick to onclick in the Svelte v5 tab of the tracing verify snippet](#9-change-onclick-to-onclick-in-the-svelte-v5-tab-of-the-tracing-verify-snippet)
- [ ] **Should land with v11** · P1 · DOC-Q42. Old span ops, the wrong trackUpdates default and no runes caveat on the component tracking page: [Correct the Svelte component tracking page: span ops, the trackUpdates default and the runes-mode limit](#103-correct-the-svelte-component-tracking-page-span-ops-the-trackupdates-default-and-the-runes-mode-limit)
- [ ] **After the release** · P2 · DOC-Q43. Transactions wording, a 0 ms test span and a placeholder that is a syntax error: [Rewrite the Svelte verify and tracing text for the stream lifecycle and fix the compilerOptions placeholder](#136-rewrite-the-svelte-verify-and-tracing-text-for-the-stream-lifecycle-and-fix-the-compileroptions-placeholder)

## Vue

- [ ] **Must land with v11** · P0 · DOC-Q19. The Vue Router page's only full example is Vue 2 code that fails on Vue 3: [Add a Vue 3 example to the Vue Router instrumentation page](#3-add-a-vue-3-example-to-the-vue-router-instrumentation-page)
- [ ] **Must land with v11** · P0 · DOC-Q20. The tracingOptions.hooks snippet is a syntax error: [Add the missing comma to the tracingOptions.hooks snippet on the Vue component tracking page](#4-add-the-missing-comma-to-the-tracingoptionshooks-snippet-on-the-vue-component-tracking-page)
- [ ] **Should land with v11** · P1 · DOC-Q21. Wrong default hooks, wrong span ops and a duplicate-key snippet on the component tracking page: [Correct the Vue component tracking page: default hooks, span ops and the duplicate-key snippet](#96-correct-the-vue-component-tracking-page-default-hooks-span-ops-and-the-duplicate-key-snippet)
- [ ] **After the release** · P2 · DOC-Q22. The pages say transactions: [Rewrite the Vue guide and its feature pages for the stream lifecycle](#127-rewrite-the-vue-guide-and-its-feature-pages-for-the-stream-lifecycle)
- [ ] **After the release** · P2 · DOC-Q23. The late-init and multiple-apps snippets miss their imports: [Fix the late-initialization and multiple-apps snippets on the Vue pages](#128-fix-the-late-initialization-and-multiple-apps-snippets-on-the-vue-pages)
- [ ] **After the release** · P2 · DOC-Q24. The dev build reports the verify error without component context: [Say on the Vue guide that the component context of the verify error appears in production builds](#129-say-on-the-vue-guide-that-the-component-context-of-the-verify-error-appears-in-production-builds)

## Node, Express, Fastify and Koa

- [ ] **Should land with v11** · P2 · DOC-Q5. --require banner, and a first-line ESM import equals --import: [Update the Node getting-started page for --require and for first-line ESM imports](#120-update-the-node-getting-started-page-for---require-and-for-first-line-esm-imports)
- [ ] **Must land with v11** · P0 · DOC-Q25. The Express, Fastify and Koa ESM tabs import the instrument file without its extension: [Fix the extensionless instrument import on the Express, Fastify and Koa guides and the esm-without-import page](#5-fix-the-extensionless-instrument-import-on-the-express-fastify-and-koa-guides-and-the-esm-without-import-page)
- [ ] **Must land with v11** · P0 · DOC-Q26. The late-initialization page rests on the removed @sentry/node/preload entry: [Rewrite or remove the late-initialization install page for v11](#6-rewrite-or-remove-the-late-initialization-install-page-for-v11)
- [ ] **Should land with v11** · P1 · DOC-Q27. The Express async verify snippet hangs on Express 4: [State the Express major the async tracing verify snippet needs, or make it work on Express 4](#97-state-the-express-major-the-async-tracing-verify-snippet-needs-or-make-it-work-on-express-4)
- [ ] **Should land with v11** · P1 · DOC-Q28. The esm-without-import page says a first-line import cannot instrument frameworks; Express and Fastify are: [Correct the first-line import limitation on the esm-without-import page for v11](#98-correct-the-first-line-import-limitation-on-the-esm-without-import-page-for-v11)
- [ ] **After the release** · P2 · DOC-Q29. The Express, Fastify and Koa guides teach deprecated error handler calls: [Drop the deprecated setup*ErrorHandler calls from the Express, Fastify and Koa getting-started snippets](#130-drop-the-deprecated-setuperrorhandler-calls-from-the-express-fastify-and-koa-getting-started-snippets)
- [ ] **After the release** · P2 · DOC-Q30. No expressIntegration page: [Add an expressIntegration page to the integrations directory](#131-add-an-expressintegration-page-to-the-integrations-directory)
- [ ] **After the release** · P2 · DOC-Q31. Empty, orphaned and unreachable includes on the Express, Fastify and Koa guides: [Fix the empty capture-errors include and the orphaned includes on the Express guide](#132-fix-the-empty-capture-errors-include-and-the-orphaned-includes-on-the-express-guide)
- [ ] **Must land with v11** · P0 · DOC-Q37. The Fastify error handler page imports from a package that does not exist: [Fix the Fastify error handler page: @sentry/fastify does not exist and fastify() is never imported](#8-fix-the-fastify-error-handler-page-sentryfastify-does-not-exist-and-fastify-is-never-imported)
- [ ] **Should land with v11** · P1 · DOC-Q38. The Fastify error handler options object is silently ignored: [Move shouldHandleError to fastifyIntegration on the Fastify error handler page](#101-move-shouldhandleerror-to-fastifyintegration-on-the-fastify-error-handler-page)
- [ ] **Should land with v11** · P1 · DOC-Q39. The Fastify supported versions exclude 5: [Correct the supported Fastify versions on the integration page](#102-correct-the-supported-fastify-versions-on-the-integration-page)
- [ ] **After the release** · P2 · DOC-Q40. The Fastify integration page names the wrong mechanism and no behaviour: [Rewrite the Fastify integration page around the diagnostics-channel instrumentation and its options](#135-rewrite-the-fastify-integration-page-around-the-diagnostics-channel-instrumentation-and-its-options)
- [ ] **Must land with v11** · P0 · DOC-Q44. The Koa verify snippet uses a router the guide never creates: [Add the router to the Koa getting-started snippets that the verify step relies on](#10-add-the-router-to-the-koa-getting-started-snippets-that-the-verify-step-relies-on)
- [ ] **Should land with v11** · P1 · DOC-Q45. With a direct import Koa still needs setupKoaErrorHandler, the migration page says otherwise: [Qualify the Koa error handler claims on the migration and esm-without-import pages](#104-qualify-the-koa-error-handler-claims-on-the-migration-and-esm-without-import-pages)
- [ ] **Should land with v11** · P1 · DOC-Q46. The Koa integration page names the wrong mechanism, enablement rule and version range: [Rewrite the Koa integration page around the diagnostics-channel instrumentation](#105-rewrite-the-koa-integration-page-around-the-diagnostics-channel-instrumentation)

## Bun

- [ ] **Must land with v11** · P0 · DOC-B1. The instrumentation step is backwards and never names the plugin: [Rewrite the Bun guide's instrumentation step around @sentry/bun/plugin](#11-rewrite-the-bun-guides-instrumentation-step-around-sentrybunplugin)
- [ ] **Should land with v11** · P1 · DOC-B2. The integrations table does not match what the SDK installs: [Correct the Bun integrations table in platform-includes/.../javascript.bun.mdx](#24-correct-the-bun-integrations-table-in-platform-includesjavascriptbunmdx)
- [ ] **Should land with v11** · P2 · DOC-Q4. Two warnings on the documented path that no page explains: [Explain the channel-injection warnings on the Bun guide](#119-explain-the-channel-injection-warnings-on-the-bun-guide)
- [ ] **Should land with v11** · P2 · DOC-B4. No Bun version floor, npm install in the Hono tab, no breadcrumbs page: [Fix Bun guide hygiene: version floor, Hono install command, v7 wording](#106-fix-bun-guide-hygiene-version-floor-hono-install-command-v7-wording)

## Deno

- [ ] **Must land with v11** · P1 · DOC-D1. No instrumentation step; the import hook is undocumented: [Document the @sentry/deno/import hook in the Deno guide](#26-document-the-sentrydenoimport-hook-in-the-deno-guide)
- [ ] **Must land with v11** · P1 · DOC-D3. The documented permission flags crash the app under the hook, and silently degrade without it: [Show one complete deno run command with all four permission flags in the Deno guide](#28-show-one-complete-deno-run-command-with-all-four-permission-flags-in-the-deno-guide)
- [ ] **Must land with v11** · P0 · DOC-R2. The crons page recommends an integration that crashes init on Deno 2.9: [Stop recommending denoCronIntegration() on the Deno crons page](#13-stop-recommending-denocronintegration-on-the-deno-crons-page)
- [ ] **Should land with v11** · P1 · DOC-D2. The integrations table lists 8 of 39: [Correct the Deno integrations table in platform-includes/.../javascript.deno.mdx](#27-correct-the-deno-integrations-table-in-platform-includesjavascriptdenomdx)
- [ ] **Should land with v11** · P2 · DOC-D6. Install shows only the npm: specifier; deno add and the import map are missing: [Show deno add and an import map in the Deno guide's install step](#108-show-deno-add-and-an-import-map-in-the-deno-guides-install-step)
- [ ] **After the release** · P2 · DOC-R17. Deno serve is never mentioned: [Add deno serve to the Deno guide run commands](#117-add-deno-serve-to-the-deno-guide-run-commands)

## Cloudflare Workers

- [ ] **Should land with v11** · P1 · DOC-Q2. A wrangler config resolved to the wrong file instruments nothing and logs nothing: [Say on the Vite plugin page that a wrangler config resolved to the wrong file instruments nothing](#89-say-on-the-vite-plugin-page-that-a-wrangler-config-resolved-to-the-wrong-file-instruments-nothing)
- [ ] **Must land with v11** · P1 · DOC-C1 · v11-gated, under SDK-1296. The nodejs_compat entrypoint the guide documents is gone on develop: [Remove the @sentry/cloudflare/nodejs_compat entrypoint from the Cloudflare docs for v11](#30-remove-the-sentrycloudflarenodejs_compat-entrypoint-from-the-cloudflare-docs-for-v11)
- [ ] **Must land with v11** · P1 · DOC-C5 · v11-gated, under SDK-1296. WrapRequestHandler is imported from an entry that no longer exports it: [Import wrapRequestHandler from @sentry/cloudflare/request and drop the honoIntegration page](#33-import-wraprequesthandler-from-sentrycloudflarerequest-and-drop-the-honointegration-page)
- [ ] **Must land with v11** · P1 · DOC-C4 · v11-gated, under SDK-1296. The Vite plugin page documents options that no longer exist and calls the plugin a no-op: [Update features/vite-plugin.mdx to the shipped Cloudflare Vite plugin options](#32-update-featuresvite-pluginmdx-to-the-shipped-cloudflare-vite-plugin-options)
- [ ] **Should land with v11** · P1 · DOC-R14. Errors inside ctx.waitUntil() are never captured; the page covers spans only: [Document that errors inside ctx.waitUntil() are not captured](#85-document-that-errors-inside-ctxwaituntil-are-not-captured)
- [ ] **Should land with v11** · P2 · DOC-C8. Bare Sentry.init snippets, a browser integration, two compatibility dates without a rule: [Fix snippet errors across the Cloudflare includes and framework pages](#111-fix-snippet-errors-across-the-cloudflare-includes-and-framework-pages)
- [ ] **Should land with v11** · P2 · DOC-Q6. Wrangler dev stack traces have no context lines until source maps are uploaded: [Say on the Cloudflare guide that readable stack traces need the source maps step](#121-say-on-the-cloudflare-guide-that-readable-stack-traces-need-the-source-maps-step)
- [ ] **Should land with v11** · P2 · DOC-C3 · v11-gated, under SDK-1296. EnableRpcTracePropagation is replaced; five options have no entry: [Add the four missing Cloudflare SdkOption entries and drop the deprecated enableRpcTracePropagation block](#109-add-the-four-missing-cloudflare-sdkoption-entries-and-drop-the-deprecated-enablerpctracepropagation-block)

## Frameworks whose page contradicts a verified run

- [ ] **Must land with v11** · P0 · DOC-F50. Remix on Workers: the documented import captures nothing: [Rewrite the Remix on Cloudflare page for Workers and fix the Vite plugin options](#16-rewrite-the-remix-on-cloudflare-page-for-workers-and-fix-the-vite-plugin-options)
- [ ] **Must land with v11** · P0 · DOC-F36. Elysia on Workers: runtime list says Bun or Node only: [Add an Elysia on Cloudflare Workers page and drop the Bun/Node-only runtime claim](#17-add-an-elysia-on-cloudflare-workers-page-and-drop-the-bunnode-only-runtime-claim)
- [ ] **Must land with v11** · P0 · DOC-F19. Elysia on Deno: the documented init loses isolation and route names: [Document Elysia on Deno: init from @sentry/deno, or add denoServeIntegration](#18-document-elysia-on-deno-init-from-sentrydeno-or-add-denoserveintegration)
- [ ] **Must land with v11** · P0 · DOC-F11. Nuxt on Bun: presets page says out of the box: [Add a Bun section to the Nuxt Nitro deployment presets page](#19-add-a-bun-section-to-the-nuxt-nitro-deployment-presets-page)
- [ ] **Must land with v11** · P0 · DOC-F28. Nuxt on Deno: the deno_server preset has no request instrumentation: [Correct the Nuxt Nitro preset page for Deno: keep the node-server preset](#20-correct-the-nuxt-nitro-preset-page-for-deno-keep-the-node-server-preset)
- [ ] **Must land with v11** · P0 · DOC-F13. Astro on Bun: the runtime alert says not supported: [Name Bun in the Astro runtime alert and add a Running on Bun section](#21-name-bun-in-the-astro-runtime-alert-and-add-a-running-on-bun-section)
- [ ] **Must land with v11** · P0 · DOC-F30. Astro on Deno: the runtime alert says not supported: [Correct the Astro runtime note: Deno with @deno/astro-adapter works](#22-correct-the-astro-runtime-note-deno-with-denoastro-adapter-works)
- [ ] **Must land with v11** · P0 · DOC-F29. SvelteKit on Deno: the adapter note says not supported: [Correct the SvelteKit adapter note: adapter-node runs on Deno](#23-correct-the-sveltekit-adapter-note-adapter-node-runs-on-deno)

## Frameworks whose page misses the wiring or the limits

- [ ] **Should land with v11** · P1 · DOC-F1. Hono on Bun: [Document Hono on Bun: unbundled run and the Bun.build plugin variant](#37-document-hono-on-bun-unbundled-run-and-the-bunbuild-plugin-variant)
- [ ] **Should land with v11** · P1 · DOC-F2. Elysia on Bun: [Add a Bun database instrumentation section to the Elysia guide and fix four include statements](#38-add-a-bun-database-instrumentation-section-to-the-elysia-guide-and-fix-four-include-statements)
- [ ] **Should land with v11** · P1 · DOC-F18. Hono on Deno: [Document the verified Hono on Deno setup and its outgoing fetch limit](#52-document-the-verified-hono-on-deno-setup-and-its-outgoing-fetch-limit)
- [ ] **Should land with v11** · P1 · DOC-F35. Hono on Workers: [Document Hono on Cloudflare Workers: compatibility_date and build-time database spans](#65-document-hono-on-cloudflare-workers-compatibility_date-and-build-time-database-spans)
- [ ] **Should land with v11** · P1 · DOC-F44. Next.js on Workers: [Document outgoing fetch and database spans for Next.js on Cloudflare Workers](#73-document-outgoing-fetch-and-database-spans-for-nextjs-on-cloudflare-workers)
- [ ] **Should land with v11** · P1 · DOC-F45. Nuxt on Workers: [Document server route naming for Nuxt on Cloudflare Workers](#74-document-server-route-naming-for-nuxt-on-cloudflare-workers)
- [ ] **Should land with v11** · P1 · DOC-F46. SvelteKit on Workers: [Document route naming and database-span setup for SvelteKit on Cloudflare Workers](#75-document-route-naming-and-database-span-setup-for-sveltekit-on-cloudflare-workers)
- [ ] **Should land with v11** · P1 · DOC-F49. TanStack Start on Workers: no Configure Vite step: [Add a "Configure Vite" step to the TanStack Start on Cloudflare page](#77-add-a-configure-vite-step-to-the-tanstack-start-on-cloudflare-page)

## Not in this list

The 34 framework pages that do not exist yet (DOC-F3 to DOC-F10, DOC-F12, DOC-F14 to DOC-F17, DOC-F20 to DOC-F27, DOC-F31 to DOC-F34, DOC-F37 to DOC-F43, DOC-F48, DOC-F51), the generated integrations tables and the runtime matrix (X3, DOC-R6), the feature pages (D1, bindings, Durable Objects, Workflows, Agents SDK), and the remaining completeness items. They improve coverage after the release and do not block a first setup.

Counts: 30 must, 35 should, 17 later.
