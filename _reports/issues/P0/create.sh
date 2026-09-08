#!/usr/bin/env bash
# Creates the 14 P0 issues in getsentry/sentry-docs. Not executed by the audit; run it yourself when the drafts are final.
set -euo pipefail
cd "$(dirname "$0")"

gh issue create -R getsentry/sentry-docs --title "Rewrite the Bun guide's instrumentation step around @sentry/bun/plugin" --body-file 01-DOC-B1.md
gh issue create -R getsentry/sentry-docs --title "Fix inverted traceLifecycle default in the stream mode includes" --body-file 02-DOC-R1.md
gh issue create -R getsentry/sentry-docs --title "Stop recommending denoCronIntegration() on the Deno crons page" --body-file 03-DOC-R2.md
gh issue create -R getsentry/sentry-docs --title "Rewrite the Bun OpenTelemetry setup includes against develop" --body-file 04-DOC-R20.md
gh issue create -R getsentry/sentry-docs --title "Correct the Agents SDK span attribute and conversation ID claims" --body-file 05-DOC-R13.md
gh issue create -R getsentry/sentry-docs --title "Document the instrument.server file and the wranglerConfigPath requirement on the Cloudflare Vite plugin page" --body-file 06-DOC-Q2.md
gh issue create -R getsentry/sentry-docs --title "Rewrite the Remix on Cloudflare page for Workers and fix the Vite plugin options" --body-file 07-DOC-F50.md
gh issue create -R getsentry/sentry-docs --title "Add an Elysia on Cloudflare Workers page and drop the Bun/Node-only runtime claim" --body-file 08-DOC-F36.md
gh issue create -R getsentry/sentry-docs --title "Document Elysia on Deno: init from @sentry/deno, keep withElysia" --body-file 09-DOC-F19.md
gh issue create -R getsentry/sentry-docs --title "Add a Bun section to the Nuxt Nitro deployment presets page" --body-file 10-DOC-F11.md
gh issue create -R getsentry/sentry-docs --title "Correct the Nuxt Nitro preset page for Deno: keep the node-server preset" --body-file 11-DOC-F28.md
gh issue create -R getsentry/sentry-docs --title "Name Bun in the Astro runtime alert and add a Running on Bun section" --body-file 12-DOC-F13.md
gh issue create -R getsentry/sentry-docs --title "Correct the Astro runtime note: Deno with @deno/astro-adapter works" --body-file 13-DOC-F30.md
gh issue create -R getsentry/sentry-docs --title "Correct the SvelteKit adapter note: adapter-node runs on Deno" --body-file 14-DOC-F29.md
