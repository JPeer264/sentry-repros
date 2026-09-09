Docs changes for the Google Cloud Functions guide that a new user hits between install and the first event on v11, from the runtime docs audit (develop `03aaf42455` and `6f2da7483d`, docs `aebda0ee4`). Each item links to its issue draft in the secret gist (https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21); the reproductions are [`quickstarts/gcp-functions/`](<https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/gcp-functions>) in the audit repository.

## Must land

- [ ] **P0** · DOC-Q69 · Three exports that do not exist: wrapBackgroundFunction, pgIntegration, ioredisIntegration
  `guides/gcp-functions/index.mdx:102` and `:145` (the Background tabs of Verify and Tracing) call `Sentry.wrapBackgroundFunction(...)`. The package exports `wrapHttpFunction`, `wrapEventFunction` and `wrapCloudEventFunction` only; the Functions Framework fails to load the file with `TypeError: Sentry.wrapBackgroundFunction is not a function` and exits. The config include (`platform-includes/getting-started-config/javascript.gcp-functions.mdx:71`) already uses `wrapEventFunction`, which works.
  `guides/gcp-functions/tracing/instrumentation/automatic-instrumentation.mdx:31` and `:35` add database instrumentation with `Sentry.pgIntegration()` and `Sentry.ioredisIntegration()`. Neither exists; the package re-exports `postgresIntegration` and `redisIntegration` from `@sentry/node`, and the snippet throws before `Sentry.init` runs.
  **Change:** Rename both Background tabs to `Sentry.wrapEventFunction`, and replace `pgIntegration()` and `ioredisIntegration()` with `postgresIntegration()` and `redisIntegration()`.
  Draft: [Fix the nonexistent exports on the Google Cloud Functions pages: wrapBackgroundFunction, pgIntegration and ioredisIntegration](<https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21#15-fix-the-nonexistent-exports-on-the-google-cloud-functions-pages-wrapbackgroundfunction-pgintegration-and-ioredisintegration>)

## Should land

None.
