# QS-effect, Effect getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. Node `v26.5.0`, macOS.
`effect@3.22.2` (npm auto-installs it as the peer of `@sentry/effect`, then pinned as `effect@3`) and
`@effect/platform-node@0.108.2` from the registry in the main directory; `effect@4.0.0-rc.112` and
`@effect/platform-node@4.0.0-rc.112` in `v4/` (the SDK peer range is `^3.0.0 || ^4.0.0-beta.50`). All envelopes
go to a local sink via the `tunnel` option; nothing leaves the machine.

The Node.js run in `../node/README.md` and the Express run in `../express/README.md` cover the Node-only findings
(the `--require` banner, the removed `@sentry/node/preload` entry, the extensionless ESM import, the missing-release
session warning). None of them applies here: the Effect guide has no `instrument.mjs`, no `--import` and no
`--require` step; Sentry is initialised from inside an Effect layer.

## What it reproduces

A new user following the Effect guide end to end: install, compose the `SentryLive` layer the way the Configure
step shows it (Effect v3 and Effect v4 Server tabs), and run each Verify snippet. The programs are scripts that
run one effect and exit, not HTTP servers. The docs snippets are kept in `.ts` files with the names the guide
uses and run with Node's built-in type stripping (`node main.ts`).

| File | What it is | Snippet |
| --- | --- | --- |
| `sentry-layer.js` | `SentryLive` = `Sentry.effectLayer({ dsn, tracesSampleRate })` + `Layer.setTracer(Sentry.SentryEffectTracer)` + `Logger.replace(Logger.defaultLogger, Sentry.SentryEffectLogger)` | `guides/effect/index.mdx:88-110,116`, verbatim plus `tunnel` and `debug: true` |
| `sentry-layer-metrics.js` | the same with `Sentry.SentryEffectMetricsLayer` (all four onboarding options) | `index.mdx:88-116`, verbatim plus `tunnel` and `debug: true` |
| `sentry-layer-errors-only.js` | `Sentry.effectLayer({ dsn })` only (the default onboarding selection) | `index.mdx:88-90,100,116` |
| `verify-issues.ts` | `Effect.gen(function* () { yield* Effect.fail(new Error("Sentry Test Error")); })` | `index.mdx:286-293`, verbatim, then run with `Effect.provide(SentryLive)` + `NodeRuntime.runMain` |
| `verify-issues-errors-only.ts`, `verify-issues-metrics.ts` | the same snippet with the errors-only / metrics layer | `index.mdx:286-293` |
| `verify-tracing.ts` | `Effect.sleep("100 millis")` + `Effect.fail(...)` inside `Effect.withSpan("My First Test Transaction", { attributes: { op: "test" } })` | `index.mdx:313-326`, verbatim |
| `verify-logs.ts` | `Effect.log`, `Effect.logWarning` + `annotateLogs`, `Effect.logError` + `annotateLogs` | `index.mdx:349-368`, verbatim |
| `verify-runpromise.ts` | the Issues snippet run with `Effect.runPromise(...)` and no catch | `index.mdx:286-293` |
| `main.ts` + `Http.js` | the Configure snippet as printed, `MainLive.pipe(Layer.launch, NodeRuntime.runMain)`; `Http.js` (imported at `:86`, never shown) is a `Layer.effectDiscard` around the Tracing snippet | `index.mdx:80-120` (metrics option off, see the `metrics` variant) |
| `v4/verify-all.ts` | the Effect v4 Server tab layer (`Layer.succeed(Tracer.Tracer, ...)`, `Logger.layer([...])`, metrics layer) + the Logs and Tracing snippets | `index.mdx:188-214` + `:352-368` + `:316-326`, verbatim |
| `sentinel.js` | `Sentry.captureMessage("sentinel")`, `Effect.void.pipe(Effect.withSpan("sentinel"))`, `Sentry.flush(5000)`, appended to every program with `Effect.ensuring` | repro-only |

