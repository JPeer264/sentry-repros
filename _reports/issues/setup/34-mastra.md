Docs changes for the Mastra guide that a new user hits between install and the first event on v11, from the runtime docs audit (develop `03aaf42455` and `6f2da7483d`, docs `aebda0ee4`). Each item links to its issue draft in the secret gist (https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21); the reproductions are [`quickstarts/mastra/`](<https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/mastra>) in the audit repository.

## Must land

None.

## Should land

- [ ] **P1** · DOC-Q67 · The built-in mastraIntegration is undocumented and combining it with the exporter duplicates every span
  `guides/mastra/index.mdx:17-19`, `:47` and `:85-91` and `common/agent-tracing/mastra.mdx:55` present `@mastra/sentry` as the way to send Mastra data to Sentry, and tell apps that already call `Sentry.init` to confirm that the two setups are compatible. On develop `@sentry/node` ships a default `mastraIntegration` (Mastra is among the 46 installed integrations) that instruments `@mastra/core` on its own under `--import`: `gen_ai.invoke_agent`, `gen_ai.chat` and `gen_ai.execute_tool` spans with token usage, no exporter needed. With both present the SDK prints `Remove @mastra/sentry from your Mastra exporters`, installs every integration twice (92), replaces the app client with the exporter's, and duplicates every gen_ai span. The exporter also pins the `@sentry/node` version (`@mastra/sentry` 1.2.16 requires `^10.68.0`), which neither page says.
  **Change:** Document the built-in route (`Sentry.init` plus `--import`, no `@mastra/sentry`) for apps that already initialize Sentry, state that the exporter and the integration must not be combined, and say that `@mastra/sentry` decides the `@sentry/node` version.
  Draft: [Document the built-in mastraIntegration route on the Mastra pages and say the exporter must not be combined with it](<https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21#133-document-the-built-in-mastraintegration-route-on-the-mastra-pages-and-say-the-exporter-must-not-be-combined-with-it>)
