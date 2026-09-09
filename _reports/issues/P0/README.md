# P0 issue drafts

Fourteen drafts for `getsentry/sentry-docs`, in the suggested filing order. Each `.md` file is an issue body; the title is in the table. `create.sh` files them with the GitHub CLI and was not run.

| # | File | Title | Type | Audit item |
| --- | --- | --- | --- | --- |
| 1 | `01-DOC-Q7.md` | Fix the tracing verify snippet on the browser getting-started page: await inside a non-async function | docs-change | DOC-Q7 |
| 2 | `02-DOC-Q12.md` | Fix the React Router v6 and v7 page snippets that fail on React 19 | docs-change | DOC-Q12 |
| 3 | `03-DOC-Q19.md` | Add a Vue 3 example to the Vue Router instrumentation page | docs-change | DOC-Q19 |
| 4 | `04-DOC-Q20.md` | Add the missing comma to the tracingOptions.hooks snippet on the Vue component tracking page | docs-change | DOC-Q20 |
| 5 | `05-DOC-Q25.md` | Fix the extensionless instrument import on the Express, Fastify, Koa, Hapi and Connect guides and the esm-without-import page | docs-change | DOC-Q25 |
| 6 | `06-DOC-Q26.md` | Rewrite or remove the late-initialization install page for v11 | docs-change | DOC-Q26 |
| 7 | `07-DOC-Q32.md` | Fix the Angular manual-setup, error handler and component tracking snippets that fail to build | docs-change | DOC-Q32 |
| 8 | `08-DOC-Q37.md` | Fix the Fastify error handler page: @sentry/fastify does not exist and fastify() is never imported | docs-change | DOC-Q37 |
| 9 | `09-DOC-Q41.md` | Change onClick to onclick in the Svelte v5 tab of the tracing verify snippet | docs-change | DOC-Q41 |
| 10 | `10-DOC-Q44.md` | Add the router to the Koa getting-started snippets that the verify step relies on | docs-change | DOC-Q44 |
| 11 | `11-DOC-Q48.md` | State on the Solid guide that the tracing snippet requires @solidjs/router | docs-change | DOC-Q48 |
| 12 | `12-DOC-Q52.md` | Rewrite the Connect guide and integration page for v11, whose SDK has no Connect instrumentation | docs-change | DOC-Q52 |
| 13 | `13-DOC-Q57.md` | Fix the NestJS tracing verify snippet: its delayed throw is an uncaught exception that exits the app | docs-change | DOC-Q57 |
| 14 | `14-DOC-Q58.md` | Replace the NestJS ESM start script with a command that runs | docs-change | DOC-Q58 |
| 15 | `15-DOC-Q69.md` | Fix the nonexistent exports on the Google Cloud Functions pages: wrapBackgroundFunction, pgIntegration and ioredisIntegration | docs-change | DOC-Q69 |
| 16 | `16-DOC-Q71.md` | Fix the stray parenthesis in the AWS Lambda ESM verify handler and Promise.rejected on the wrapper page | docs-change | DOC-Q71 |
| 17 | `17-DOC-Q75.md` | Drop the metrics layer from the Effect v3 snippet, or say it needs Effect v4 | docs-change | DOC-Q75 |
| 18 | `18-DOC-Q78.md` | Fix the Nitro guide's version claim and add serverDir to its config | docs-change | DOC-Q78 |
| 19 | `19-DOC-Q83.md` | Add the SDK import to the Cloudflare Pages tracing verify snippet | docs-change | DOC-Q83 |
| 20 | `20-DOC-B1.md` | Rewrite the Bun guide's instrumentation step around @sentry/bun/plugin | docs-change | DOC-B1 |
| 21 | `21-DOC-R1.md` | Fix inverted traceLifecycle default in the stream mode includes | docs-change | DOC-R1 |
| 22 | `22-DOC-R2.md` | Stop recommending denoCronIntegration() on the Deno crons page | docs-change | DOC-R2 |
| 23 | `23-DOC-R20.md` | Delete the Bun OpenTelemetry setup includes and drop Bun from custom-setup | docs-change | DOC-R20 |
| 24 | `24-DOC-R13.md` | Correct the Agents SDK span attribute and conversation ID claims | docs-change | DOC-R13 |
| 25 | `25-DOC-F50.md` | Rewrite the Remix on Cloudflare page for Workers and fix the Vite plugin options | docs-change | DOC-F50 |
| 26 | `26-DOC-F36.md` | Add an Elysia on Cloudflare Workers page and drop the Bun/Node-only runtime claim | new-page | DOC-F36 |
| 27 | `27-DOC-F19.md` | Document Elysia on Deno: init from @sentry/deno, or add denoServeIntegration | docs-change | DOC-F19 |
| 28 | `28-DOC-F11.md` | Add a Bun section to the Nuxt Nitro deployment presets page | docs-change | DOC-F11 |
| 29 | `29-DOC-F28.md` | Correct the Nuxt Nitro preset page for Deno: keep the node-server preset | docs-change | DOC-F28 |
| 30 | `30-DOC-F13.md` | Name Bun in the Astro runtime alert and add a Running on Bun section | docs-change | DOC-F13 |
| 31 | `31-DOC-F30.md` | Correct the Astro runtime note: Deno with @deno/astro-adapter works | docs-change | DOC-F30 |
| 32 | `32-DOC-F29.md` | Correct the SvelteKit adapter note: adapter-node runs on Deno | docs-change | DOC-F29 |
