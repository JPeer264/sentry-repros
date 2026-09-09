# P0 issue drafts

Fourteen drafts for `getsentry/sentry-docs`, in the suggested filing order. Each `.md` file is an issue body; the title is in the table. `create.sh` files them with the GitHub CLI and was not run.

| # | File | Title | Type | Audit item |
| --- | --- | --- | --- | --- |
| 1 | `01-DOC-Q7.md` | Fix the tracing verify snippet on the browser getting-started page: await inside a non-async function | docs-change | DOC-Q7 |
| 2 | `02-DOC-Q12.md` | Fix the React Router v6 and v7 page snippets that fail on React 19 | docs-change | DOC-Q12 |
| 3 | `03-DOC-Q19.md` | Add a Vue 3 example to the Vue Router instrumentation page | docs-change | DOC-Q19 |
| 4 | `04-DOC-Q20.md` | Add the missing comma to the tracingOptions.hooks snippet on the Vue component tracking page | docs-change | DOC-Q20 |
| 5 | `05-DOC-Q25.md` | Fix the extensionless instrument import on the Express guide and the esm-without-import page | docs-change | DOC-Q25 |
| 6 | `06-DOC-Q26.md` | Rewrite or remove the late-initialization install page for v11 | docs-change | DOC-Q26 |
| 7 | `07-DOC-B1.md` | Rewrite the Bun guide's instrumentation step around @sentry/bun/plugin | docs-change | DOC-B1 |
| 8 | `08-DOC-R1.md` | Fix inverted traceLifecycle default in the stream mode includes | docs-change | DOC-R1 |
| 9 | `09-DOC-R2.md` | Stop recommending denoCronIntegration() on the Deno crons page | docs-change | DOC-R2 |
| 10 | `10-DOC-R20.md` | Delete the Bun OpenTelemetry setup includes and drop Bun from custom-setup | docs-change | DOC-R20 |
| 11 | `11-DOC-R13.md` | Correct the Agents SDK span attribute and conversation ID claims | docs-change | DOC-R13 |
| 12 | `12-DOC-F50.md` | Rewrite the Remix on Cloudflare page for Workers and fix the Vite plugin options | docs-change | DOC-F50 |
| 13 | `13-DOC-F36.md` | Add an Elysia on Cloudflare Workers page and drop the Bun/Node-only runtime claim | new-page | DOC-F36 |
| 14 | `14-DOC-F19.md` | Document Elysia on Deno: init from @sentry/deno, or add denoServeIntegration | docs-change | DOC-F19 |
| 15 | `15-DOC-F11.md` | Add a Bun section to the Nuxt Nitro deployment presets page | docs-change | DOC-F11 |
| 16 | `16-DOC-F28.md` | Correct the Nuxt Nitro preset page for Deno: keep the node-server preset | docs-change | DOC-F28 |
| 17 | `17-DOC-F13.md` | Name Bun in the Astro runtime alert and add a Running on Bun section | docs-change | DOC-F13 |
| 18 | `18-DOC-F30.md` | Correct the Astro runtime note: Deno with @deno/astro-adapter works | docs-change | DOC-F30 |
| 19 | `19-DOC-F29.md` | Correct the SvelteKit adapter note: adapter-node runs on Deno | docs-change | DOC-F29 |