## Which file each guide step renders from

`src/components/platformContent.tsx:71-133` resolves an include as guide (`javascript.effect`), then
`fallbackGuide` (none in `guides/effect/config.yml`), then platform (`javascript`), then `_default`. No include
directory has a `javascript.effect.mdx` except `performance/enable-stream-mode`, which the guide does not render.

| Step | Renders from |
| --- | --- |
| `guides/effect/index.mdx:18` `getting-started-prerequisites` | `platform-includes/getting-started-prerequisites/_default.mdx:1-6` (no `javascript.effect.mdx`, no `javascript.mdx`) |
| `index.mdx:26-28` onboarding options | `src/components/onboarding/index.tsx:362-364,384`: only `error-monitoring` is checked by default, `performance`, `logs`, `metrics` are opt-in |
| `index.mdx:30` features expandable | `includes/quick-start-features-expandable.mdx:44-51` (`issues`, `tracing`, `logs`, `metrics`) |
| `index.mdx:43-53` install | inline: `npm install @sentry/effect --save` (`@effect/platform-node`, imported at `:81`, is not named) |
| `index.mdx:79-121` configure, Effect v3 | inline, Server and Client tabs |
| `index.mdx:176-256` configure, Effect v4 | inline, Server and Client tabs |
| `index.mdx:264` source maps | `platform-includes/getting-started-sourcemaps-short-version/javascript.mdx` (not run) |
| `index.mdx:268` data collection | `platform-includes/getting-started-data-collection/javascript.mdx` (not run) |
| `index.mdx:285-294`, `:312-327`, `:348-369` verify | inline (issues; tracing under `performance`; logs under `logs`; nothing under `metrics`) |
| `index.mdx:381` locate data | `includes/quick-start-locate-data-expandable.mdx` |
| `platform-includes/performance/enable-stream-mode/javascript.effect.mdx:1-62` | the only Effect-specific include; rendered by the streamed-spans pages, not by the guide (not run) |

## Install

```bash
cd $REPRO/quickstarts/effect
npm install            # package.json pins the twelve develop tarballs as file:../../_toolbox/pack-develop-03aaf424/*.tgz, repeated in "overrides", plus effect@3 and @effect/platform-node@0.108.2
cd v4 && npm install   # same tarballs, effect@4.0.0-rc.112 and @effect/platform-node@4.0.0-rc.112
```

## Run

```bash
cd $REPRO/quickstarts/effect
./run.sh issues              # node verify-issues.ts              -> results-issues.json
./run.sh issues-errors-only  # node verify-issues-errors-only.ts  -> results-issues-errors-only.json
./run.sh tracing             # node verify-tracing.ts             -> results-tracing.json
./run.sh logs                # node verify-logs.ts                -> results-logs.json
./run.sh metrics             # node verify-issues-metrics.ts      -> results-metrics.json
./run.sh runpromise          # node verify-runpromise.ts          -> results-runpromise.json
./run.sh launch              # node main.ts                       -> results-launch.json
./run.sh v4                  # (cd v4 && node verify-all.ts)      -> results-v4.json
```

Each run starts the sink on `127.0.0.1:4737` (checked free first), runs one program to completion under
`timeout 60`, polls `/__items` until the sentinel event and the sentinel span have both arrived (hard deadline
60 s, no fixed sleeps; skipped for `runpromise`, whose process exit is the terminal condition), writes
`results-<variant>.json` (exit code, console output with the installed integrations, the compact sink items, the
raw span payloads and a computed verdict) via `summarize.mjs`, and kills the sink. Machine paths are replaced by
`$REPRO`.

## Expected (what the guide claims)

