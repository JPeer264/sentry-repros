Docs changes for the Hapi guide that a new user hits between install and the first event on v11, from the runtime docs audit (develop `03aaf42455` and `6f2da7483d`, docs `aebda0ee4`). Each item links to its issue draft in the secret gist (https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21); the reproductions are [`quickstarts/hapi/`](<https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/hapi>) in the audit repository.

## Must land

None.

## Should land

- [ ] **P1** · DOC-Q47 · The Hapi integration page names the wrong mechanism and no option, and its table row says no errors
  `common/configuration/integrations/hapi.mdx:21` says the integration captures spans using `@opentelemetry/instrumentation-hapi`; that package is not installed, and every span has origin `auto.http.hapi` from the SDK's own diagnostics-channel instrumentation of `@hapi/hapi/lib/server.js`. `:19-27` say the integration is enabled when performance monitoring is enabled and show no option; with no `tracesSampleRate` it is still installed and captured the same four errors (`auto.function.hapi`), and `hapiIntegration({ shouldHandleError(error, request) })` exists and is invoked, which neither this page nor `common/migration/v10-to-v11/index.mdx:722` (Express and Fastify only) documents. The integrations table include `platform-includes/configuration/integrations/javascript.hapi.mdx:12` leaves the Errors column empty for `hapiIntegration`, although it is what captures Hapi errors on develop.
  One limit the page should state: Hapi emits its request error channel only for 500 responses (`@hapi/hapi/lib/request.js:511-515`), so `Boom.notFound` and `Boom.serverUnavailable` thrown from handlers never reach Sentry even with `shouldHandleError: () => true`; plain throws and `Boom.badImplementation` are captured.
  **Change:** Describe the diagnostics-channel mechanism, say the integration is always on and captures errors with or without tracing, add the `shouldHandleError` option and the 500-only limit, tick the Errors column in the table row, and list `hapiIntegration` at migration `:722`.
  Draft: [Rewrite the Hapi integration page and its table row](<https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21#122-rewrite-the-hapi-integration-page-and-its-table-row>)
