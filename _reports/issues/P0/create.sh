#!/usr/bin/env bash
# Creates the P0 issues in getsentry/sentry-docs. Not executed by the audit; run it yourself when the drafts are final.
set -euo pipefail
cd "$(dirname "$0")"

gh issue create -R getsentry/sentry-docs --title "Fix the tracing verify snippet on the browser getting-started page: await inside a non-async function" --body-file 01-DOC-Q7.md
gh issue create -R getsentry/sentry-docs --title "Fix the React Router v6 and v7 page snippets that fail on React 19" --body-file 02-DOC-Q12.md
gh issue create -R getsentry/sentry-docs --title "Add a Vue 3 example to the Vue Router instrumentation page" --body-file 03-DOC-Q19.md
gh issue create -R getsentry/sentry-docs --title "Add the missing comma to the tracingOptions.hooks snippet on the Vue component tracking page" --body-file 04-DOC-Q20.md
gh issue create -R getsentry/sentry-docs --title "Fix the extensionless instrument import on the Express, Fastify, Koa, Hapi and Connect guides and the esm-without-import page" --body-file 05-DOC-Q25.md
gh issue create -R getsentry/sentry-docs --title "Rewrite or remove the late-initialization install page for v11" --body-file 06-DOC-Q26.md
gh issue create -R getsentry/sentry-docs --title "Fix the Angular manual-setup, error handler and component tracking snippets that fail to build" --body-file 07-DOC-Q32.md
gh issue create -R getsentry/sentry-docs --title "Fix the Fastify error handler page: @sentry/fastify does not exist and fastify() is never imported" --body-file 08-DOC-Q37.md
gh issue create -R getsentry/sentry-docs --title "Change onClick to onclick in the Svelte v5 tab of the tracing verify snippet" --body-file 09-DOC-Q41.md
gh issue create -R getsentry/sentry-docs --title "Add the router to the Koa getting-started snippets that the verify step relies on" --body-file 10-DOC-Q44.md
gh issue create -R getsentry/sentry-docs --title "State on the Solid guide that the tracing snippet requires @solidjs/router" --body-file 11-DOC-Q48.md
gh issue create -R getsentry/sentry-docs --title "Rewrite the Connect guide and integration page for v11, whose SDK has no Connect instrumentation" --body-file 12-DOC-Q52.md
gh issue create -R getsentry/sentry-docs --title "Fix the NestJS tracing verify snippet: its delayed throw is an uncaught exception that exits the app" --body-file 13-DOC-Q57.md
gh issue create -R getsentry/sentry-docs --title "Replace the NestJS ESM start script with a command that runs" --body-file 14-DOC-Q58.md
gh issue create -R getsentry/sentry-docs --title "Fix the nonexistent exports on the Google Cloud Functions pages: wrapBackgroundFunction, pgIntegration and ioredisIntegration" --body-file 15-DOC-Q69.md
gh issue create -R getsentry/sentry-docs --title "Fix the stray parenthesis in the AWS Lambda ESM verify handler and Promise.rejected on the wrapper page" --body-file 16-DOC-Q71.md
gh issue create -R getsentry/sentry-docs --title "Drop the metrics layer from the Effect v3 snippet, or say it needs Effect v4" --body-file 17-DOC-Q75.md
gh issue create -R getsentry/sentry-docs --title "Fix the Nitro guide's version claim and add serverDir to its config" --body-file 18-DOC-Q78.md
gh issue create -R getsentry/sentry-docs --title "Add the SDK import to the Cloudflare Pages tracing verify snippet" --body-file 19-DOC-Q83.md
gh issue create -R getsentry/sentry-docs --title "Fix the Pages Router manual-setup page: instrumentation-client.ts for Turbopack and the instrumentation.ts step" --body-file 20-DOC-Q87.md
gh issue create -R getsentry/sentry-docs --title "Import sentrySvelteKit from @sentry/sveltekit/vite in the SvelteKit getting-started snippets" --body-file 21-DOC-Q92.md
gh issue create -R getsentry/sentry-docs --title "Fix the Remix entry.server snippet with two handleError exports and the vite.config import of an uninstalled package" --body-file 22-DOC-Q95.md
gh issue create -R getsentry/sentry-docs --title "Add nitro to the TanStack Start vite.config snippet, or print the commands for a plain Vite build" --body-file 23-DOC-Q101.md
gh issue create -R getsentry/sentry-docs --title "Add a SolidStart 2 setup to the SolidStart guide: the Vite plugin, the start command and the middleware import path" --body-file 24-DOC-Q103.md
gh issue create -R getsentry/sentry-docs --title "Show only the two additions to app.js on the Ember guide instead of a whole file" --body-file 25-DOC-Q107.md
gh issue create -R getsentry/sentry-docs --title "Fix the instrument import path in the React Router entry.server snippet" --body-file 26-DOC-Q111.md
gh issue create -R getsentry/sentry-docs --title "Rewrite the Bun guide's instrumentation step around @sentry/bun/plugin" --body-file 27-DOC-B1.md
gh issue create -R getsentry/sentry-docs --title "Fix inverted traceLifecycle default in the stream mode includes" --body-file 28-DOC-R1.md
gh issue create -R getsentry/sentry-docs --title "Stop recommending denoCronIntegration() on the Deno crons page" --body-file 29-DOC-R2.md
gh issue create -R getsentry/sentry-docs --title "Delete the Bun OpenTelemetry setup includes and drop Bun from custom-setup" --body-file 30-DOC-R20.md
gh issue create -R getsentry/sentry-docs --title "Correct the Agents SDK span attribute and conversation ID claims" --body-file 31-DOC-R13.md
gh issue create -R getsentry/sentry-docs --title "Rewrite the Remix on Cloudflare page for Workers and fix the Vite plugin options" --body-file 32-DOC-F50.md
gh issue create -R getsentry/sentry-docs --title "Add an Elysia on Cloudflare Workers page and drop the Bun/Node-only runtime claim" --body-file 33-DOC-F36.md
gh issue create -R getsentry/sentry-docs --title "Document Elysia on Deno: init from @sentry/deno, or add denoServeIntegration" --body-file 34-DOC-F19.md
gh issue create -R getsentry/sentry-docs --title "Add a Bun section to the Nuxt Nitro deployment presets page" --body-file 35-DOC-F11.md
gh issue create -R getsentry/sentry-docs --title "Correct the Nuxt Nitro preset page for Deno: keep the node-server preset" --body-file 36-DOC-F28.md
gh issue create -R getsentry/sentry-docs --title "Name Bun in the Astro runtime alert and add a Running on Bun section" --body-file 37-DOC-F13.md
gh issue create -R getsentry/sentry-docs --title "Correct the Astro runtime note: Deno with @deno/astro-adapter works" --body-file 38-DOC-F30.md
gh issue create -R getsentry/sentry-docs --title "Correct the SvelteKit adapter note: adapter-node runs on Deno" --body-file 39-DOC-F29.md