- `index.mdx:44`: `npm install @sentry/effect --save` is the whole install.
- `index.mdx:61`: `effectLayer` "initializes Sentry"; compose it with layers for tracing, logging and metrics.
- `index.mdx:71`: Node, "Provide `SentryLive` before launching your HTTP layer (for example, with `NodeRuntime`)".
- `index.mdx:88-116`: `Layer.mergeAll(Sentry.effectLayer({...}), Layer.setTracer(Sentry.SentryEffectTracer), Logger.replace(Logger.defaultLogger, Sentry.SentryEffectLogger), Sentry.SentryEffectMetricsLayer)` for Effect v3.
- `index.mdx:188-214`: `Layer.succeed(Tracer.Tracer, Sentry.SentryEffectTracer)` and `Logger.layer([Sentry.SentryEffectLogger])` for Effect v4.
- `index.mdx:280,289-293`: "To verify that Sentry captures errors and creates issues in your Sentry project, add a test error": `yield* Effect.fail(new Error("Sentry Test Error"))`, "Run with your layer that includes Sentry.effectLayer".
- `index.mdx:307,322-324`: "update the previous code snippet to create a custom span", `Effect.withSpan("My First Test Transaction", { attributes: { op: "test" } })`.
- `index.mdx:342,353-367`: "To verify that Sentry catches your logs", `Effect.log`, `Effect.logWarning(...).pipe(Effect.annotateLogs({ operation, duration }))`, `Effect.logError(...).pipe(Effect.annotateLogs({ field, reason }))`.
- `index.mdx:27`, `quick-start-features-expandable.mdx:47`: `metrics` is an onboarding option and a listed feature.

## Observed on 2026-09-09

### Step 1, Install

`npm install` of the twelve develop tarballs alone (`added 70 packages in 5s`) pulled `effect@3.22.2` in as the
peer of `@sentry/effect`; `node_modules/@effect` did not exist afterwards, so the Configure snippet's
`import { NodeRuntime } from "@effect/platform-node"` (`index.mdx:81`) has nothing to resolve to until the user
installs it on their own (`npm install --save effect@3 @effect/platform-node@0.108.2`, `added 26 packages`).
`node_modules/@sentry` holds `browser browser-utils bundler-plugins conventions core effect feedback node
opentelemetry replay replay-canvas server-runtime-injection server-utils`, all `10.67.0`; `package-lock.json` has
no registry-resolved `@sentry/*` entry except `@sentry/conventions@0.20.0`. Same for `v4/`. **Holds**, with the
`@effect/platform-node` and `./Http.js` gap.

Exports the snippets use, checked in `node_modules/@sentry/effect/build/types/index.server.d.ts`,
`index.client.d.ts`, `index.types.d.ts`, `server/index.d.ts`, `logger.d.ts`, `metrics.d.ts`:

| Export | Status on develop |
| --- | --- |
| `effectLayer(options)` | exists (`server/index.d.ts:34`), `EffectServerLayerOptions = NodeOptions`; the build (`build/esm/server/index.js`) is `Layer.suspend(() => { init(options); return Layer.empty; })` |
| `SentryEffectTracer` | exists (`server/tracer.d.ts:11`), an Effect `Tracer` |
| `SentryEffectLogger` | exists (`logger.d.ts:5`), `Logger.Logger<unknown, void>` |
| `SentryEffectMetricsLayer` | exists (`metrics.d.ts:7`), `Layer.Layer<never, never, never>`; the build is `Layer.effectDiscard(...)` around `Effect.acquireRelease` + `Effect.forkScoped` |
| `browserTracingIntegration` (Client tabs, `:141`, `:240`) | exists only on the client entry (`index.client.d.ts:1` re-exports `@sentry/browser`); on Node the `node` export condition resolves `build/esm/index.server.js`, which has no such export (the Client tab is a browser snippet, not run) |
| `spanStreamingIntegration` (`enable-stream-mode/javascript.effect.mdx:20`) | exists (`@sentry/node` re-export) |
| `init` | exists, not used by the guide |
| `captureException` | exists (`@sentry/node` re-export); the guide never mentions it, and no file in `build/` calls `captureException`, `captureMessage` or `captureEvent` |

Nothing is marked `@deprecated`.

