# QS-aws-lambda, AWS Lambda getting-started path (npm), against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`), installed from
the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`. Node `v26.5.0`, macOS, no AWS account: the Lambda
runtime is stood in for by `invoke.mjs` (see below). Envelopes go to a local sink through the DSN
`http://public@127.0.0.1:4741/1` (Option A has no code to put a `tunnel` in, so the DSN itself points at the sink);
nothing leaves the machine.

The Node.js run in `../node/README.md` and the Express run in `../express/README.md` cover the Node-only
findings (the `--require` banner, the removed `@sentry/node/preload` entry, the extensionless ESM import, the
missing-release session warning). Only their Lambda status is recorded here.

## What it reproduces

A new user following the AWS Lambda guide's NPM path end to end: `npm install @sentry/aws-serverless`, then either
Option A (environment variables only) or Option B (`instrument.js` / `instrument.mjs` preloaded with `NODE_OPTIONS`),
then the verify step from the guide index. The Lambda layer and container-image paths need AWS and are read, not run.

| File | What it is | Snippet |
| --- | --- | --- |
| `handler-cjs.js` | `exports.handler = async (event, context) => { throw new Error("This is a test error"); };` | `guides/aws-lambda/index.mdx:42-46` (CommonJS verify tab), verbatim; docs name it `index.js` |
| `handler-esm-verbatim.mjs` | `export const handler = Sentry.wrapHandler(async (event, context) => { throw ... }));` | `guides/aws-lambda/index.mdx:48-54` (ESM verify tab), verbatim including the stray `)`; docs name it `index.mjs` |
| `handler-esm.mjs` | same with the stray `)` removed | `index.mdx:48-54`, minimal fix |
| `handler-esm-plain.mjs` | `export const handler = async (event, context) => { throw ... }` | the CommonJS snippet as ESM, no `wrapHandler` (the shape the package README's "Verify" block prints) |
| `handler-esm-options.mjs` | `Sentry.wrapHandler(yourHandler, { flushTimeout: 1000, captureTimeoutWarning: false })` around a 300 ms handler | `configuration/lambda-wrapper.mdx:15-19` and `:25-29` |
| `instrument.js` | `const Sentry = require("@sentry/aws-serverless"); Sentry.init({ dsn, tracesSampleRate: 1.0 })` | `install/npm.mdx:93-123` (CommonJS tab, error-monitoring + performance options), verbatim plus the sink DSN and `debug: true` |
| `instrument.mjs` | ESM version of the same | `install/npm.mdx:125-154`, verbatim plus the sink DSN and `debug: true` |
| `esm-tab/instrument.mjs` | a copy, alone in its directory, for the "ESM tab as printed" run | `install/npm.mdx:125-154` |

The handler files carry distinct basenames instead of the docs' `index.js` / `index.mjs` because the SDK's handler
resolution (`build/npm/esm/handlerResolution.js:13-28`) and the Lambda runtime both try `index.js` before `index.mjs`,
so both files cannot coexist in one task root.

### The local Lambda runtime stand-in

`invoke.mjs` does what `aws-lambda-ric`'s `UserFunction.load` does: after the `NODE_OPTIONS` preloads ran, it reads
`LAMBDA_TASK_ROOT` and `_HANDLER`, resolves the module the RIC way (extensionless `require`, `.js` by package type,
`.mjs` import, `.cjs` require), picks the export named in the handler string, and invokes it once with
`(event, context, callback)`, settling on the returned promise. The event is an API Gateway v1 proxy event
(`POST /hello?q=1`, `Host`/`X-Forwarded-Proto`/`X-Forwarded-Port`/`Cookie` headers, a JSON body); the context has
`functionName`, `functionVersion`, `invokedFunctionArn`, `memoryLimitInMB`, `awsRequestId`, `logGroupName`,
`logStreamName` and `getRemainingTimeInMillis()` (3000 ms, or `LAMBDA_REMAINING_MS`). It then prints the SDK name and
version and the installed integrations (`client._integrations`), captures a `sentinel` message and a `sentinel` span,
and flushes. `run.sh` sets the Lambda environment (`LAMBDA_TASK_ROOT`, `_HANDLER`, `AWS_LAMBDA_FUNCTION_NAME`,
`AWS_REGION`, `AWS_EXECUTION_ENV`, `AWS_LAMBDA_LOG_GROUP_NAME`, `AWS_LAMBDA_LOG_STREAM_NAME`, ...) exactly as the
runtime would.

## Which file each guide step renders from

The AWS Lambda pages are almost entirely inline. `index.mdx:5` sets `fallbackGuide: javascript.node`; the only
`<PlatformContent>` on the run path is `getting-started-data-collection`, and `platform-includes/getting-started-data-collection/`
holds a single `javascript.mdx` (no `javascript.aws-lambda.mdx`, no `_default.mdx`). The `*__v9.x.mdx` and
`layer__v7.x.mdx` / `layer__v8.x.mdx` siblings are version-gated pages and are not rendered for the current SDK.

| Step | Renders from |
| --- | --- |
| Overview, layer-vs-npm, configuration link | `guides/aws-lambda/index.mdx:13-36` (inline) |
| Verify | `guides/aws-lambda/index.mdx:38-54` (inline; CommonJS tab `:42-46`, ESM tab `:48-54`) |
| Install methods grid | `guides/aws-lambda/install/index.mdx:7` `<PageGrid />` (npm, layer, container-image) |
| NPM: prerequisites, install | `install/npm.mdx:16-65` (inline; `npm install @sentry/aws-serverless` at `:38`, `+ @sentry/profiling-node` at `:54` under the profiling option) |
| NPM: Option A env vars | `install/npm.mdx:69-85` (inline, `:74-77`) |
| NPM: Option B `instrument.js` / `.mjs` | `install/npm.mdx:93-123` and `:125-154` (inline) |
| NPM: load the SDK | `install/npm.mdx:156-166` (inline, `NODE_OPTIONS="--import ./instrument.js"` at `:161`) |
| NPM: control the data you send | `install/npm.mdx:170` -> `platform-includes/getting-started-data-collection/javascript.mdx:1-30` (not run) |
| Layer: ARN, extension, Option A/B | `install/layer.mdx:20-114` (inline; `<LambdaLayerDetail canonical="aws-layer:node" />` at `:32` renders the ARN from the docs registry; `:118` -> the same data-collection include) |
| Container image | `install/container-image.mdx:20-73` (inline) |
| Handler wrapper options | `configuration/lambda-wrapper.mdx:11-58` (inline) |
| Troubleshooting | `guides/aws-lambda/troubleshooting.mdx:13-33` (inline) |

## Install

```bash
cd $REPRO/quickstarts/aws-lambda
npm install            # package.json pins the seven develop tarballs as file:../../_toolbox/pack-develop-03aaf424/*.tgz, repeated in "overrides"
```

## Run

```bash
cd $REPRO/quickstarts/aws-lambda
./run.sh auto-cjs                # Option A env + handler-cjs.js                                    -> results-auto-cjs.json
./run.sh auto-esm-verbatim       # Option A env + handler-esm-verbatim.mjs (index.mdx:48-54 as printed) -> results-auto-esm-verbatim.json
./run.sh auto-esm                # Option A env + handler-esm.mjs (wrapHandler, stray ")" removed)   -> results-auto-esm.json
./run.sh auto-esm-plain          # Option A env + handler-esm-plain.mjs (no wrapHandler)             -> results-auto-esm-plain.json
./run.sh auto-no-lambda-env      # Option A env, plain `node`, no LAMBDA_TASK_ROOT/_HANDLER           -> results-auto-no-lambda-env.json
./run.sh require-auto            # NODE_OPTIONS="--require @sentry/aws-serverless/awslambda-auto"    -> results-require-auto.json
./run.sh manual-cjs              # NODE_OPTIONS="--import ./instrument.js" + handler-cjs.js         -> results-manual-cjs.json
./run.sh manual-esm-as-printed   # ESM tab as printed: only instrument.mjs exists, --import ./instrument.js -> results-manual-esm-as-printed.json
./run.sh manual-esm              # NODE_OPTIONS="--import ./instrument.mjs" + handler-esm-plain.mjs -> results-manual-esm.json
./run.sh manual-esm-wrap         # NODE_OPTIONS="--import ./instrument.mjs" + handler-esm.mjs       -> results-manual-esm-wrap.json
./run.sh manual-esm-wrap-options # same + handler-esm-options.mjs, LAMBDA_REMAINING_MS=600           -> results-manual-esm-wrap-options.json
./run.sh wrap-only               # Option B init, handler-esm.mjs, no LAMBDA_TASK_ROOT/_HANDLER       -> results-wrap-only.json
```

Each run checks that `127.0.0.1:4741` is free, starts the sink there, runs `timeout 60 node invoke.mjs` under the
variant's environment, then polls `/__items` until the `sentinel` event and the `sentinel` segment span have both
arrived (hard deadline 60 s, no fixed sleeps; skipped when the runner died before sending them), writes
`results-<variant>.json` via `summarize.mjs` (steps, console with the installed integrations, envelope item types,
events with mechanism and contexts, span attributes, verdict) and kills the sink. Machine paths are replaced by
`$REPRO` and `$NODE`.

## Expected (what the guide claims)

- `index.mdx:19`: once set up, "our SDK will automatically report error and performance data from your Lambda Functions. Issues in Sentry will automatically include cloudwatch data, function details and execution time measurements."
- `index.mdx:23`, `:27`: the Lambda layer is recommended; `install/npm.mdx:11`: "We recommend starting the SDK automatically via environment variables so that you only have to make minimal code changes".
- `install/npm.mdx:38`: `npm install @sentry/aws-serverless`.
- `install/npm.mdx:74-77`: Option A is `NODE_OPTIONS="--import @sentry/aws-serverless/awslambda-auto"`, `SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE="1.0"`; `:85` "That's it".
- `install/npm.mdx:93-154`: Option B creates `instrument.js` (CommonJS) or `instrument.mjs` (ESM) with `Sentry.init({ dsn, tracesSampleRate: 1.0 })`; `:161` loads it with `NODE_OPTIONS="--import ./instrument.js"`.
- `index.mdx:42-46`: verify with a CommonJS handler that throws (no `wrapHandler`); `:48-54`: the ESM handler is wrapped in `Sentry.wrapHandler`.
- `index.mdx:36` and `configuration/lambda-wrapper.mdx:13-37`: `Sentry.wrapHandler(yourHandler, { flushTimeout, captureTimeoutWarning: false, timeoutWarningLimit })` configures flushing and timeout warnings; `:39-58` `captureAllSettledReasons` with `Promise.rejected(...)`.
- `configuration/lambda-wrapper.mdx:9`: users of the layer with env vars should "switch to the initializing the SDK in code" at `../../install/layer#alternative-initialize-the-sdk-in-code`.
- `install/layer.mdx:36`: the layer bundles a Lambda extension, opt out with `useLayerExtension`.
- `install/container-image.mdx:45-47`: copy `node_modules/@sentry/aws-serverless/build/lambda-extension/sentry-extension` to `/opt/extensions/` and `.../lambda-extension/index.mjs` to `/opt/sentry-extension/`, `chmod +x` both; `:56` set `tunnel: "http://localhost:9000/envelope"`.
- `platform-includes/getting-started-data-collection/javascript.mdx:5`: "By default, the SDK sends user identity data (IP address, ID, and similar) and other data like HTTP bodies and URL query parameters."

## Observed on 2026-09-09

### Install

`npm install` of the seven develop tarballs succeeded (`added 61 packages in 3s`). `node_modules/@sentry` holds
`aws-serverless bundler-plugins conventions core node opentelemetry server-runtime-injection server-utils`, all
`10.67.0` except `@sentry/conventions@0.20.0` (a normal registry dependency); `package-lock.json` has no other
registry-resolved `@sentry/*` entry. **Holds.**

The tarball `sentry-aws-serverless-10.67.0.tgz` (69 entries) ships `build/npm/{cjs,esm,types}`, `build/import-hook.mjs`,
`build/npm/run-lambda-handler.mjs` and `build/lambda-extension/{sentry-extension,index.mjs}`. Its `exports` map is
`.`, `./package.json`, `./import`, `./awslambda-auto` (import and require conditions), `./run-lambda-handler` and the
deprecated `./dist/awslambda-auto` (require only). Every subpath the docs use exists: `@sentry/aws-serverless/awslambda-auto`
(`npm.mdx:74`, `layer.mdx:51`) and the two extension files the Dockerfile copies (`container-image.mdx:45-46`;
`sentry-extension` is a 220-byte executable bash wrapper that `exec`s `/opt/sentry-extension/index.mjs`, `index.mjs`
starts with `#!/usr/bin/env node` and is not executable in the tarball, so the docs' `chmod +x` is required).

Exports the snippets use, checked in `node_modules/@sentry/aws-serverless/build/npm/types/{index,init,sdk,integration/awslambda}.d.ts`:

| Export | Status on develop |
| --- | --- |
| `init(options?: AwsServerlessOptions)` | exists; `useLayerExtension?: boolean` documented in the d.ts |
| `wrapHandler(handler, wrapOptions?: Partial<WrapperOptions>)` | exists, not deprecated; `WrapperOptions` = `flushTimeout`, `callbackWaitsForEmptyEventLoop`, `captureTimeoutWarning`, `timeoutWarningLimit`, `captureAllSettledReasons`, all the names `lambda-wrapper.mdx` uses |
| `awsLambdaIntegration` | exists; its `setupOnce` calls `redirectLambdaHandler()`, which rewrites `_HANDLER` to the SDK shim (`integration/awslambda.js:16-49`) |
| `getDefaultIntegrations` | exists: Node's non-performance defaults + `awsIntegration()` + `awsLambdaIntegration()` (`init.js:27-29`) |
| `nodeProfilingIntegration` (`npm.mdx:96`, profiling option) | not checked, `@sentry/profiling-node` not installed (profiling option not run) |
| `captureMessage`, `startSpan`, `flush`, `getClient` (used by the runner) | exist |

Nothing the docs use is marked `@deprecated`. The one deprecated entry, `./dist/awslambda-auto`, is not referenced by
the current pages.

### How the build instruments the handler

In every Lambda-shaped run the console shows `Redirected lambda handler. { originalHandler: 'handler-cjs.handler',
newHandler: '$REPRO/quickstarts/aws-lambda/node_modules/@sentry/aws-serverless/build/npm/run-lambda-handler.handler' }`
and the runner reports `_HANDLER` pointing at the shim and `SENTRY_ORIGINAL_HANDLER=handler-cjs.handler`. The shim
loads the user module, wraps the handler value with `instrumentHandler` (span + error capture, mechanism
`auto.function.aws_serverless.otel`) and `wrapHandler` (contexts, flush, timeout warning). This happens with
Option A and with Option B alike, so `Sentry.wrapHandler` in user code is not what produces the span.

### Per variant

| Variant | Status | Error event | Segment span | Notes |
| --- | --- | --- | --- | --- |
| `auto-cjs` | works | 1, `Error: This is a test error`, mechanism `auto.function.aws_serverless.otel`, `handled: false` | 1, `qs-aws-lambda`, op `function.aws`, status `error` | 25 integrations, `SENTRY_DEBUG=1` prints them |
| `auto-esm-verbatim` | broken | 1, `SyntaxError: Unexpected token ')'`, mechanism `auto.node.onuncaughtexception` | none | the handler module does not parse; runner exit 1 |
| `auto-esm` | works | 1, mechanism `auto.function.aws_serverless.handler` | 1 | the inner `wrapHandler` captures first, the shim then logs "Not capturing exception because it's already been captured", no duplicate |
| `auto-esm-plain` | works | 1, mechanism `auto.function.aws_serverless.otel` | 1 | identical to `auto-cjs` |
| `auto-no-lambda-env` | broken | none | none | `Error: LAMBDA_TASK_ROOT environment variable is not set` thrown by `awslambda-auto.js:21` at preload, exit 1 |
| `require-auto` | works | 1, `auto.function.aws_serverless.otel` | 1 | the CJS build of `awslambda-auto` also works under `--require`; no "no longer supported" banner in this SDK (the Node run's banner does not appear here) |
| `manual-cjs` | works | 1, `auto.function.aws_serverless.otel` | 1 | `debug: true` output identical to Option A |
| `manual-esm-as-printed` | broken | none | none | `ERR_MODULE_NOT_FOUND: Cannot find module '.../esm-tab/instrument.js'`, exit 1 |
| `manual-esm` | works | 1, `auto.function.aws_serverless.otel` | 1 | |
| `manual-esm-wrap` | works | 1, `auto.function.aws_serverless.handler` | 1 | same as `auto-esm` |
| `manual-esm-wrap-options` | partial | 1 warning event `Possible function timeout: qs-aws-lambda`, tag `timeout: 1s` | 1, status `ok` | `captureTimeoutWarning: false` on the user's `wrapHandler` did not stop the warning: the shim's outer `wrapHandler` runs with defaults |
| `wrap-only` | partial | 1, `auto.function.aws_serverless.handler` | none | `wrapHandler` without the runtime redirect: error captured, `aws.lambda` context set, no span at all |

Every "works" row also has the `sentinel` event and `sentinel` span (poll state `arrived`), 0 `transaction` items,
2 `span` items, 0 `log` items, runner exit 0.

### What arrives at the sink (`results-manual-cjs.json`, identical for the other "works" rows)

- Envelope header: `sdk.name: sentry.javascript.aws-serverless`, `sdk.version: 10.67.0`, a trace DSC on every envelope.
- Error event: `exception.values[0]` = `Error: This is a test error` with a stack trace, mechanism
  `{ type: "auto.function.aws_serverless.otel", handled: false }`, contexts `trace`, `aws.lambda` (`aws_request_id`,
  `function_name`, `function_version`, `invoked_function_arn`, `execution_duration_in_millis`,
  `remaining_time_in_millis`, `sys.argv`), `aws.cloudwatch.logs` (`log_group`, `log_stream`, `url`), `cloud_resource`
  (`cloud.provider: aws`, `cloud.region: us-east-1`, `cloud.platform: AWS_Lambda_nodejs22.x`), `runtime`, `app`, `os`,
  `device`, `culture`; `environment: production`, no `release`, no `transaction`, no `user`, no `tags`, **no
  `request`** (the API Gateway headers, query string, cookie and body are not on the event; only the span carries
  `url.full`).
- Segment span (a `span` item, span-v2 envelope): `name: qs-aws-lambda`, `sentry.op: function.aws`,
  `sentry.origin: auto.aws_lambda`, `sentry.kind: server`, `sentry.segment.name.source: component`,
  `sentry.trace_lifecycle: stream`, `status: error` with `sentry.status.message: This is a test error`;
  `faas.name`, `faas.execution` (= awsRequestId), `faas.id` (= the ARN), `faas.coldstart: true`; `cloud.provider: aws`,
  `cloud.platform: aws_lambda`, `cloud.account.id: 123456789012`, `cloud.region: us-east-1`;
  `url.full: https://abc123.execute-api.us-east-1.amazonaws.com:443/hello?q=1`; plus `aws.lambda.*` and
  `aws.cloudwatch.logs.*` copies of the contexts (from `awsLambdaIntegration.processSegmentSpan`).
- Console: `Registered diagnostics-channel injection via Module.registerHooks()`, `SDK initialized from ESM`,
  `[Sentry] Runtime hook registered, injected libraries=[]`, `[Sentry] Bundler plugin did not run`, the
  `[instrumentation:express|@hapi/hapi|koa|@smithy/...] not injected yet` lines, and
  `Discarded session because of missing or non-string release` (Node-only, see `../node/README.md`).
- Installed integrations (25, Option A and Option B alike): `EventFilters FunctionToString LinkedErrors RequestData
  NodeSystemError ConversationId Console Http NodeFetch OnUncaughtException OnUnhandledRejection ContextLines
  LocalVariablesAsync Context ChildProcess WorkerThreads ProcessSession Modules Express Fastify Hapi Koa Aws AwsLambda
  SpanStreaming`. The database, GraphQL, AI and other performance integrations of `@sentry/node` are not in the list:
  `getDefaultIntegrations` in `init.js:27-29` builds on `getDefaultIntegrationsWithoutPerformance()`.
- Under the default v11 lifecycle (`traceLifecycle=stream`) the Lambda invocation arrives as a `span` item, never as a
  `transaction`. The guide never says either word for what it ships; the `Sentry.init` comments (`npm.mdx:107-108`)
  still speak of "capture 100% of transactions".

### Not run

- **Lambda layer** (`install/layer.mdx`): needs a function in AWS and the `<LambdaLayerDetail>` ARN. It promises the
  same Option A/B as the npm page plus a bundled extension (`useLayerExtension`); the build's `init.js:31-59` only
  turns the extension on when `getSDKSource() === "aws-lambda-layer"`, so it cannot be exercised from the npm tarball.
- **Container image** (`install/container-image.mdx`): needs Docker and AWS. The two files it copies exist in the
  tarball (see Install); the `tunnel: "http://localhost:9000/envelope"` value matches `init.js:57`.
- **Profiling option** (`npm.mdx:54`, `:96`, `:120`): `@sentry/profiling-node` not installed.

## Findings

| # | Severity | Kind | Docs | Claim | Observed | Fix (docs side) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | P0 | docs wrong | `guides/aws-lambda/index.mdx:48-54` | the ESM verify snippet | it ends in `}));`, one `)` too many; loading it gives `SyntaxError: Unexpected token ')'` (`results-auto-esm-verbatim.json`) | change `}));` to `});` |
| 2 | P1 | docs wrong | `install/npm.mdx:125,161` (same on `install/layer.mdx:88,111`) | the ESM tab creates `instrument.mjs`, then "preload the `instrument.js`" with `NODE_OPTIONS="--import ./instrument.js"` | with only `instrument.mjs` present the preload fails with `ERR_MODULE_NOT_FOUND` (`results-manual-esm-as-printed.json`) | give the load step an ESM tab with `--import ./instrument.mjs` |
| 3 | P1 | docs wrong | `configuration/lambda-wrapper.mdx:23-29` (and `:13-19`, `:31-37`) | "You can turn off timeout warnings by setting `captureTimeoutWarning` to `false` in the handler options" | with `captureTimeoutWarning: false` on the user's `wrapHandler` a `Possible function timeout: qs-aws-lambda` warning event still arrived, because the runtime redirect wraps the handler again with default options (`results-manual-esm-wrap-options.json`) | state that on v11 the automatic handler instrumentation wraps the handler with default options and explain how to opt out of `awsLambdaIntegration` before the wrapper options take effect |
| 4 | P0 | docs wrong | `configuration/lambda-wrapper.mdx:51-52` | `Promise.rejected(new Error("first"))` | `TypeError: Promise.rejected is not a function` | use `Promise.reject` |
| 5 | P2 | docs wrong | `guides/aws-lambda/index.mdx:42-54` | the CommonJS verify tab has no `wrapHandler`, the ESM tab wraps with `Sentry.wrapHandler` | both tabs produce one error event and one segment span without `wrapHandler` (`results-auto-cjs.json`, `results-auto-esm-plain.json`); with it only the mechanism changes to `auto.function.aws_serverless.handler` and no duplicate is sent (`results-auto-esm.json`); `wrapHandler` alone yields no span (`results-wrap-only.json`) | drop `wrapHandler` from the ESM verify tab (or say it is optional on v11) so both tabs match the npm page's "no code changes" promise |
| 6 | P2 | docs wrong | `configuration/lambda-wrapper.mdx:9` | link to `../../install/layer#alternative-initialize-the-sdk-in-code` | `install/layer.mdx` has no such heading; the section is "Option B: Manual Setup" (`layer.mdx:62`) | point the link at `#option-b-manual-setup` |
| 7 | P2 | SDK limit | `platform-includes/getting-started-data-collection/javascript.mdx:5` (rendered by `npm.mdx:170`) | "By default, the SDK sends ... HTTP bodies and URL query parameters" | the Lambda error event has no `request` at all; the API Gateway headers, query string, cookie and body are dropped, only the span carries `url.full` (`results-manual-cjs.json`, `error_event_has_request: [false]`) | say that for Lambda invocations request data is limited to `url.full` on the span |
| 8 | P2 | SDK limit | `install/npm.mdx:74` | `NODE_OPTIONS="--import @sentry/aws-serverless/awslambda-auto"` | outside Lambda (no `LAMBDA_TASK_ROOT`) the preload throws `LAMBDA_TASK_ROOT environment variable is not set` and the process exits before any user code (`results-auto-no-lambda-env.json`) | note that `awslambda-auto` only works inside the Lambda runtime (or with `LAMBDA_TASK_ROOT` and `_HANDLER` set) |
| 9 | P2 | SDK limit | `install/npm.mdx:107-108` | "capture 100% of transactions" | the invocation ships as a `span` item (op `function.aws`), no `transaction` item is ever sent (`item_types: { span: 2, event: 2 }`) | reword to spans |

Findings 1, 2 and 4 are snippets a user copies; 3 and 5 follow from the v11 `_HANDLER` redirect that none of the
pages mention.

## Notes

- The segment's op is `function.aws` (`@sentry/conventions` `FUNCTION_AWS`), not `function.aws.lambda`; the guide
  pages name no op.
- `SENTRY_DEBUG=1` is honoured by `@sentry/node` and is the only way to see the integration list under Option A; the
  pages do not mention it.
- `faas.coldstart` was `true` on the single invocation of every run; the shim derives it from process uptime.
- No `log` items arrived in any run (`enableLogs` is unset); the pages do not mention logs.
- `client._integrations` and the `debug: true` list agree (25 names) in every variant.
- Another audit's sink (`../effect/sink.mjs`) was running on this machine during these runs; it was left alone and
  uses a different port.
