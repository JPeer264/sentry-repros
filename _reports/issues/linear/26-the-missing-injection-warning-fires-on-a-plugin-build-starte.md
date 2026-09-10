# The missing-injection warning fires on a plugin build started with `--preload`, although the bundled instrumentation is active

Milestone: Bun Functionality Gaps
Labels: JavaScript, Bun, Bug
Priority: Medium

`detectOrchestrionSetup()` (`packages/server-utils/src/orchestrion/detect.ts:34-42`) runs inside `Sentry.init()` and warns `[Sentry] No diagnostics-channel injection detected. Channel-based integrations will not record spans.` when neither the runtime marker nor the bundler marker is set. The bundler marker is written by the entry banner of the plugin build (`ORCHESTRION_BUNDLER_MARKER_BANNER` in `packages/server-utils/src/orchestrion/bundler/moduleInjectedTransform.ts:31-35`), which runs when the bundle evaluates. Under `bun --preload ./instrument.ts dist/app.js`, the documented way to load the SDK on Bun, `init()` runs in the preload before the bundle, so the check reads an unset marker and warns. The instrumentation still works: the per-module snippets subscribe when each transformed module evaluates.

Measured on Bun 1.4.2 with `@sentry/bun` 10.67.0 (develop) and `graphql` 16.14.2, a channel-instrumented library that needs no server, `debug: true` in every run:

- Plugin build + `--preload` (variant `graphql-bundle-preload`): the warning prints at app start (`app-graphql-bundle-preload.log:101`), and the `GET /graphql` request still records `GraphQL parse`, `GraphQL validate` and `GraphQL query` child spans. The warning is false.
- Unbundled + `--preload` (variant `graphql-preload`): the warning prints and the request records no GraphQL span. The warning is right.
- Plugin build with `import "./instrument"` as the first line of the entry, run without `--preload` (variant `graphql-bundle-inline`): no warning, `[Sentry] Bundler plugin ran, injected libraries=[]` instead, and the same three GraphQL spans. The library list is empty at init time because the per-module snippets have not run yet, which the detection comment already allows for.

A reader who follows the Bun guide, adds the plugin build step and keeps `--preload`, gets told their setup is broken while it is not. Nothing corrects the line later.

**Work item.** Defer the verdict until the entry has evaluated (a microtask or the first `orchestrion.module-injected` event), or record on the preload path that a plugin banner may still arrive and downgrade the line to a log. The docs note for the unbundled path, where the line is correct, is DOC-Q4.

**Evidence.** Getting-started reproduction `quickstarts/bun/`, variants `graphql-bundle-preload`, `graphql-preload` and `graphql-bundle-inline` (`run.sh`, `app-graphql.ts`, `app-graphql-inline.ts`, `build-graphql.ts`, `results-graphql-*.json`, `app-graphql-*.log`), run on 2026-09-10 with the 10.67.0 develop tarballs. Runtime docs audit, September 2026.
