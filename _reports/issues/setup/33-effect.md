Docs changes for the Effect guide that a new user hits between install and the first event on v11, from the runtime docs audit (develop `03aaf42455` and `6f2da7483d`, docs `aebda0ee4`). Each item links to its issue draft in the secret gist (https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21); the reproductions are [`quickstarts/effect/`](<https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/effect>) in the audit repository.

## Must land

- [ ] **P0** · DOC-Q75 · The metrics layer breaks the whole program on Effect v3
  `guides/effect/index.mdx:111-115` (the v3 Server tab with the metrics option) merges `Sentry.SentryEffectMetricsLayer` into the layer. With effect 3.22.2 the layer fails to build with `Service not found: effect/Scope`, the program never runs and nothing is sent; with effect 4.0.0-rc.112 the same layer builds. The metrics option (`:27`) also has no verify section.
  **Change:** Drop the metrics layer from the v3 snippet or state that it needs Effect v4, and add a metrics verify snippet or remove the option until it works on both majors.
  Draft: [Drop the metrics layer from the Effect v3 snippet, or say it needs Effect v4](<https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21#17-drop-the-metrics-layer-from-the-effect-v3-snippet-or-say-it-needs-effect-v4>)

## Should land

- [ ] **P1** · DOC-Q76 · The verify step promises an issue that nothing captures
  `guides/effect/index.mdx:280` and `:289-293` say that adding `yield* Effect.fail(new Error("Sentry Test Error"))` and running it with the layer creates an issue. No error event arrived in any variant (errors-only, tracing, launch, v3 and v4): the `@sentry/effect` build contains no `captureException` call, `defaultIntegrations` is forced to `false` so the Node error integrations are off and only `SpanStreaming` is installed, and the SDK's own e2e app captures failures by hand with `Sentry.captureException(Cause.squash(cause))`. Run with `Effect.runPromise` and no catch, the failure crashes the process and sends nothing; `NodeRuntime.runMain` exits 1 and sends only the sentinel.
  **Change:** Show a `catchAllCause` or `tapErrorCause` that calls `Sentry.captureException(Cause.squash(cause))`, say that failed effects are not captured on their own, and show the run call next to it.
  Draft: [Show the capture a failed effect needs on the Effect guide](<https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21#136-show-the-capture-a-failed-effect-needs-on-the-effect-guide>)
