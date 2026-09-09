#!/usr/bin/env bash
# Files the docs issues in getsentry/sentry-docs. Not executed by the audit. Items marked as owned by Linear are commented out.
set -euo pipefail
cd "$(dirname "$0")"

gh issue create -R getsentry/sentry-docs --title "Fix the tracing verify snippet on the browser getting-started page: await inside a non-async function" --body-file P0-01-DOC-Q7.md
gh issue create -R getsentry/sentry-docs --title "Fix the React Router v6 and v7 page snippets that fail on React 19" --body-file P0-02-DOC-Q12.md
gh issue create -R getsentry/sentry-docs --title "Add a Vue 3 example to the Vue Router instrumentation page" --body-file P0-03-DOC-Q19.md
gh issue create -R getsentry/sentry-docs --title "Add the missing comma to the tracingOptions.hooks snippet on the Vue component tracking page" --body-file P0-04-DOC-Q20.md
gh issue create -R getsentry/sentry-docs --title "Fix the extensionless instrument import on the Express, Fastify, Koa, Hapi and Connect guides and the esm-without-import page" --body-file P0-05-DOC-Q25.md
gh issue create -R getsentry/sentry-docs --title "Rewrite or remove the late-initialization install page for v11" --body-file P0-06-DOC-Q26.md
gh issue create -R getsentry/sentry-docs --title "Fix the Angular manual-setup, error handler and component tracking snippets that fail to build" --body-file P0-07-DOC-Q32.md
gh issue create -R getsentry/sentry-docs --title "Fix the Fastify error handler page: @sentry/fastify does not exist and fastify() is never imported" --body-file P0-08-DOC-Q37.md
gh issue create -R getsentry/sentry-docs --title "Change onClick to onclick in the Svelte v5 tab of the tracing verify snippet" --body-file P0-09-DOC-Q41.md
gh issue create -R getsentry/sentry-docs --title "Add the router to the Koa getting-started snippets that the verify step relies on" --body-file P0-10-DOC-Q44.md
gh issue create -R getsentry/sentry-docs --title "State on the Solid guide that the tracing snippet requires @solidjs/router" --body-file P0-11-DOC-Q48.md
gh issue create -R getsentry/sentry-docs --title "Rewrite the Connect guide and integration page for v11, whose SDK has no Connect instrumentation" --body-file P0-12-DOC-Q52.md
gh issue create -R getsentry/sentry-docs --title "Fix the NestJS tracing verify snippet: its delayed throw is an uncaught exception that exits the app" --body-file P0-13-DOC-Q57.md
gh issue create -R getsentry/sentry-docs --title "Replace the NestJS ESM start script with a command that runs" --body-file P0-14-DOC-Q58.md
gh issue create -R getsentry/sentry-docs --title "Fix the nonexistent exports on the Google Cloud Functions pages: wrapBackgroundFunction, pgIntegration and ioredisIntegration" --body-file P0-15-DOC-Q69.md
gh issue create -R getsentry/sentry-docs --title "Fix the stray parenthesis in the AWS Lambda ESM verify handler and Promise.rejected on the wrapper page" --body-file P0-16-DOC-Q71.md
gh issue create -R getsentry/sentry-docs --title "Drop the metrics layer from the Effect v3 snippet, or say it needs Effect v4" --body-file P0-17-DOC-Q75.md
gh issue create -R getsentry/sentry-docs --title "Fix the Nitro guide's version claim and add serverDir to its config" --body-file P0-18-DOC-Q78.md
gh issue create -R getsentry/sentry-docs --title "Add the SDK import to the Cloudflare Pages tracing verify snippet" --body-file P0-19-DOC-Q83.md
gh issue create -R getsentry/sentry-docs --title "Import withSentryConfig from @sentry/nextjs/config in every Next.js config snippet" --body-file P0-20-DOC-Q86.md
gh issue create -R getsentry/sentry-docs --title "Fix the Pages Router manual-setup page: instrumentation-client.ts for Turbopack and the instrumentation.ts step" --body-file P0-21-DOC-Q87.md
gh issue create -R getsentry/sentry-docs --title "Import sentrySvelteKit from @sentry/sveltekit/vite in every SvelteKit config snippet" --body-file P0-22-DOC-Q92.md
gh issue create -R getsentry/sentry-docs --title "Fix the Remix entry.server snippet with two handleError exports and the vite.config import of an uninstalled package" --body-file P0-23-DOC-Q95.md
gh issue create -R getsentry/sentry-docs --title "Rewrite the Bun guide's instrumentation step around @sentry/bun/plugin" --body-file P0-24-DOC-B1.md
gh issue create -R getsentry/sentry-docs --title "Fix inverted traceLifecycle default in the stream mode includes" --body-file P0-25-DOC-R1.md
gh issue create -R getsentry/sentry-docs --title "Stop recommending denoCronIntegration() on the Deno crons page" --body-file P0-26-DOC-R2.md
# gh issue create -R getsentry/sentry-docs --title "Delete the Bun OpenTelemetry setup includes and drop Bun from custom-setup" --body-file P0-27-DOC-R20.md
gh issue create -R getsentry/sentry-docs --title "Correct the Agents SDK span attribute and conversation ID claims" --body-file P0-28-DOC-R13.md
gh issue create -R getsentry/sentry-docs --title "Rewrite the Remix on Cloudflare page for Workers and fix the Vite plugin options" --body-file P0-29-DOC-F50.md
gh issue create -R getsentry/sentry-docs --title "Add an Elysia on Cloudflare Workers page and drop the Bun/Node-only runtime claim" --body-file P0-30-DOC-F36.md
gh issue create -R getsentry/sentry-docs --title "Document Elysia on Deno: init from @sentry/deno, or add denoServeIntegration" --body-file P0-31-DOC-F19.md
gh issue create -R getsentry/sentry-docs --title "Add a Bun section to the Nuxt Nitro deployment presets page" --body-file P0-32-DOC-F11.md
gh issue create -R getsentry/sentry-docs --title "Correct the Nuxt Nitro preset page for Deno: keep the node-server preset" --body-file P0-33-DOC-F28.md
gh issue create -R getsentry/sentry-docs --title "Name Bun in the Astro runtime alert and add a Running on Bun section" --body-file P0-34-DOC-F13.md
gh issue create -R getsentry/sentry-docs --title "Correct the Astro runtime note: Deno with @deno/astro-adapter works" --body-file P0-35-DOC-F30.md
gh issue create -R getsentry/sentry-docs --title "Correct the SvelteKit adapter note: adapter-node runs on Deno" --body-file P0-36-DOC-F29.md
gh issue create -R getsentry/sentry-docs --title "Correct the Bun integrations table in platform-includes/.../javascript.bun.mdx" --body-file P1-37-DOC-B2.md
gh issue create -R getsentry/sentry-docs --title "Add a frameworks page to the Bun guide and a Bun caveat to the Hono guide" --body-file P1-38-DOC-B3.md
gh issue create -R getsentry/sentry-docs --title "Document the @sentry/deno/import hook in the Deno guide" --body-file P1-39-DOC-D1.md
gh issue create -R getsentry/sentry-docs --title "Correct the Deno integrations table in platform-includes/.../javascript.deno.mdx" --body-file P1-40-DOC-D2.md
gh issue create -R getsentry/sentry-docs --title "Show one complete deno run command with all four permission flags in the Deno guide" --body-file P1-41-DOC-D3.md
gh issue create -R getsentry/sentry-docs --title "Add a frameworks page to the Deno guide and Deno notes to four Node framework guides" --body-file P1-42-DOC-D4.md
# gh issue create -R getsentry/sentry-docs --title "Remove the @sentry/cloudflare/nodejs_compat entrypoint from the Cloudflare docs for v11" --body-file P1-43-DOC-C1.md
# gh issue create -R getsentry/sentry-docs --title "Rewrite features/d1.mdx around automatic D1 instrumentation" --body-file P1-44-DOC-C2.md
# gh issue create -R getsentry/sentry-docs --title "Update features/vite-plugin.mdx to the shipped Cloudflare Vite plugin options" --body-file P1-45-DOC-C4.md
# gh issue create -R getsentry/sentry-docs --title "Import wrapRequestHandler from @sentry/cloudflare/request and drop the honoIntegration page" --body-file P1-46-DOC-C5.md
gh issue create -R getsentry/sentry-docs --title "Add a Cloudflare React Router page and fix frameworks/index.mdx and tanstack-start.mdx" --body-file P1-47-DOC-C7.md
# gh issue create -R getsentry/sentry-docs --title "Add the per-runtime channel-instrumentation setup to the v10-to-v11 page" --body-file P1-48-X2.md
gh issue create -R getsentry/sentry-docs --title "Add a runtime-by-framework support matrix for Bun, Deno and Cloudflare" --body-file P1-49-X3.md
gh issue create -R getsentry/sentry-docs --title "Document Hono on Bun: unbundled run and the Bun.build plugin variant" --body-file P1-50-DOC-F1.md
gh issue create -R getsentry/sentry-docs --title "Add a Bun database instrumentation section to the Elysia guide and fix four include statements" --body-file P1-51-DOC-F2.md
gh issue create -R getsentry/sentry-docs --title "Add an Express on Bun page covering the Bun.build plugin step" --body-file P1-52-DOC-F3.md
gh issue create -R getsentry/sentry-docs --title "Add a Fastify on Bun page and split Bun db instrumentation by driver" --body-file P1-53-DOC-F4.md
gh issue create -R getsentry/sentry-docs --title "Add a Koa on Bun page covering the sentryBunPlugin build" --body-file P1-54-DOC-F5.md
gh issue create -R getsentry/sentry-docs --title "Add a Hapi on Bun page covering the sentryBunPlugin build" --body-file P1-55-DOC-F6.md
gh issue create -R getsentry/sentry-docs --title "Add an Oak on Bun page covering the Bun.serve routes map" --body-file P1-56-DOC-F7.md
gh issue create -R getsentry/sentry-docs --title "Add a Fresh on Bun page for the built server output" --body-file P1-57-DOC-F8.md
gh issue create -R getsentry/sentry-docs --title "Add a NestJS on Bun page covering the Bun.build plugin step" --body-file P1-58-DOC-F9.md
gh issue create -R getsentry/sentry-docs --title "Add a Next.js on Bun page for bun --bun, the fetch integration and the channel pin" --body-file P1-59-DOC-F10.md
gh issue create -R getsentry/sentry-docs --title "Add a SvelteKit on Bun page for the adapter-node output" --body-file P1-60-DOC-F12.md
gh issue create -R getsentry/sentry-docs --title "Add a React Router on Bun page requiring the instrumentations export" --body-file P1-61-DOC-F14.md
gh issue create -R getsentry/sentry-docs --title "Document TanStack Start on Bun: verified setup and its limits" --body-file P1-62-DOC-F15.md
gh issue create -R getsentry/sentry-docs --title "Add a Remix v2 on Bun page for the Bun.build server bundle" --body-file P1-63-DOC-F16.md
gh issue create -R getsentry/sentry-docs --title "Add a SolidStart on Bun page with the @sentry/bun integrations" --body-file P1-64-DOC-F17.md
gh issue create -R getsentry/sentry-docs --title "Document the verified Hono on Deno setup and its outgoing fetch limit" --body-file P1-65-DOC-F18.md
gh issue create -R getsentry/sentry-docs --title "Add an Express on Deno page covering the plain setup and the import-hook setup" --body-file P1-66-DOC-F20.md
gh issue create -R getsentry/sentry-docs --title "Add a Fastify on Deno page: full instrumentation without the import hook" --body-file P1-67-DOC-F21.md
gh issue create -R getsentry/sentry-docs --title "Add a Koa on Deno page: instrumentation timing decides what you get" --body-file P1-68-DOC-F22.md
gh issue create -R getsentry/sentry-docs --title "Add a Hapi on Deno page with the three verified wirings" --body-file P1-69-DOC-F23.md
gh issue create -R getsentry/sentry-docs --title "Add an Oak on Deno page: mount with Deno.serve(app.fetch)" --body-file P1-70-DOC-F24.md
gh issue create -R getsentry/sentry-docs --title "Add a Fresh 2 on Deno page: what the SDK does and does not instrument" --body-file P1-71-DOC-F25.md
gh issue create -R getsentry/sentry-docs --title "Add a NestJS on Deno page: the boot workaround decides what you get" --body-file P1-72-DOC-F26.md
gh issue create -R getsentry/sentry-docs --title "Add a Next.js on Deno page and document enableRuntimeChannelInjection" --body-file P1-73-DOC-F27.md
gh issue create -R getsentry/sentry-docs --title "Add a React Router on Deno page with the Deno entry.server and node:http server entry" --body-file P1-74-DOC-F31.md
gh issue create -R getsentry/sentry-docs --title "Add a TanStack Start on Deno page with the Deno entry and noExternals" --body-file P1-75-DOC-F32.md
gh issue create -R getsentry/sentry-docs --title "Add a Remix on Deno page covering installGlobals and the build-time setup" --body-file P1-76-DOC-F33.md
gh issue create -R getsentry/sentry-docs --title "Add a SolidStart on Deno install page and record its instrumentation limits" --body-file P1-77-DOC-F34.md
gh issue create -R getsentry/sentry-docs --title "Document Hono on Cloudflare Workers: compatibility_date and build-time database spans" --body-file P1-78-DOC-F35.md
gh issue create -R getsentry/sentry-docs --title "Add an Express on Cloudflare Workers page built with the Sentry Cloudflare Vite plugin" --body-file P1-79-DOC-F37.md
gh issue create -R getsentry/sentry-docs --title "Note that Fastify does not run on Cloudflare Workers" --body-file P1-80-DOC-F38.md
gh issue create -R getsentry/sentry-docs --title "Add a Koa on Cloudflare Workers page covering the Vite build and module-scope rule" --body-file P1-81-DOC-F39.md
gh issue create -R getsentry/sentry-docs --title "Add a Hapi on Cloudflare Workers page and document build-time instrumentation" --body-file P1-82-DOC-F40.md
gh issue create -R getsentry/sentry-docs --title "Add an Oak on Cloudflare Workers page covering the JSR install and withSentry wiring" --body-file P1-83-DOC-F41.md
gh issue create -R getsentry/sentry-docs --title "Add a Fresh 2 on Cloudflare Workers page with the esbuild orchestrion build step" --body-file P1-84-DOC-F42.md
gh issue create -R getsentry/sentry-docs --title "Add a NestJS on Cloudflare Workers page using the esbuild orchestrion plugin" --body-file P1-85-DOC-F43.md
gh issue create -R getsentry/sentry-docs --title "Document outgoing fetch and database spans for Next.js on Cloudflare Workers" --body-file P1-86-DOC-F44.md
gh issue create -R getsentry/sentry-docs --title "Document server route naming for Nuxt on Cloudflare Workers" --body-file P1-87-DOC-F45.md
gh issue create -R getsentry/sentry-docs --title "Document route naming and database-span setup for SvelteKit on Cloudflare Workers" --body-file P1-88-DOC-F46.md
gh issue create -R getsentry/sentry-docs --title "Add a React Router 7 on Cloudflare Workers page" --body-file P1-89-DOC-F48.md
gh issue create -R getsentry/sentry-docs --title "Add a \"Configure Vite\" step to the TanStack Start on Cloudflare page" --body-file P1-90-DOC-F49.md
gh issue create -R getsentry/sentry-docs --title "Add a SolidStart on Cloudflare Workers page wiring the Nitro output with withSentry" --body-file P1-91-DOC-F51.md
gh issue create -R getsentry/sentry-docs --title "Exclude Cloudflare from the GlobalHandlers integration page" --body-file P1-92-DOC-R4.md
gh issue create -R getsentry/sentry-docs --title "Remove javascript.deno from the trpcMiddleware supported list" --body-file P1-93-DOC-R5.md
gh issue create -R getsentry/sentry-docs --title "Show the database and library integration pages on the Deno guide" --body-file P1-94-DOC-R6.md
gh issue create -R getsentry/sentry-docs --title "Correct where ExtraErrorData writes on the integration page" --body-file P1-95-DOC-R10.md
gh issue create -R getsentry/sentry-docs --title "Replace the invalid rewriteFrames options snippets with runnable code" --body-file P1-96-DOC-R11.md
gh issue create -R getsentry/sentry-docs --title "Enable the provider feature flag pages for Bun" --body-file P1-97-DOC-R12.md
gh issue create -R getsentry/sentry-docs --title "Document that errors inside ctx.waitUntil() are not captured" --body-file P1-98-DOC-R14.md
gh issue create -R getsentry/sentry-docs --title "Document Cloudflare Workflows step error capture on the final attempt" --body-file P1-99-DOC-R15.md
gh issue create -R getsentry/sentry-docs --title "Gate the release health and session APIs away from the Cloudflare guide" --body-file P1-100-DOC-R18.md
gh issue create -R getsentry/sentry-docs --title "Rewrite the tracing verify step for the stream lifecycle on the Node, Bun, Deno and Cloudflare guides" --body-file P1-101-DOC-Q1.md
gh issue create -R getsentry/sentry-docs --title "Say on the Vite plugin page that a wrangler config resolved to the wrong file instruments nothing" --body-file P1-102-DOC-Q2.md
gh issue create -R getsentry/sentry-docs --title "State on the four guides that route names need a framework integration or a routes map" --body-file P1-103-DOC-Q3.md
gh issue create -R getsentry/sentry-docs --title "Restructure the Node install methods for v11: --import as the main path, bundler plus top-level import and --import @sentry/node/import as the alternatives, no CommonJS option" --body-file P1-104-DOC-Q85.md
gh issue create -R getsentry/sentry-docs --title "Match the CDN bundle named on the browser config page to the integrations its snippet uses" --body-file P1-105-DOC-Q8.md
gh issue create -R getsentry/sentry-docs --title "State on the logs pages which browser CDN bundles include Sentry.logger" --body-file P1-106-DOC-Q9.md
gh issue create -R getsentry/sentry-docs --title "Say on the React error boundary page how reactErrorHandler and ErrorBoundary interact on React 19" --body-file P1-107-DOC-Q13.md
gh issue create -R getsentry/sentry-docs --title "Scope the built-in denylist claim on the data-collection include to request data" --body-file P1-108-DOC-Q14.md
gh issue create -R getsentry/sentry-docs --title "Rename the Profiler span ops on the React component monitoring page" --body-file P1-109-DOC-Q15.md
gh issue create -R getsentry/sentry-docs --title "Correct the Vue component tracking page: default hooks, span ops and the duplicate-key snippet" --body-file P1-110-DOC-Q21.md
gh issue create -R getsentry/sentry-docs --title "Make the async tracing verify snippets work on Express 4 and Connect 3, or state what they need" --body-file P1-111-DOC-Q27.md
gh issue create -R getsentry/sentry-docs --title "Correct the first-line import limitation on the esm-without-import page for v11" --body-file P1-112-DOC-Q28.md
gh issue create -R getsentry/sentry-docs --title "Show a working provider for a subclassed SentryErrorHandler on the Angular error handler page" --body-file P1-113-DOC-Q33.md
gh issue create -R getsentry/sentry-docs --title "Rename the component tracking span ops on the Angular page" --body-file P1-114-DOC-Q34.md
gh issue create -R getsentry/sentry-docs --title "Move shouldHandleError to fastifyIntegration on the Fastify error handler page" --body-file P1-115-DOC-Q38.md
gh issue create -R getsentry/sentry-docs --title "Correct the supported Fastify versions on the integration page" --body-file P1-116-DOC-Q39.md
gh issue create -R getsentry/sentry-docs --title "Correct the Svelte component tracking page: span ops, the trackUpdates default and the runes-mode limit" --body-file P1-117-DOC-Q42.md
gh issue create -R getsentry/sentry-docs --title "Qualify the Koa error handler claims on the migration and esm-without-import pages" --body-file P1-118-DOC-Q45.md
gh issue create -R getsentry/sentry-docs --title "Rewrite the Koa integration page around the diagnostics-channel instrumentation" --body-file P1-119-DOC-Q46.md
gh issue create -R getsentry/sentry-docs --title "Rewrite the Hapi integration page and its table row" --body-file P1-120-DOC-Q47.md
gh issue create -R getsentry/sentry-docs --title "Say on the Solid guide that the verify step needs a production build because of the DEV guard" --body-file P1-121-DOC-Q49.md
gh issue create -R getsentry/sentry-docs --title "Add withSentryRouterRouting to the Solid guide's tracing snippet" --body-file P1-122-DOC-Q50.md
gh issue create -R getsentry/sentry-docs --title "Say on the Connect guide that errors need an error-handling middleware, and show it" --body-file P1-123-DOC-Q53.md
gh issue create -R getsentry/sentry-docs --title "Add the runtime import to the Hono tracing verify snippet" --body-file P1-124-DOC-Q54.md
gh issue create -R getsentry/sentry-docs --title "Point the Hono config snippets on the CommonJS, ESM and ESM-without-import pages at @sentry/hono/node" --body-file P1-125-DOC-Q55.md
gh issue create -R getsentry/sentry-docs --title "Say on the NestJS guide that SentryGlobalFilter is required for any HTTP error to be captured, and move it before Verify" --body-file P1-126-DOC-Q59.md
gh issue create -R getsentry/sentry-docs --title "Rewrite the Nest integration page around the diagnostics-channel instrumentation" --body-file P1-127-DOC-Q60.md
gh issue create -R getsentry/sentry-docs --title "Update the Node prerequisite include to the engines range the v11 packages declare" --body-file P1-128-DOC-Q62.md
gh issue create -R getsentry/sentry-docs --title "Say on the WebAssembly guide what the integration needs: a build_id section, a URL-keeping loader and uploaded debug files" --body-file P1-129-DOC-Q63.md
gh issue create -R getsentry/sentry-docs --title "Chain the Elysia verify route before .listen() on the guide" --body-file P1-130-DOC-Q64.md
gh issue create -R getsentry/sentry-docs --title "Correct the default error filter description on the Elysia guide" --body-file P1-131-DOC-Q65.md
gh issue create -R getsentry/sentry-docs --title "Document the built-in mastraIntegration route on the Mastra pages and say the exporter must not be combined with it" --body-file P1-132-DOC-Q67.md
gh issue create -R getsentry/sentry-docs --title "Give the AWS Lambda load step the file name its ESM tab creates" --body-file P1-133-DOC-Q72.md
gh issue create -R getsentry/sentry-docs --title "Say on the Lambda wrapper page that v11 wraps the handler automatically with default options" --body-file P1-134-DOC-Q73.md
gh issue create -R getsentry/sentry-docs --title "Show the capture a failed effect needs on the Effect guide" --body-file P1-135-DOC-Q76.md
gh issue create -R getsentry/sentry-docs --title "Correct the Nitro error-capture and span claims" --body-file P1-136-DOC-Q79.md
gh issue create -R getsentry/sentry-docs --title "Use normalizedRequest in the Azure Functions request-context snippets" --body-file P1-137-DOC-Q81.md
gh issue create -R getsentry/sentry-docs --title "Say which Next.js errors global-error.tsx and _error.tsx capture and which come from onRequestError" --body-file P1-138-DOC-Q88.md
gh issue create -R getsentry/sentry-docs --title "Replace the --import instructions on the Nuxt manual-setup and cli-import pages with the bundled server config" --body-file P1-139-DOC-Q90.md
gh issue create -R getsentry/sentry-docs --title "Say on the SvelteKit page that a custom handleErrorWithSentry handler marks errors as handled" --body-file P1-140-DOC-Q93.md
gh issue create -R getsentry/sentry-docs --title "Print the Vite template's start command on the Remix page" --body-file P1-141-DOC-Q96.md
gh issue create -R getsentry/sentry-docs --title "Correct the captureActionFormDataKeys description on the Remix page" --body-file P1-142-DOC-Q97.md
gh issue create -R getsentry/sentry-docs --title "Fix Bun guide hygiene: version floor, Hono install command, v7 wording" --body-file P2-143-DOC-B4.md
gh issue create -R getsentry/sentry-docs --title "Rewrite the three Deno v7-to-v8 migration includes that are copies of the Bun ones" --body-file P2-144-DOC-D5.md
gh issue create -R getsentry/sentry-docs --title "Show deno add and an import map in the Deno guide's install step" --body-file P2-145-DOC-D6.md
# gh issue create -R getsentry/sentry-docs --title "Add the four missing Cloudflare SdkOption entries and drop the deprecated enableRpcTracePropagation block" --body-file P2-146-DOC-C3.md
gh issue create -R getsentry/sentry-docs --title "Add a bindings table to the Cloudflare features/index.mdx" --body-file P2-147-DOC-C6.md
gh issue create -R getsentry/sentry-docs --title "Fix snippet errors across the Cloudflare includes and framework pages" --body-file P2-148-DOC-C8.md
gh issue create -R getsentry/sentry-docs --title "Fix \"Tracing is enabled by default\" in the Bun, Deno and Cloudflare enable-tracing includes" --body-file P2-149-X1.md
gh issue create -R getsentry/sentry-docs --title "Confirm tested versions and database spans on the Astro on Cloudflare page" --body-file P2-150-DOC-F47.md
gh issue create -R getsentry/sentry-docs --title "Add Deno and Cloudflare to the OpenTelemetry overview and API pages" --body-file P2-151-DOC-R7.md
gh issue create -R getsentry/sentry-docs --title "Fix removed integration names in the Bun and Deno v7 migration tables" --body-file P2-152-DOC-R8.md
gh issue create -R getsentry/sentry-docs --title "Document the Durable Object WebSocket and alarm instrumentation" --body-file P2-153-DOC-R16.md
gh issue create -R getsentry/sentry-docs --title "Add deno serve to the Deno guide run commands" --body-file P2-154-DOC-R17.md
gh issue create -R getsentry/sentry-docs --title "Note that the root Pages middleware also spans static asset requests" --body-file P2-155-DOC-R19.md
gh issue create -R getsentry/sentry-docs --title "Explain the channel-injection warnings on the Bun guide" --body-file P2-156-DOC-Q4.md
gh issue create -R getsentry/sentry-docs --title "Update the Node getting-started page for --require and for first-line ESM imports" --body-file P2-157-DOC-Q5.md
gh issue create -R getsentry/sentry-docs --title "Say on the Cloudflare guide that readable stack traces need the source maps step" --body-file P2-158-DOC-Q6.md
gh issue create -R getsentry/sentry-docs --title "Say on the browser config page that the sample tracePropagationTargets matches localhost only" --body-file P2-159-DOC-Q10.md
gh issue create -R getsentry/sentry-docs --title "Tell browser readers to wait before triggering the verify error if they expect a replay" --body-file P2-160-DOC-Q11.md
gh issue create -R getsentry/sentry-docs --title "Move the React guide routing snippet to the version-agnostic React Router API" --body-file P2-161-DOC-Q16.md
gh issue create -R getsentry/sentry-docs --title "Rewrite the React verify step for the stream lifecycle and fix the test span" --body-file P2-162-DOC-Q17.md
gh issue create -R getsentry/sentry-docs --title "Say on the React, Vue, Angular, Svelte, Solid and WebAssembly guides that release health sessions need a release" --body-file P2-163-DOC-Q18.md
gh issue create -R getsentry/sentry-docs --title "Rewrite the Vue guide and its feature pages for the stream lifecycle" --body-file P2-164-DOC-Q22.md
gh issue create -R getsentry/sentry-docs --title "Fix the late-initialization and multiple-apps snippets on the Vue pages" --body-file P2-165-DOC-Q23.md
gh issue create -R getsentry/sentry-docs --title "Say on the Vue guide that the component context of the verify error appears in production builds" --body-file P2-166-DOC-Q24.md
gh issue create -R getsentry/sentry-docs --title "Drop the deprecated setup*ErrorHandler calls from the Express, Fastify, Koa and Hapi getting-started snippets" --body-file P2-167-DOC-Q29.md
gh issue create -R getsentry/sentry-docs --title "Add an expressIntegration page to the integrations directory" --body-file P2-168-DOC-Q30.md
gh issue create -R getsentry/sentry-docs --title "Fix the empty capture-errors include and the orphaned includes on the Express guide" --body-file P2-169-DOC-Q31.md
gh issue create -R getsentry/sentry-docs --title "Rewrite the Angular manual-setup verify and tracing text for the stream lifecycle" --body-file P2-170-DOC-Q35.md
gh issue create -R getsentry/sentry-docs --title "Fix the Angular pages' deprecated bootstrap call, the missing logs onboarding option and the stray export" --body-file P2-171-DOC-Q36.md
gh issue create -R getsentry/sentry-docs --title "Rewrite the Fastify integration page around the diagnostics-channel instrumentation and its options" --body-file P2-172-DOC-Q40.md
gh issue create -R getsentry/sentry-docs --title "Rewrite the Svelte verify and tracing text for the stream lifecycle and fix the compilerOptions placeholder" --body-file P2-173-DOC-Q43.md
gh issue create -R getsentry/sentry-docs --title "Fix the TanStack Router snippet fence and the transactions wording on the Solid pages" --body-file P2-174-DOC-Q51.md
gh issue create -R getsentry/sentry-docs --title "Add the missing details to the Hono guide: catch-all naming, middleware options, error filter semantics and the node-server dependency" --body-file P2-175-DOC-Q56.md
gh issue create -R getsentry/sentry-docs --title "Say what SentryModule does on the NestJS guide, fix the transactions wording and describe the span sets" --body-file P2-176-DOC-Q61.md
gh issue create -R getsentry/sentry-docs --title "Rewrite the Elysia instrumentation include for v11 and add the Node run details" --body-file P2-177-DOC-Q66.md
gh issue create -R getsentry/sentry-docs --title "Correct the attribute list, the defaults and the trace shape on the Mastra pages" --body-file P2-178-DOC-Q68.md
gh issue create -R getsentry/sentry-docs --title "Add the missing details to the Google Cloud Functions guide: promise-form handlers, the two-trace split, a local run step, the logs option and consistent export names" --body-file P2-179-DOC-Q70.md
gh issue create -R getsentry/sentry-docs --title "Add the missing details to the AWS Lambda pages" --body-file P2-180-DOC-Q74.md
gh issue create -R getsentry/sentry-docs --title "Add the missing details to the Effect guide" --body-file P2-181-DOC-Q77.md
gh issue create -R getsentry/sentry-docs --title "Add the missing details to the Nitro guide" --body-file P2-182-DOC-Q80.md
gh issue create -R getsentry/sentry-docs --title "Add the missing details to the Azure Functions guide" --body-file P2-183-DOC-Q82.md
gh issue create -R getsentry/sentry-docs --title "Add the missing Pages details to the Cloudflare guide and its config include" --body-file P2-184-DOC-Q84.md
gh issue create -R getsentry/sentry-docs --title "Add the missing details to the Next.js manual-setup page" --body-file P2-185-DOC-Q89.md
gh issue create -R getsentry/sentry-docs --title "Add the missing details to the Nuxt pages" --body-file P2-186-DOC-Q91.md
gh issue create -R getsentry/sentry-docs --title "Add the missing details to the SvelteKit manual-setup and build pages" --body-file P2-187-DOC-Q94.md
gh issue create -R getsentry/sentry-docs --title "Add the missing details to the Remix page" --body-file P2-188-DOC-Q98.md
