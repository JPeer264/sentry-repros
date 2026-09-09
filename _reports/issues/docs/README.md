# Docs issue drafts, P0 to P2

130 drafts for `getsentry/sentry-docs`, one per finding of the runtime docs audit. P0 is in the suggested filing order; P1 and P2 follow the audit page. Each `.md` is an issue body, the title is in the table. `create.sh` files them with the GitHub CLI and was not run.

| # | Prio | Item | Type | Title | File |
| --- | --- | --- | --- | --- | --- |
| 1 | P0 | DOC-Q7 | docs-change | Fix the tracing verify snippet on the browser getting-started page: await inside a non-async function | `P0-01-DOC-Q7.md` |
| 2 | P0 | DOC-Q12 | docs-change | Fix the React Router v6 and v7 page snippets that fail on React 19 | `P0-02-DOC-Q12.md` |
| 3 | P0 | DOC-Q19 | docs-change | Add a Vue 3 example to the Vue Router instrumentation page | `P0-03-DOC-Q19.md` |
| 4 | P0 | DOC-Q20 | docs-change | Add the missing comma to the tracingOptions.hooks snippet on the Vue component tracking page | `P0-04-DOC-Q20.md` |
| 5 | P0 | DOC-Q25 | docs-change | Fix the extensionless instrument import on the Express and Fastify guides and the esm-without-import page | `P0-05-DOC-Q25.md` |
| 6 | P0 | DOC-Q26 | docs-change | Rewrite or remove the late-initialization install page for v11 | `P0-06-DOC-Q26.md` |
| 7 | P0 | DOC-Q32 | docs-change | Fix the Angular manual-setup, error handler and component tracking snippets that fail to build | `P0-07-DOC-Q32.md` |
| 8 | P0 | DOC-Q37 | docs-change | Fix the Fastify error handler page: @sentry/fastify does not exist and fastify() is never imported | `P0-08-DOC-Q37.md` |
| 9 | P0 | DOC-B1 | docs-change | Rewrite the Bun guide's instrumentation step around @sentry/bun/plugin | `P0-09-DOC-B1.md` |
| 10 | P0 | DOC-R1 | docs-change | Fix inverted traceLifecycle default in the stream mode includes | `P0-10-DOC-R1.md` |
| 11 | P0 | DOC-R2 | docs-change | Stop recommending denoCronIntegration() on the Deno crons page | `P0-11-DOC-R2.md` |
| 12 | P0 | DOC-R20 | docs-change | Delete the Bun OpenTelemetry setup includes and drop Bun from custom-setup | `P0-12-DOC-R20.md` |
| 13 | P0 | DOC-R13 | docs-change | Correct the Agents SDK span attribute and conversation ID claims | `P0-13-DOC-R13.md` |
| 14 | P0 | DOC-F50 | docs-change | Rewrite the Remix on Cloudflare page for Workers and fix the Vite plugin options | `P0-14-DOC-F50.md` |
| 15 | P0 | DOC-F36 | new-page | Add an Elysia on Cloudflare Workers page and drop the Bun/Node-only runtime claim | `P0-15-DOC-F36.md` |
| 16 | P0 | DOC-F19 | docs-change | Document Elysia on Deno: init from @sentry/deno, or add denoServeIntegration | `P0-16-DOC-F19.md` |
| 17 | P0 | DOC-F11 | docs-change | Add a Bun section to the Nuxt Nitro deployment presets page | `P0-17-DOC-F11.md` |
| 18 | P0 | DOC-F28 | docs-change | Correct the Nuxt Nitro preset page for Deno: keep the node-server preset | `P0-18-DOC-F28.md` |
| 19 | P0 | DOC-F13 | docs-change | Name Bun in the Astro runtime alert and add a Running on Bun section | `P0-19-DOC-F13.md` |
| 20 | P0 | DOC-F30 | docs-change | Correct the Astro runtime note: Deno with @deno/astro-adapter works | `P0-20-DOC-F30.md` |
| 21 | P0 | DOC-F29 | docs-change | Correct the SvelteKit adapter note: adapter-node runs on Deno | `P0-21-DOC-F29.md` |
| 22 | P1 | DOC-B2 | docs-change | Correct the Bun integrations table in platform-includes/.../javascript.bun.mdx | `P1-22-DOC-B2.md` |
| 23 | P1 | DOC-B3 | new-page | Add a frameworks page to the Bun guide and a Bun caveat to the Hono guide | `P1-23-DOC-B3.md` |
| 24 | P1 | DOC-D1 | docs-change | Document the @sentry/deno/import hook in the Deno guide | `P1-24-DOC-D1.md` |
| 25 | P1 | DOC-D2 | docs-change | Correct the Deno integrations table in platform-includes/.../javascript.deno.mdx | `P1-25-DOC-D2.md` |
| 26 | P1 | DOC-D3 | docs-change | Show one complete deno run command with all four permission flags in the Deno guide | `P1-26-DOC-D3.md` |
| 27 | P1 | DOC-D4 | docs-change | Add a frameworks page to the Deno guide and Deno notes to four Node framework guides | `P1-27-DOC-D4.md` |
| 28 | P1 | DOC-C1 | docs-change | Remove the @sentry/cloudflare/nodejs_compat entrypoint from the Cloudflare docs for v11 | `P1-28-DOC-C1.md` |
| 29 | P1 | DOC-C2 | docs-change | Rewrite features/d1.mdx around automatic D1 instrumentation | `P1-29-DOC-C2.md` |
| 30 | P1 | DOC-C4 | docs-change | Update features/vite-plugin.mdx to the shipped Cloudflare Vite plugin options | `P1-30-DOC-C4.md` |
| 31 | P1 | DOC-C5 | docs-change | Import wrapRequestHandler from @sentry/cloudflare/request and drop the honoIntegration page | `P1-31-DOC-C5.md` |
| 32 | P1 | DOC-C7 | new-page | Add a Cloudflare React Router page and fix frameworks/index.mdx and tanstack-start.mdx | `P1-32-DOC-C7.md` |
| 33 | P1 | X2 | docs-change | Add the per-runtime channel-instrumentation setup to the v10-to-v11 page | `P1-33-X2.md` |
| 34 | P1 | X3 | new-page | Add a runtime-by-framework support matrix for Bun, Deno and Cloudflare | `P1-34-X3.md` |
| 35 | P1 | DOC-F1 | docs-change | Document Hono on Bun: unbundled run and the Bun.build plugin variant | `P1-35-DOC-F1.md` |
| 36 | P1 | DOC-F2 | docs-change | Add a Bun database instrumentation section to the Elysia guide and fix four include statements | `P1-36-DOC-F2.md` |
| 37 | P1 | DOC-F3 | new-page | Add an Express on Bun page covering the Bun.build plugin step | `P1-37-DOC-F3.md` |
| 38 | P1 | DOC-F4 | new-page | Add a Fastify on Bun page and split Bun db instrumentation by driver | `P1-38-DOC-F4.md` |
| 39 | P1 | DOC-F5 | new-page | Add a Koa on Bun page covering the sentryBunPlugin build | `P1-39-DOC-F5.md` |
| 40 | P1 | DOC-F6 | new-page | Add a Hapi on Bun page covering the sentryBunPlugin build | `P1-40-DOC-F6.md` |
| 41 | P1 | DOC-F7 | new-page | Add an Oak on Bun page covering the Bun.serve routes map | `P1-41-DOC-F7.md` |
| 42 | P1 | DOC-F8 | new-page | Add a Fresh on Bun page for the built server output | `P1-42-DOC-F8.md` |
| 43 | P1 | DOC-F9 | new-page | Add a NestJS on Bun page covering the Bun.build plugin step | `P1-43-DOC-F9.md` |
| 44 | P1 | DOC-F10 | new-page | Add a Next.js on Bun page for bun --bun, the fetch integration and the channel pin | `P1-44-DOC-F10.md` |
| 45 | P1 | DOC-F12 | new-page | Add a SvelteKit on Bun page for the adapter-node output | `P1-45-DOC-F12.md` |
| 46 | P1 | DOC-F14 | new-page | Add a React Router on Bun page requiring the instrumentations export | `P1-46-DOC-F14.md` |
| 47 | P1 | DOC-F15 | limitation-note | Document TanStack Start on Bun: verified setup and its limits | `P1-47-DOC-F15.md` |
| 48 | P1 | DOC-F16 | new-page | Add a Remix v2 on Bun page for the Bun.build server bundle | `P1-48-DOC-F16.md` |
| 49 | P1 | DOC-F17 | new-page | Add a SolidStart on Bun page with the @sentry/bun integrations | `P1-49-DOC-F17.md` |
| 50 | P1 | DOC-F18 | docs-change | Document the verified Hono on Deno setup and its outgoing fetch limit | `P1-50-DOC-F18.md` |
| 51 | P1 | DOC-F20 | new-page | Add an Express on Deno page covering the plain setup and the import-hook setup | `P1-51-DOC-F20.md` |
| 52 | P1 | DOC-F21 | new-page | Add a Fastify on Deno page: full instrumentation without the import hook | `P1-52-DOC-F21.md` |
| 53 | P1 | DOC-F22 | new-page | Add a Koa on Deno page: instrumentation timing decides what you get | `P1-53-DOC-F22.md` |
| 54 | P1 | DOC-F23 | new-page | Add a Hapi on Deno page with the three verified wirings | `P1-54-DOC-F23.md` |
| 55 | P1 | DOC-F24 | new-page | Add an Oak on Deno page: mount with Deno.serve(app.fetch) | `P1-55-DOC-F24.md` |
| 56 | P1 | DOC-F25 | new-page | Add a Fresh 2 on Deno page: what the SDK does and does not instrument | `P1-56-DOC-F25.md` |
| 57 | P1 | DOC-F26 | new-page | Add a NestJS on Deno page: the boot workaround decides what you get | `P1-57-DOC-F26.md` |
| 58 | P1 | DOC-F27 | new-page | Add a Next.js on Deno page and document enableRuntimeChannelInjection | `P1-58-DOC-F27.md` |
| 59 | P1 | DOC-F31 | new-page | Add a React Router on Deno page with the Deno entry.server and node:http server entry | `P1-59-DOC-F31.md` |
| 60 | P1 | DOC-F32 | new-page | Add a TanStack Start on Deno page with the Deno entry and noExternals | `P1-60-DOC-F32.md` |
| 61 | P1 | DOC-F33 | new-page | Add a Remix on Deno page covering installGlobals and the build-time setup | `P1-61-DOC-F33.md` |
| 62 | P1 | DOC-F34 | new-page | Add a SolidStart on Deno install page and record its instrumentation limits | `P1-62-DOC-F34.md` |
| 63 | P1 | DOC-F35 | docs-change | Document Hono on Cloudflare Workers: compatibility_date and build-time database spans | `P1-63-DOC-F35.md` |
| 64 | P1 | DOC-F37 | new-page | Add an Express on Cloudflare Workers page built with the Sentry Cloudflare Vite plugin | `P1-64-DOC-F37.md` |
| 65 | P1 | DOC-F38 | limitation-note | Note that Fastify does not run on Cloudflare Workers | `P1-65-DOC-F38.md` |
| 66 | P1 | DOC-F39 | new-page | Add a Koa on Cloudflare Workers page covering the Vite build and module-scope rule | `P1-66-DOC-F39.md` |
| 67 | P1 | DOC-F40 | new-page | Add a Hapi on Cloudflare Workers page and document build-time instrumentation | `P1-67-DOC-F40.md` |
| 68 | P1 | DOC-F41 | new-page | Add an Oak on Cloudflare Workers page covering the JSR install and withSentry wiring | `P1-68-DOC-F41.md` |
| 69 | P1 | DOC-F42 | new-page | Add a Fresh 2 on Cloudflare Workers page with the esbuild orchestrion build step | `P1-69-DOC-F42.md` |
| 70 | P1 | DOC-F43 | new-page | Add a NestJS on Cloudflare Workers page using the esbuild orchestrion plugin | `P1-70-DOC-F43.md` |
| 71 | P1 | DOC-F44 | docs-change | Document outgoing fetch and database spans for Next.js on Cloudflare Workers | `P1-71-DOC-F44.md` |
| 72 | P1 | DOC-F45 | docs-change | Document server route naming for Nuxt on Cloudflare Workers | `P1-72-DOC-F45.md` |
| 73 | P1 | DOC-F46 | docs-change | Document route naming and database-span setup for SvelteKit on Cloudflare Workers | `P1-73-DOC-F46.md` |
| 74 | P1 | DOC-F48 | new-page | Add a React Router 7 on Cloudflare Workers page | `P1-74-DOC-F48.md` |
| 75 | P1 | DOC-F49 | docs-change | Add a "Configure Vite" step to the TanStack Start on Cloudflare page | `P1-75-DOC-F49.md` |
| 76 | P1 | DOC-F51 | new-page | Add a SolidStart on Cloudflare Workers page wiring the Nitro output with withSentry | `P1-76-DOC-F51.md` |
| 77 | P1 | DOC-R4 | docs-change | Exclude Cloudflare from the GlobalHandlers integration page | `P1-77-DOC-R4.md` |
| 78 | P1 | DOC-R5 | docs-change | Remove javascript.deno from the trpcMiddleware supported list | `P1-78-DOC-R5.md` |
| 79 | P1 | DOC-R6 | docs-change | Show the database and library integration pages on the Deno guide | `P1-79-DOC-R6.md` |
| 80 | P1 | DOC-R10 | docs-change | Correct where ExtraErrorData writes on the integration page | `P1-80-DOC-R10.md` |
| 81 | P1 | DOC-R11 | docs-change | Replace the invalid rewriteFrames options snippets with runnable code | `P1-81-DOC-R11.md` |
| 82 | P1 | DOC-R12 | docs-change | Enable the provider feature flag pages for Bun | `P1-82-DOC-R12.md` |
| 83 | P1 | DOC-R14 | docs-change | Document that errors inside ctx.waitUntil() are not captured | `P1-83-DOC-R14.md` |
| 84 | P1 | DOC-R15 | docs-change | Document Cloudflare Workflows step error capture on the final attempt | `P1-84-DOC-R15.md` |
| 85 | P1 | DOC-R18 | docs-change | Gate the release health and session APIs away from the Cloudflare guide | `P1-85-DOC-R18.md` |
| 86 | P1 | DOC-Q1 | docs-change | Rewrite the tracing verify step for the stream lifecycle on the Node, Bun, Deno and Cloudflare guides | `P1-86-DOC-Q1.md` |
| 87 | P1 | DOC-Q2 | docs-change | Say on the Vite plugin page that a wrangler config resolved to the wrong file instruments nothing | `P1-87-DOC-Q2.md` |
| 88 | P1 | DOC-Q3 | docs-change | State on the four guides that route names need a framework integration or a routes map | `P1-88-DOC-Q3.md` |
| 89 | P1 | DOC-Q8 | docs-change | Match the CDN bundle named on the browser config page to the integrations its snippet uses | `P1-89-DOC-Q8.md` |
| 90 | P1 | DOC-Q9 | docs-change | State on the logs pages which browser CDN bundles include Sentry.logger | `P1-90-DOC-Q9.md` |
| 91 | P1 | DOC-Q13 | docs-change | Say on the React error boundary page how reactErrorHandler and ErrorBoundary interact on React 19 | `P1-91-DOC-Q13.md` |
| 92 | P1 | DOC-Q14 | docs-change | Scope the built-in denylist claim on the data-collection include to request data | `P1-92-DOC-Q14.md` |
| 93 | P1 | DOC-Q15 | docs-change | Rename the Profiler span ops on the React component monitoring page | `P1-93-DOC-Q15.md` |
| 94 | P1 | DOC-Q21 | docs-change | Correct the Vue component tracking page: default hooks, span ops and the duplicate-key snippet | `P1-94-DOC-Q21.md` |
| 95 | P1 | DOC-Q27 | docs-change | State the Express major the async tracing verify snippet needs, or make it work on Express 4 | `P1-95-DOC-Q27.md` |
| 96 | P1 | DOC-Q28 | docs-change | Correct the first-line import limitation on the esm-without-import page for v11 | `P1-96-DOC-Q28.md` |
| 97 | P1 | DOC-Q33 | docs-change | Show a working provider for a subclassed SentryErrorHandler on the Angular error handler page | `P1-97-DOC-Q33.md` |
| 98 | P1 | DOC-Q34 | docs-change | Rename the component tracking span ops on the Angular page | `P1-98-DOC-Q34.md` |
| 99 | P1 | DOC-Q38 | docs-change | Move shouldHandleError to fastifyIntegration on the Fastify error handler page | `P1-99-DOC-Q38.md` |
| 100 | P1 | DOC-Q39 | docs-change | Correct the supported Fastify versions on the integration page | `P1-100-DOC-Q39.md` |
| 101 | P2 | DOC-B4 | docs-change | Fix Bun guide hygiene: version floor, Hono install command, v7 wording | `P2-101-DOC-B4.md` |
| 102 | P2 | DOC-D5 | docs-change | Rewrite the three Deno v7-to-v8 migration includes that are copies of the Bun ones | `P2-102-DOC-D5.md` |
| 103 | P2 | DOC-D6 | docs-change | Show deno add and an import map in the Deno guide's install step | `P2-103-DOC-D6.md` |
| 104 | P2 | DOC-C3 | docs-change | Add the four missing Cloudflare SdkOption entries and drop the deprecated enableRpcTracePropagation block | `P2-104-DOC-C3.md` |
| 105 | P2 | DOC-C6 | docs-change | Add a bindings table to the Cloudflare features/index.mdx | `P2-105-DOC-C6.md` |
| 106 | P2 | DOC-C8 | docs-change | Fix snippet errors across the Cloudflare includes and framework pages | `P2-106-DOC-C8.md` |
| 107 | P2 | X1 | docs-change | Fix "Tracing is enabled by default" in the Bun, Deno and Cloudflare enable-tracing includes | `P2-107-X1.md` |
| 108 | P2 | DOC-F47 | docs-change | Confirm tested versions and database spans on the Astro on Cloudflare page | `P2-108-DOC-F47.md` |
| 109 | P2 | DOC-R7 | docs-change | Add Deno and Cloudflare to the OpenTelemetry overview and API pages | `P2-109-DOC-R7.md` |
| 110 | P2 | DOC-R8 | docs-change | Fix removed integration names in the Bun and Deno v7 migration tables | `P2-110-DOC-R8.md` |
| 111 | P2 | DOC-R16 | docs-change | Document the Durable Object WebSocket and alarm instrumentation | `P2-111-DOC-R16.md` |
| 112 | P2 | DOC-R17 | docs-change | Add deno serve to the Deno guide run commands | `P2-112-DOC-R17.md` |
| 113 | P2 | DOC-R19 | docs-change | Note that the root Pages middleware also spans static asset requests | `P2-113-DOC-R19.md` |
| 114 | P2 | DOC-Q4 | docs-change | Explain the channel-injection warnings on the Bun guide | `P2-114-DOC-Q4.md` |
| 115 | P2 | DOC-Q5 | docs-change | Update the Node getting-started page for --require and for first-line ESM imports | `P2-115-DOC-Q5.md` |
| 116 | P2 | DOC-Q6 | docs-change | Say on the Cloudflare guide that readable stack traces need the source maps step | `P2-116-DOC-Q6.md` |
| 117 | P2 | DOC-Q10 | docs-change | Say on the browser config page that the sample tracePropagationTargets matches localhost only | `P2-117-DOC-Q10.md` |
| 118 | P2 | DOC-Q11 | docs-change | Tell browser readers to wait before triggering the verify error if they expect a replay | `P2-118-DOC-Q11.md` |
| 119 | P2 | DOC-Q16 | docs-change | Move the React guide routing snippet to the version-agnostic React Router API | `P2-119-DOC-Q16.md` |
| 120 | P2 | DOC-Q17 | docs-change | Rewrite the React verify step for the stream lifecycle and fix the test span | `P2-120-DOC-Q17.md` |
| 121 | P2 | DOC-Q18 | docs-change | Say on the React, Vue and Angular guides that release health sessions need a release | `P2-121-DOC-Q18.md` |
| 122 | P2 | DOC-Q22 | docs-change | Rewrite the Vue guide and its feature pages for the stream lifecycle | `P2-122-DOC-Q22.md` |
| 123 | P2 | DOC-Q23 | docs-change | Fix the late-initialization and multiple-apps snippets on the Vue pages | `P2-123-DOC-Q23.md` |
| 124 | P2 | DOC-Q24 | docs-change | Say on the Vue guide that the component context of the verify error appears in production builds | `P2-124-DOC-Q24.md` |
| 125 | P2 | DOC-Q29 | docs-change | Drop setupExpressErrorHandler and setupFastifyErrorHandler from the getting-started snippets | `P2-125-DOC-Q29.md` |
| 126 | P2 | DOC-Q30 | new-page | Add an expressIntegration page to the integrations directory | `P2-126-DOC-Q30.md` |
| 127 | P2 | DOC-Q31 | docs-change | Fix the empty capture-errors include and the orphaned includes on the Express guide | `P2-127-DOC-Q31.md` |
| 128 | P2 | DOC-Q35 | docs-change | Rewrite the Angular manual-setup verify and tracing text for the stream lifecycle | `P2-128-DOC-Q35.md` |
| 129 | P2 | DOC-Q36 | docs-change | Fix the Angular pages' deprecated bootstrap call, the missing logs onboarding option and the stray export | `P2-129-DOC-Q36.md` |
| 130 | P2 | DOC-Q40 | docs-change | Rewrite the Fastify integration page around the diagnostics-channel instrumentation and its options | `P2-130-DOC-Q40.md` |