### Step 2, Configure

`build/esm/server/sdk.js` sets `defaultIntegrations: options.defaultIntegrations ?? false` before calling
`@sentry/node`'s `init`, so the Node default integrations are off. **1 integration installed** in every variant,
with or without `tracesSampleRate`:

```
SpanStreaming
```

(the `ServerRuntimeClient` adds it itself, `@sentry/core` `build/esm/server-runtime-client.js:23`). No `Http`,
`OnUncaughtException`, `OnUnhandledRejection`, `LinkedErrors`, `ContextLines`, `Console`, `Modules`. `debug: true`
prints the Node lines `Registered diagnostics-channel injection via Module.registerHooks()`, `SDK initialized from
ESM`, `[Sentry] Runtime hook registered, injected libraries=[]`, `[Sentry] Bundler plugin did not run`. Identity
read off the envelopes: `sentry.javascript.effect` `10.67.0`, runtime `node` `v26.5.0`. Node ran the `.ts`
files without any type-stripping warning.

### Step 3, Verify

| Variant | Exit | Arrives at the sink | Verdict |
| --- | --- | --- | --- |
| `issues` | 1 | sentinel `event` + sentinel `span` only; **no event for `Sentry Test Error`**; `NodeRuntime.runMain` prints `ERROR (#1): Error: Sentry Test Error` through its pretty logger | partial |
| `issues-errors-only` | 1 | sentinel event only (no tracer, no span); no error event | partial |
| `tracing` | 1 | one `span` envelope: `My First Test Transaction` (`is_segment: true`, `sentry.op: function`, `sentry.origin: auto.function.effect`, `status: error`, `sentry.status.message: Error: Sentry Test Error`, custom attribute `op: test`, `sentry.trace_lifecycle` set, `sentry.segment.name.source`), child `sentinel` (`function`, `ok`); sentinel event; no error event; no `transaction` item | partial |
| `logs` | 0 | one `log` envelope with `info: User example action completed`, `warn: Slow operation detected`, `error: Validation failed`, each with only `sentry.origin: auto.log.effect`, `sentry.sdk.name`, `sentry.sdk.version`, `server.address`, `sentry.timestamp.sequence`; the `annotateLogs` keys (`operation`, `duration`, `field`, `reason`) are printed by the console logger and **absent from the Sentry log items**; sentinel event + span | works |
| `metrics` | 1 | **nothing**; the layer fails to build: `Error: Service not found: effect/Scope (defined at .../effect/dist/esm/internal/fiberRuntime.js:1853:46)`, before the program runs | broken |
| `runpromise` | 1 | **nothing**; Node crashes on the unhandled rejection (`triggerUncaughtException(err, true /* fromPromise */)`, `(FiberFailure) Error: Sentry Test Error`), no flush | broken |
| `launch` | 1 | same as `tracing`: the segment span with `op: function`, the sentinel child, the sentinel event, no error event; `Layer.launch` ends because the layer's effect fails | partial |
| `v4` (effect 4.0.0-rc.112, all four layers) | 1 | segment `My First Test Transaction` (`function`, `error`, `op: test` attribute), `sentinel` child, one `log` envelope with the three bodies and no annotation keys, sentinel event, no error event; **the metrics layer builds fine on v4** | partial |

Details worth keeping:

- Every failing program: the `Effect.fail` cause reaches the console through `runMain`'s pretty logger and the
  process exits 1, but no `event` with `Sentry Test Error` is sent. The build captures nothing on failure; the
  span only gets `status: error`. The SDK's own e2e app
  (`dev-packages/e2e-tests/test-applications/effect-3-node/src/app.ts`) calls `Sentry.captureException(Cause.squash(cause))`
  in `HttpRouter.catchAllCause` for exactly this reason.
- Both loggers stay active: `runMain` installs its pretty logger outside `Effect.provide(SentryLive)`, so the
  inner `Logger.replace(Logger.defaultLogger, ...)` finds no `defaultLogger` to remove and adds the Sentry logger
  next to it. Console output and Sentry logs are both produced.
