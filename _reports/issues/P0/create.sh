#!/usr/bin/env bash
# Creates the P0 issues in getsentry/sentry-docs. Not executed by the audit; run it yourself when the drafts are final.
set -euo pipefail
cd "$(dirname "$0")"

gh issue create -R getsentry/sentry-docs --title "Fix the tracing verify snippet on the browser getting-started page: await inside a non-async function" --body-file 01-DOC-Q7.md
gh issue create -R getsentry/sentry-docs --title "Fix the React Router v6 and v7 page snippets that fail on React 19" --body-file 02-DOC-Q12.md
gh issue create -R getsentry/sentry-docs --title "Add a Vue 3 example to the Vue Router instrumentation page" --body-file 03-DOC-Q19.md
gh issue create -R getsentry/sentry-docs --title "Add the missing comma to the tracingOptions.hooks snippet on the Vue component tracking page" --body-file 04-DOC-Q20.md
gh issue create -R getsentry/sentry-docs --title "Fix the extensionless instrument import on the Express and Fastify guides and the esm-without-import page" --body-file 05-DOC-Q25.md
gh issue create -R getsentry/sentry-docs --title "Rewrite or remove the late-initialization install page for v11" --body-file 06-DOC-Q26.md
gh issue create -R getsentry/sentry-docs --title "Fix the Angular manual-setup, error handler and component tracking snippets that fail to build" --body-file 07-DOC-Q32.md
gh issue create -R getsentry/sentry-docs --title "Fix the Fastify error handler page: @sentry/fastify does not exist and fastify() is never imported" --body-file 08-DOC-Q37.md
gh issue create -R getsentry/sentry-docs --title "Change onClick to onclick in the Svelte v5 tab of the tracing verify snippet" --body-file 09-DOC-Q41.md
gh issue create -R getsentry/sentry-docs --title "Rewrite the Bun guide's instrumentation step around @sentry/bun/plugin" --body-file 10-DOC-B1.md
gh issue create -R getsentry/sentry-docs --title "Fix inverted traceLifecycle default in the stream mode includes" --body-file 11-DOC-R1.md
gh issue create -R getsentry/sentry-docs --title "Stop recommending denoCronIntegration() on the Deno crons page" --body-file 12-DOC-R2.md
gh issue create -R getsentry/sentry-docs --title "Delete the Bun OpenTelemetry setup includes and drop Bun from custom-setup" --body-file 13-DOC-R20.md
gh issue create -R getsentry/sentry-docs --title "Correct the Agents SDK span attribute and conversation ID claims" --body-file 14-DOC-R13.md
gh issue create -R getsentry/sentry-docs --title "Rewrite the Remix on Cloudflare page for Workers and fix the Vite plugin options" --body-file 15-DOC-F50.md
gh issue create -R getsentry/sentry-docs --title "Add an Elysia on Cloudflare Workers page and drop the Bun/Node-only runtime claim" --body-file 16-DOC-F36.md
gh issue create -R getsentry/sentry-docs --title "Document Elysia on Deno: init from @sentry/deno, or add denoServeIntegration" --body-file 17-DOC-F19.md
gh issue create -R getsentry/sentry-docs --title "Add a Bun section to the Nuxt Nitro deployment presets page" --body-file 18-DOC-F11.md
gh issue create -R getsentry/sentry-docs --title "Correct the Nuxt Nitro preset page for Deno: keep the node-server preset" --body-file 19-DOC-F28.md
gh issue create -R getsentry/sentry-docs --title "Name Bun in the Astro runtime alert and add a Running on Bun section" --body-file 20-DOC-F13.md
gh issue create -R getsentry/sentry-docs --title "Correct the Astro runtime note: Deno with @deno/astro-adapter works" --body-file 21-DOC-F30.md
gh issue create -R getsentry/sentry-docs --title "Correct the SvelteKit adapter note: adapter-node runs on Deno" --body-file 22-DOC-F29.md
