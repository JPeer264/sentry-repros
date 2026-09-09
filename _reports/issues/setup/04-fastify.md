Docs changes for the Fastify guide that a new user hits between install and the first event on v11, from the runtime docs audit (develop `03aaf42455` and `6f2da7483d`, docs `aebda0ee4`). Each item links to its issue draft in the secret gist (https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21); the reproductions are [`quickstarts/fastify/`](<https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/fastify>) in the audit repository.

## Must land

- [ ] **P0** · DOC-Q37 · The Fastify error handler page imports from a package that does not exist
  `guides/fastify/features/error-handler.mdx:14` reads `import { setupFastifyErrorHandler } from "@sentry/fastify";`. No such package exists, in the develop tarballs or in the monorepo's `packages/`: the snippet fails with `ERR_MODULE_NOT_FOUND: Cannot find package '@sentry/fastify'`. It also calls `fastify()` at `:16` without importing it.
  **Change:** Import from `@sentry/node` and add the `fastify` import, or retire the page in favour of the `fastifyIntegration` options. Linear SDK-1482 rewrites this page around `fastifyIntegration({ shouldHandleError })` and does not mention the import.
  Note: same page as SDK-1482, which does not list the @sentry/fastify import.
  Draft: [Fix the Fastify error handler page: @sentry/fastify does not exist and fastify() is never imported](<https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21#8-fix-the-fastify-error-handler-page-sentryfastify-does-not-exist-and-fastify-is-never-imported>)

## Should land

- [ ] **P1** · DOC-Q39 · The Fastify supported versions exclude 5
  `common/configuration/integrations/fastify.mdx:31` says `fastify ^3.0.0 || ^4.0.0`. Fastify 5.12.3 is fully instrumented on develop (route-named segments, handler and middleware spans, `auto.function.fastify` error capture), the built types say the integration supports `>= 3.21.0 < 6`, and `common/migration/v10-to-v11/index.mdx:112` drops Fastify 3.0 through 3.20.
  **Change:** Change the range to `^3.21.0 || ^4.0.0 || ^5.0.0`. Linear SDK-1465 sets `^3.21.0 || ^4.0.0` on the same line and leaves Fastify 5 out.
  Note: overlaps SDK-1465, whose range still leaves Fastify 5 out.
  Draft: [Correct the supported Fastify versions on the integration page](<https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21#118-correct-the-supported-fastify-versions-on-the-integration-page>)