- The Effect span name becomes the segment name (`sentry.segment.name: My First Test Transaction`); the sentinel
  span, started after the failed Effect span had ended, is still parented under it (`parent ID` in the debug
  output), because the tracer falls back to `getActiveSpan()` when the fiber has no current span.
- `@sentry/effect` has no `trace_metric` item in any run (no Effect metric was defined; the metrics layer flushes
  on a 10 s `Schedule.spaced`, so a script shorter than that would not send any).

## Findings

| # | Severity | Kind | Docs | Claim | Observed | Fix |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | P0 | SDK limit | `index.mdx:111-115` (v3 Server tab, `metrics` option) | `Sentry.SentryEffectMetricsLayer` "Forward Effect metrics to Sentry" | with `effect@3.22.2` the merged layer fails to build (`Service not found: effect/Scope`), the program never runs and nothing is sent; with `effect@4.0.0-rc.112` it builds (`metrics`, `v4`) | state that the metrics layer needs Effect v4 and drop it from the v3 snippet until the layer is scoped |
| 2 | P1 | docs wrong | `index.mdx:280,289-293` | "To verify that Sentry captures errors and creates issues ... `yield* Effect.fail(new Error("Sentry Test Error"))`" | no error event in `issues`, `issues-errors-only`, `tracing`, `launch`, `v4`; the build has no capture path for failed effects and the Node error integrations are off (`defaultIntegrations: false`) | show a `catchAllCause` (or `Effect.tapErrorCause`) that calls `Sentry.captureException(Cause.squash(cause))`, and say that failed effects are not captured on their own |
| 3 | P2 | docs wrong | `index.mdx:81,86` vs `:43-53` | the install step is `npm install @sentry/effect --save`; the Configure snippet imports `@effect/platform-node` and `./Http.js` | `npm install` of the SDK alone leaves no `node_modules/@effect`; `Http.js` is never shown | name `@effect/platform-node` in the install step and show a minimal `Http.ts` (or use `Effect.provide` + `NodeRuntime.runMain` on a program) |
| 4 | P2 | docs wrong | `index.mdx:301,307,322-324` | "Tracing", "create a custom span" named "My First Test Transaction" with `attributes: { op: "test" }` | the span arrives as a `span` envelope item (`is_segment: true`), never as a `transaction`; `sentry.op` is `function` and `op` is an ordinary attribute | say the span op is `function` and that `op` is a custom attribute (or drop it), and stop calling it a transaction |
| 5 | P2 | SDK limit | `index.mdx:355-367` | `Effect.annotateLogs({ operation, duration })` / `({ field, reason })` on the logs sent to Sentry | the annotations reach the console logger only; the Sentry log items carry no user attributes (`logs`, `v4`) | note that log annotations are not forwarded yet |
| 6 | P2 | docs wrong | `index.mdx:27` | `metrics` is an onboarding option with its own layer | the Verify step has no metrics section, and (finding 1) the layer breaks on v3 | add a metrics verify snippet or remove the option until it works on both majors |
| 7 | P2 | SDK limit | `index.mdx:293` | "Run with your layer that includes Sentry.effectLayer" | `Effect.runPromise(program.pipe(Effect.provide(SentryLive)))` crashes the process on the failure and sends nothing (`runpromise`); `NodeRuntime.runMain` exits 1 and sends the sentinel only | show the run call (`NodeRuntime.runMain`) and the capture from finding 2 |
| 8 | P2 | SDK limit | `index.mdx:61,71` | `effectLayer` "initializes Sentry" for Node | only `SpanStreaming` is installed; none of the Node default integrations (http, console, uncaught exception, linked errors, context lines) run, so nothing the Node guide promises applies to an Effect app | say that the Node auto-instrumentation and global error handlers are off unless `defaultIntegrations` is set |
