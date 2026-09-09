# Docs issue drafts, P0 to P2

172 drafts for `getsentry/sentry-docs`, one per finding of the runtime docs audit. P0 is in the suggested filing order; P1 and P2 follow the audit page. Each `.md` is an issue body, the title is in the table. `create.sh` files them with the GitHub CLI and was not run.

| # | Prio | Item | Type | Title | File |
| --- | --- | --- | --- | --- | --- |
| 1 | P0 | DOC-Q7 | docs-change | Fix the tracing verify snippet on the browser getting-started page: await inside a non-async function | `P0-01-DOC-Q7.md` |
| 2 | P0 | DOC-Q12 | docs-change | Fix the React Router v6 and v7 page snippets that fail on React 19 | `P0-02-DOC-Q12.md` |
| 3 | P0 | DOC-Q19 | docs-change | Add a Vue 3 example to the Vue Router instrumentation page | `P0-03-DOC-Q19.md` |
| 4 | P0 | DOC-Q20 | docs-change | Add the missing comma to the tracingOptions.hooks snippet on the Vue component tracking page | `P0-04-DOC-Q20.md` |
| 5 | P0 | DOC-Q25 | docs-change | Fix the extensionless instrument import on the Express, Fastify, Koa, Hapi and Connect guides and the esm-without-import page | `P0-05-DOC-Q25.md` |
| 6 | P0 | DOC-Q26 | docs-change | Rewrite or remove the late-initialization install page for v11 | `P0-06-DOC-Q26.md` |
| 7 | P0 | DOC-Q32 | docs-change | Fix the Angular manual-setup, error handler and component tracking snippets that fail to build | `P0-07-DOC-Q32.md` |
| 8 | P0 | DOC-Q37 | docs-change | Fix the Fastify error handler page: @sentry/fastify does not exist and fastify() is never imported | `P0-08-DOC-Q37.md` |
| 9 | P0 | DOC-Q41 | docs-change | Change onClick to onclick in the Svelte v5 tab of the tracing verify snippet | `P0-09-DOC-Q41.md` |
| 10 | P0 | DOC-Q44 | docs-change | Add the router to the Koa getting-started snippets that the verify step relies on | `P0-10-DOC-Q44.md` |
| 11 | P0 | DOC-Q48 | docs-change | State on the Solid guide that the tracing snippet requires @solidjs/router | `P0-11-DOC-Q48.md` |
| 12 | P0 | DOC-Q52 | docs-change | Rewrite the Connect guide and integration page for v11, whose SDK has no Connect instrumentation | `P0-12-DOC-Q52.md` |
| 13 | P0 | DOC-Q57 | docs-change | Fix the NestJS tracing verify snippet: its delayed throw is an uncaught exception that exits the app | `P0-13-DOC-Q57.md` |
| 14 | P0 | DOC-Q58 | docs-change | Replace the NestJS ESM start script with a command that runs | `P0-14-DOC-Q58.md` |
| 15 | P0 | DOC-Q69 | docs-change | Fix the nonexistent exports on the Google Cloud Functions pages: wrapBackgroundFunction, pgIntegration and ioredisIntegration | `P0-15-DOC-Q69.md` |
| 16 | P0 | DOC-Q71 | docs-change | Fix the stray parenthesis in the AWS Lambda ESM verify handler and Promise.rejected on the wrapper page | `P0-16-DOC-Q71.md` |
| 17 | P0 | DOC-Q75 | docs-change | Drop the metrics layer from the Effect v3 snippet, or say it needs Effect v4 | `P0-17-DOC-Q75.md` |
| 18 | P0 | DOC-Q78 | docs-change | Fix the Nitro guide's version claim and add serverDir to its config | `P0-18-DOC-Q78.md` |
| 19 | P0 | DOC-B1 | docs-change | Rewrite the Bun guide's instrumentation step around @sentry/bun/plugin | `P0-19-DOC-B1.md` |
| 20 | P0 | DOC-R1 | docs-change | Fix inverted traceLifecycle default in the stream mode includes | `P0-20-DOC-R1.md` |
| 21 | P0 | DOC-R2 | docs-change | Stop recommending denoCronIntegration() on the Deno crons page | `P0-21-DOC-R2.md` |
| 22 | P0 | DOC-R20 | docs-change | Delete the Bun OpenTelemetry setup includes and drop Bun from custom-setup | `P0-22-DOC-R20.md` |
| 23 | P0 | DOC-R13 | docs-change | Correct the Agents SDK span attribute and conversation ID claims | `P0-23-DOC-R13.md` |
| 24 | P0 | DOC-F50 | docs-change | Rewrite the Remix on Cloudflare page for Workers and fix the Vite plugin options | `P0-24-DOC-F50.md` |
| 25 | P0 | DOC-F36 | new-page | Add an Elysia on Cloudflare Workers page and drop the Bun/Node-only runtime claim | `P0-25-DOC-F36.md` |
| 26 | P0 | DOC-F19 | docs-change | Document Elysia on Deno: init from @sentry/deno, or add denoServeIntegration | `P0-26-DOC-F19.md` |
| 27 | P0 | DOC-F11 | docs-change | Add a Bun section to the Nuxt Nitro deployment presets page | `P0-27-DOC-F11.md` |
| 28 | P0 | DOC-F28 | docs-change | Correct the Nuxt Nitro preset page for Deno: keep the node-server preset | `P0-28-DOC-F28.md` |
| 29 | P0 | DOC-F13 | docs-change | Name Bun in the Astro runtime alert and add a Running on Bun section | `P0-29-DOC-F13.md` |
| 30 | P0 | DOC-F30 | docs-change | Correct the Astro runtime note: Deno with @deno/astro-adapter works | `P0-30-DOC-F30.md` |
| 31 | P0 | DOC-F29 | docs-change | Correct the SvelteKit adapter note: adapter-node runs on Deno | `P0-31-DOC-F29.md` |
| 32 | P1 | DOC-B2 | docs-change | Correct the Bun integrations table in platform-includes/.../javascript.bun.mdx | `P1-32-DOC-B2.md` |
| 33 | P1 | DOC-B3 | new-page | Add a frameworks page to the Bun guide and a Bun caveat to the Hono guide | `P1-33-DOC-B3.md` |
| 34 | P1 | DOC-D1 | docs-change | Document the @sentry/deno/import hook in the Deno guide | `P1-34-DOC-D1.md` |
| 35 | P1 | DOC-D2 | docs-change | Correct the Deno integrations table in platform-includes/.../javascript.deno.mdx | `P1-35-DOC-D2.md` |
| 36 | P1 | DOC-D3 | docs-change | Show one complete deno run command with all four permission flags in the Deno guide | `P1-36-DOC-D3.md` |
| 37 | P1 | DOC-D4 | docs-change | Add a frameworks page to the Deno guide and Deno notes to four Node framework guides | `P1-37-DOC-D4.md` |
| 38 | P1 | DOC-C1 | docs-change | Remove the @sentry/cloudflare/nodejs_compat entrypoint from the Cloudflare docs for v11 | `P1-38-DOC-C1.md` |
| 39 | P1 | DOC-C2 | docs-change | Rewrite features/d1.mdx around automatic D1 instrumentation | `P1-39-DOC-C2.md` |
| 40 | P1 | DOC-C4 | docs-change | Update features/vite-plugin.mdx to the shipped Cloudflare Vite plugin options | `P1-40-DOC-C4.md` |
| 41 | P1 | DOC-C5 | docs-change | Import wrapRequestHandler from @sentry/cloudflare/request and drop the honoIntegration page | `P1-41-DOC-C5.md` |
| 42 | P1 | DOC-C7 | new-page | Add a Cloudflare React Router page and fix frameworks/index.mdx and tanstack-start.mdx | `P1-42-DOC-C7.md` |
| 43 | P1 | X2 | docs-change | Add the per-runtime channel-instrumentation setup to the v10-to-v11 page | `P1-43-X2.md` |
| 44 | P1 | X3 | new-page | Add a runtime-by-framework support matrix for Bun, Deno and Cloudflare | `P1-44-X3.md` |
| 45 | P1 | DOC-F1 | docs-change | Document Hono on Bun: unbundled run and the Bun.build plugin variant | `P1-45-DOC-F1.md` |
| 46 | P1 | DOC-F2 | docs-change | Add a Bun database instrumentation section to the Elysia guide and fix four include statements | `P1-46-DOC-F2.md` |
| 47 | P1 | DOC-F3 | new-page | Add an Express on Bun page covering the Bun.build plugin step | `P1-47-DOC-F3.md` |
| 48 | P1 | DOC-F4 | new-page | Add a Fastify on Bun page and split Bun db instrumentation by driver | `P1-48-DOC-F4.md` |
| 49 | P1 | DOC-F5 | new-page | Add a Koa on Bun page covering the sentryBunPlugin build | `P1-49-DOC-F5.md` |
| 50 | P1 | DOC-F6 | new-page | Add a Hapi on Bun page covering the sentryBunPlugin build | `P1-50-DOC-F6.md` |
| 51 | P1 | DOC-F7 | new-page | Add an Oak on Bun page covering the Bun.serve routes map | `P1-51-DOC-F7.md` |
| 52 | P1 | DOC-F8 | new-page | Add a Fresh on Bun page for the built server output | `P1-52-DOC-F8.md` |
| 53 | P1 | DOC-F9 | new-page | Add a NestJS on Bun page covering the Bun.build plugin step | `P1-53-DOC-F9.md` |
| 54 | P1 | DOC-F10 | new-page | Add a Next.js on Bun page for bun --bun, the fetch integration and the channel pin | `P1-54-DOC-F10.md` |
| 55 | P1 | DOC-F12 | new-page | Add a SvelteKit on Bun page for the adapter-node output | `P1-55-DOC-F12.md` |
| 56 | P1 | DOC-F14 | new-page | Add a React Router on Bun page requiring the instrumentations export | `P1-56-DOC-F14.md` |
| 57 | P1 | DOC-F15 | limitation-note | Document TanStack Start on Bun: verified setup and its limits | `P1-57-DOC-F15.md` |
| 58 | P1 | DOC-F16 | new-page | Add a Remix v2 on Bun page for the Bun.build server bundle | `P1-58-DOC-F16.md` |
| 59 | P1 | DOC-F17 | new-page | Add a SolidStart on Bun page with the @sentry/bun integrations | `P1-59-DOC-F17.md` |
| 60 | P1 | DOC-F18 | docs-change | Document the verified Hono on Deno setup and its outgoing fetch limit | `P1-60-DOC-F18.md` |
| 61 | P1 | DOC-F20 | new-page | Add an Express on Deno page covering the plain setup and the import-hook setup | `P1-61-DOC-F20.md` |
| 62 | P1 | DOC-F21 | new-page | Add a Fastify on Deno page: full instrumentation without the import hook | `P1-62-DOC-F21.md` |
| 63 | P1 | DOC-F22 | new-page | Add a Koa on Deno page: instrumentation timing decides what you get | `P1-63-DOC-F22.md` |
| 64 | P1 | DOC-F23 | new-page | Add a Hapi on Deno page with the three verified wirings | `P1-64-DOC-F23.md` |
| 65 | P1 | DOC-F24 | new-page | Add an Oak on Deno page: mount with Deno.serve(app.fetch) | `P1-65-DOC-F24.md` |
| 66 | P1 | DOC-F25 | new-page | Add a Fresh 2 on Deno page: what the SDK does and does not instrument | `P1-66-DOC-F25.md` |
| 67 | P1 | DOC-F26 | new-page | Add a NestJS on Deno page: the boot workaround decides what you get | `P1-67-DOC-F26.md` |
| 68 | P1 | DOC-F27 | new-page | Add a Next.js on Deno page and document enableRuntimeChannelInjection | `P1-68-DOC-F27.md` |
| 69 | P1 | DOC-F31 | new-page | Add a React Router on Deno page with the Deno entry.server and node:http server entry | `P1-69-DOC-F31.md` |
| 70 | P1 | DOC-F32 | new-page | Add a TanStack Start on Deno page with the Deno entry and noExternals | `P1-70-DOC-F32.md` |
| 71 | P1 | DOC-F33 | new-page | Add a Remix on Deno page covering installGlobals and the build-time setup | `P1-71-DOC-F33.md` |
| 72 | P1 | DOC-F34 | new-page | Add a SolidStart on Deno install page and record its instrumentation limits | `P1-72-DOC-F34.md` |
| 73 | P1 | DOC-F35 | docs-change | Document Hono on Cloudflare Workers: compatibility_date and build-time database spans | `P1-73-DOC-F35.md` |
| 74 | P1 | DOC-F37 | new-page | Add an Express on Cloudflare Workers page built with the Sentry Cloudflare Vite plugin | `P1-74-DOC-F37.md` |
| 75 | P1 | DOC-F38 | limitation-note | Note that Fastify does not run on Cloudflare Workers | `P1-75-DOC-F38.md` |
| 76 | P1 | DOC-F39 | new-page | Add a Koa on Cloudflare Workers page covering the Vite build and module-scope rule | `P1-76-DOC-F39.md` |
| 77 | P1 | DOC-F40 | new-page | Add a Hapi on Cloudflare Workers page and document build-time instrumentation | `P1-77-DOC-F40.md` |
| 78 | P1 | DOC-F41 | new-page | Add an Oak on Cloudflare Workers page covering the JSR install and withSentry wiring | `P1-78-DOC-F41.md` |
| 79 | P1 | DOC-F42 | new-page | Add a Fresh 2 on Cloudflare Workers page with the esbuild orchestrion build step | `P1-79-DOC-F42.md` |
| 80 | P1 | DOC-F43 | new-page | Add a NestJS on Cloudflare Workers page using the esbuild orchestrion plugin | `P1-80-DOC-F43.md` |
| 81 | P1 | DOC-F44 | docs-change | Document outgoing fetch and database spans for Next.js on Cloudflare Workers | `P1-81-DOC-F44.md` |
| 82 | P1 | DOC-F45 | docs-change | Document server route naming for Nuxt on Cloudflare Workers | `P1-82-DOC-F45.md` |
| 83 | P1 | DOC-F46 | docs-change | Document route naming and database-span setup for SvelteKit on Cloudflare Workers | `P1-83-DOC-F46.md` |
| 84 | P1 | DOC-F48 | new-page | Add a React Router 7 on Cloudflare Workers page | `P1-84-DOC-F48.md` |
| 85 | P1 | DOC-F49 | docs-change | Add a "Configure Vite" step to the TanStack Start on Cloudflare page | `P1-85-DOC-F49.md` |
| 86 | P1 | DOC-F51 | new-page | Add a SolidStart on Cloudflare Workers page wiring the Nitro output with withSentry | `P1-86-DOC-F51.md` |
| 87 | P1 | DOC-R4 | docs-change | Exclude Cloudflare from the GlobalHandlers integration page | `P1-87-DOC-R4.md` |
| 88 | P1 | DOC-R5 | docs-change | Remove javascript.deno from the trpcMiddleware supported list | `P1-88-DOC-R5.md` |
| 89 | P1 | DOC-R6 | docs-change | Show the database and library integration pages on the Deno guide | `P1-89-DOC-R6.md` |
| 90 | P1 | DOC-R10 | docs-change | Correct where ExtraErrorData writes on the integration page | `P1-90-DOC-R10.md` |
| 91 | P1 | DOC-R11 | docs-change | Replace the invalid rewriteFrames options snippets with runnable code | `P1-91-DOC-R11.md` |
| 92 | P1 | DOC-R12 | docs-change | Enable the provider feature flag pages for Bun | `P1-92-DOC-R12.md` |
| 93 | P1 | DOC-R14 | docs-change | Document that errors inside ctx.waitUntil() are not captured | `P1-93-DOC-R14.md` |
| 94 | P1 | DOC-R15 | docs-change | Document Cloudflare Workflows step error capture on the final attempt | `P1-94-DOC-R15.md` |
| 95 | P1 | DOC-R18 | docs-change | Gate the release health and session APIs away from the Cloudflare guide | `P1-95-DOC-R18.md` |
| 96 | P1 | DOC-Q1 | docs-change | Rewrite the tracing verify step for the stream lifecycle on the Node, Bun, Deno and Cloudflare guides | `P1-96-DOC-Q1.md` |
| 97 | P1 | DOC-Q2 | docs-change | Say on the Vite plugin page that a wrangler config resolved to the wrong file instruments nothing | `P1-97-DOC-Q2.md` |
| 98 | P1 | DOC-Q3 | docs-change | State on the four guides that route names need a framework integration or a routes map | `P1-98-DOC-Q3.md` |
| 99 | P1 | DOC-Q8 | docs-change | Match the CDN bundle named on the browser config page to the integrations its snippet uses | `P1-99-DOC-Q8.md` |
| 100 | P1 | DOC-Q9 | docs-change | State on the logs pages which browser CDN bundles include Sentry.logger | `P1-100-DOC-Q9.md` |
| 101 | P1 | DOC-Q13 | docs-change | Say on the React error boundary page how reactErrorHandler and ErrorBoundary interact on React 19 | `P1-101-DOC-Q13.md` |
| 102 | P1 | DOC-Q14 | docs-change | Scope the built-in denylist claim on the data-collection include to request data | `P1-102-DOC-Q14.md` |
| 103 | P1 | DOC-Q15 | docs-change | Rename the Profiler span ops on the React component monitoring page | `P1-103-DOC-Q15.md` |
| 104 | P1 | DOC-Q21 | docs-change | Correct the Vue component tracking page: default hooks, span ops and the duplicate-key snippet | `P1-104-DOC-Q21.md` |
| 105 | P1 | DOC-Q27 | docs-change | Make the async tracing verify snippets work on Express 4 and Connect 3, or state what they need | `P1-105-DOC-Q27.md` |
| 106 | P1 | DOC-Q28 | docs-change | Correct the first-line import limitation on the esm-without-import page for v11 | `P1-106-DOC-Q28.md` |
| 107 | P1 | DOC-Q33 | docs-change | Show a working provider for a subclassed SentryErrorHandler on the Angular error handler page | `P1-107-DOC-Q33.md` |
| 108 | P1 | DOC-Q34 | docs-change | Rename the component tracking span ops on the Angular page | `P1-108-DOC-Q34.md` |
| 109 | P1 | DOC-Q38 | docs-change | Move shouldHandleError to fastifyIntegration on the Fastify error handler page | `P1-109-DOC-Q38.md` |
| 110 | P1 | DOC-Q39 | docs-change | Correct the supported Fastify versions on the integration page | `P1-110-DOC-Q39.md` |
| 111 | P1 | DOC-Q42 | docs-change | Correct the Svelte component tracking page: span ops, the trackUpdates default and the runes-mode limit | `P1-111-DOC-Q42.md` |
| 112 | P1 | DOC-Q45 | docs-change | Qualify the Koa error handler claims on the migration and esm-without-import pages | `P1-112-DOC-Q45.md` |
| 113 | P1 | DOC-Q46 | docs-change | Rewrite the Koa integration page around the diagnostics-channel instrumentation | `P1-113-DOC-Q46.md` |
| 114 | P1 | DOC-Q47 | docs-change | Rewrite the Hapi integration page and its table row | `P1-114-DOC-Q47.md` |
| 115 | P1 | DOC-Q49 | docs-change | Say on the Solid guide that the verify step needs a production build because of the DEV guard | `P1-115-DOC-Q49.md` |
| 116 | P1 | DOC-Q50 | docs-change | Add withSentryRouterRouting to the Solid guide's tracing snippet | `P1-116-DOC-Q50.md` |
| 117 | P1 | DOC-Q53 | docs-change | Say on the Connect guide that errors need an error-handling middleware, and show it | `P1-117-DOC-Q53.md` |
| 118 | P1 | DOC-Q54 | docs-change | Add the runtime import to the Hono tracing verify snippet | `P1-118-DOC-Q54.md` |
| 119 | P1 | DOC-Q55 | docs-change | Point the Hono config snippets on the CommonJS, ESM and ESM-without-import pages at @sentry/hono/node | `P1-119-DOC-Q55.md` |
| 120 | P1 | DOC-Q59 | docs-change | Say on the NestJS guide that SentryGlobalFilter is required for any HTTP error to be captured, and move it before Verify | `P1-120-DOC-Q59.md` |
| 121 | P1 | DOC-Q60 | docs-change | Rewrite the Nest integration page around the diagnostics-channel instrumentation | `P1-121-DOC-Q60.md` |
| 122 | P1 | DOC-Q62 | docs-change | Update the Node prerequisite include to the engines range the v11 packages declare | `P1-122-DOC-Q62.md` |
| 123 | P1 | DOC-Q63 | docs-change | Say on the WebAssembly guide what the integration needs: a build_id section, a URL-keeping loader and uploaded debug files | `P1-123-DOC-Q63.md` |
| 124 | P1 | DOC-Q64 | docs-change | Chain the Elysia verify route before .listen() on the guide | `P1-124-DOC-Q64.md` |
| 125 | P1 | DOC-Q65 | docs-change | Correct the default error filter description on the Elysia guide | `P1-125-DOC-Q65.md` |
| 126 | P1 | DOC-Q67 | docs-change | Document the built-in mastraIntegration route on the Mastra pages and say the exporter must not be combined with it | `P1-126-DOC-Q67.md` |
| 127 | P1 | DOC-Q72 | docs-change | Give the AWS Lambda load step the file name its ESM tab creates | `P1-127-DOC-Q72.md` |
| 128 | P1 | DOC-Q73 | docs-change | Say on the Lambda wrapper page that v11 wraps the handler automatically with default options | `P1-128-DOC-Q73.md` |
| 129 | P1 | DOC-Q76 | docs-change | Show the capture a failed effect needs on the Effect guide | `P1-129-DOC-Q76.md` |
| 130 | P1 | DOC-Q79 | docs-change | Correct the Nitro error-capture and span claims | `P1-130-DOC-Q79.md` |
| 131 | P1 | DOC-Q81 | docs-change | Use normalizedRequest in the Azure Functions request-context snippets | `P1-131-DOC-Q81.md` |
| 132 | P2 | DOC-B4 | docs-change | Fix Bun guide hygiene: version floor, Hono install command, v7 wording | `P2-132-DOC-B4.md` |
| 133 | P2 | DOC-D5 | docs-change | Rewrite the three Deno v7-to-v8 migration includes that are copies of the Bun ones | `P2-133-DOC-D5.md` |
| 134 | P2 | DOC-D6 | docs-change | Show deno add and an import map in the Deno guide's install step | `P2-134-DOC-D6.md` |
| 135 | P2 | DOC-C3 | docs-change | Add the four missing Cloudflare SdkOption entries and drop the deprecated enableRpcTracePropagation block | `P2-135-DOC-C3.md` |
| 136 | P2 | DOC-C6 | docs-change | Add a bindings table to the Cloudflare features/index.mdx | `P2-136-DOC-C6.md` |
| 137 | P2 | DOC-C8 | docs-change | Fix snippet errors across the Cloudflare includes and framework pages | `P2-137-DOC-C8.md` |
| 138 | P2 | X1 | docs-change | Fix "Tracing is enabled by default" in the Bun, Deno and Cloudflare enable-tracing includes | `P2-138-X1.md` |
| 139 | P2 | DOC-F47 | docs-change | Confirm tested versions and database spans on the Astro on Cloudflare page | `P2-139-DOC-F47.md` |
| 140 | P2 | DOC-R7 | docs-change | Add Deno and Cloudflare to the OpenTelemetry overview and API pages | `P2-140-DOC-R7.md` |
| 141 | P2 | DOC-R8 | docs-change | Fix removed integration names in the Bun and Deno v7 migration tables | `P2-141-DOC-R8.md` |
| 142 | P2 | DOC-R16 | docs-change | Document the Durable Object WebSocket and alarm instrumentation | `P2-142-DOC-R16.md` |
| 143 | P2 | DOC-R17 | docs-change | Add deno serve to the Deno guide run commands | `P2-143-DOC-R17.md` |
| 144 | P2 | DOC-R19 | docs-change | Note that the root Pages middleware also spans static asset requests | `P2-144-DOC-R19.md` |
| 145 | P2 | DOC-Q4 | docs-change | Explain the channel-injection warnings on the Bun guide | `P2-145-DOC-Q4.md` |
| 146 | P2 | DOC-Q5 | docs-change | Update the Node getting-started page for --require and for first-line ESM imports | `P2-146-DOC-Q5.md` |
| 147 | P2 | DOC-Q6 | docs-change | Say on the Cloudflare guide that readable stack traces need the source maps step | `P2-147-DOC-Q6.md` |
| 148 | P2 | DOC-Q10 | docs-change | Say on the browser config page that the sample tracePropagationTargets matches localhost only | `P2-148-DOC-Q10.md` |
| 149 | P2 | DOC-Q11 | docs-change | Tell browser readers to wait before triggering the verify error if they expect a replay | `P2-149-DOC-Q11.md` |
| 150 | P2 | DOC-Q16 | docs-change | Move the React guide routing snippet to the version-agnostic React Router API | `P2-150-DOC-Q16.md` |
| 151 | P2 | DOC-Q17 | docs-change | Rewrite the React verify step for the stream lifecycle and fix the test span | `P2-151-DOC-Q17.md` |
| 152 | P2 | DOC-Q18 | docs-change | Say on the React, Vue, Angular, Svelte, Solid and WebAssembly guides that release health sessions need a release | `P2-152-DOC-Q18.md` |
| 153 | P2 | DOC-Q22 | docs-change | Rewrite the Vue guide and its feature pages for the stream lifecycle | `P2-153-DOC-Q22.md` |
| 154 | P2 | DOC-Q23 | docs-change | Fix the late-initialization and multiple-apps snippets on the Vue pages | `P2-154-DOC-Q23.md` |
| 155 | P2 | DOC-Q24 | docs-change | Say on the Vue guide that the component context of the verify error appears in production builds | `P2-155-DOC-Q24.md` |
| 156 | P2 | DOC-Q29 | docs-change | Drop the deprecated setup*ErrorHandler calls from the Express, Fastify, Koa and Hapi getting-started snippets | `P2-156-DOC-Q29.md` |
| 157 | P2 | DOC-Q30 | new-page | Add an expressIntegration page to the integrations directory | `P2-157-DOC-Q30.md` |
| 158 | P2 | DOC-Q31 | docs-change | Fix the empty capture-errors include and the orphaned includes on the Express guide | `P2-158-DOC-Q31.md` |
| 159 | P2 | DOC-Q35 | docs-change | Rewrite the Angular manual-setup verify and tracing text for the stream lifecycle | `P2-159-DOC-Q35.md` |
| 160 | P2 | DOC-Q36 | docs-change | Fix the Angular pages' deprecated bootstrap call, the missing logs onboarding option and the stray export | `P2-160-DOC-Q36.md` |
| 161 | P2 | DOC-Q40 | docs-change | Rewrite the Fastify integration page around the diagnostics-channel instrumentation and its options | `P2-161-DOC-Q40.md` |
| 162 | P2 | DOC-Q43 | docs-change | Rewrite the Svelte verify and tracing text for the stream lifecycle and fix the compilerOptions placeholder | `P2-162-DOC-Q43.md` |
| 163 | P2 | DOC-Q51 | docs-change | Fix the TanStack Router snippet fence and the transactions wording on the Solid pages | `P2-163-DOC-Q51.md` |
| 164 | P2 | DOC-Q56 | docs-change | Add the missing details to the Hono guide: catch-all naming, middleware options, error filter semantics and the node-server dependency | `P2-164-DOC-Q56.md` |
| 165 | P2 | DOC-Q61 | docs-change | Say what SentryModule does on the NestJS guide, fix the transactions wording and describe the span sets | `P2-165-DOC-Q61.md` |
| 166 | P2 | DOC-Q66 | docs-change | Rewrite the Elysia instrumentation include for v11 and add the Node run details | `P2-166-DOC-Q66.md` |
| 167 | P2 | DOC-Q68 | docs-change | Correct the attribute list, the defaults and the trace shape on the Mastra pages | `P2-167-DOC-Q68.md` |
| 168 | P2 | DOC-Q70 | docs-change | Add the missing details to the Google Cloud Functions guide: promise-form handlers, the two-trace split, a local run step, the logs option and consistent export names | `P2-168-DOC-Q70.md` |
| 169 | P2 | DOC-Q74 | docs-change | Add the missing details to the AWS Lambda pages | `P2-169-DOC-Q74.md` |
| 170 | P2 | DOC-Q77 | docs-change | Add the missing details to the Effect guide | `P2-170-DOC-Q77.md` |
| 171 | P2 | DOC-Q80 | docs-change | Add the missing details to the Nitro guide | `P2-171-DOC-Q80.md` |
| 172 | P2 | DOC-Q82 | docs-change | Add the missing details to the Azure Functions guide | `P2-172-DOC-Q82.md` |
