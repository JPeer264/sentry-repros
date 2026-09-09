# QS-mastra, Mastra guide, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`), installed from
the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/` and forced into `@mastra/sentry` via `overrides`
(`@mastra/sentry@1.2.16` declares `@sentry/node: ^10.68.0`, so without the override npm would fetch a registry
build). Node `v26.5.0`, macOS. From the registry: `@mastra/core 1.65.0`, `@mastra/sentry 1.2.16`,
`@mastra/observability 1.17.6` (plus its dependency `@mastra/otel-exporter 1.3.14`), `zod 4.5.4`. The guide names
no model provider package; the agent uses Mastra's built-in model router with `{ id: "openai/gpt-4o-mini", url,
apiKey }` pointed at `mock.mjs` (an OpenAI stand-in on `127.0.0.1:4740`), so no real LLM call is made. The
exporter has no `tunnel` option, so `SENTRY_DSN=http://public@127.0.0.1:4739/1` points the SDK at `sink.mjs`;
nothing leaves the machine.

Node-only findings (the missing-release session warning, `--import` mechanics) are covered in
`../node/README.md` and only their Mastra status is recorded here.

## What it reproduces

A new user following the Mastra guide end to end: install `@mastra/sentry` + `@mastra/observability`, put the
`SentryExporter` into `new Mastra({ observability })` exactly as printed, run one agent turn (one tool call, two
model round trips), and check the "Verify" promise (agent run with model generations, tool calls, token usage and
related errors). The guide has no agent snippet ("A Mastra application using `@mastra/core`" is a prerequisite),
so `agent.mjs` is repro-only: one `Agent` (`Weather Agent`) with one `createTool` (`get-weather`), called with
`generate("What is the weather in Berlin right now?", { memory: { thread: "thread-1", resource: "user-1" } })`.
`run-agent.mjs` then captures `Sentry.captureMessage("sentinel")` and a `sentinel` span and flushes; `run.sh`
polls the sink for both instead of sleeping.

| File | Snippet |
| --- | --- |
| `mastra-guide.mjs` | `docs/platforms/javascript/guides/mastra/index.mdx:59-79` verbatim (types dropped, `agents: { weatherAgent }` in place of the `// agents, workflows, ...` comment) |
| `mastra-env-only.mjs` | `docs/platforms/javascript/common/agent-tracing/mastra.mdx:64-77` verbatim (`new SentryExporter()`) |
| `mastra-explicit.mjs` | `docs/platforms/javascript/common/agent-tracing/mastra.mdx:84-104` verbatim (`dsn`, `environment`, `tracesSampleRate`) |
| `mastra-sdk-only.mjs`, `instrument.mjs` | repro-only: plain `Sentry.init({ dsn, tracesSampleRate: 1.0, debug: true })` via `--import`, no exporter, to see the SDK's own default `mastraIntegration` |
| `agent.mjs`, `run-agent.mjs`, `mock.mjs`, `sink.mjs`, `summarize.mjs`, `run.sh` | harness |

## Which file each guide step renders from

`guides/mastra/index.mdx` sets `inheritCommonContent: false` and renders no `<PlatformContent>` include; every
step is inline. The second page, `common/agent-tracing/mastra.mdx`, lists `javascript.node` (and 17 other
guides) in `supported:` and is also include-free.

| Step | Renders from |
| --- | --- |
| Prerequisites | `guides/mastra/index.mdx:21-27` (Node `>=22.13.0`, `@mastra/core` app) |
| Install | `guides/mastra/index.mdx:31-47` (`npm install @mastra/sentry@latest @mastra/observability@latest`; "You don't need to install or initialize `@sentry/node` separately") |
| Configure | `guides/mastra/index.mdx:49-91` (`.env` with `SENTRY_DSN`, the `src/mastra/index.ts` snippet at `:59-79`, the framework Alert at `:85-91`) |
| Verify | `guides/mastra/index.mdx:93-101` (prose only, no snippet) |
| What gets captured | `guides/mastra/index.mdx:110-132` (span type to op table, `sentry.origin: auto.ai.mastra`) |
| Agent tracing page | `common/agent-tracing/mastra.mdx:39-55` install, `:59-105` two config snippets, `:107-127` same table, `:129-174` attribute list, `:176-200` `exportTracingEvent()` / `flush()` / `shutdown()` |

## Install

```bash
cd $REPRO/quickstarts/mastra
npm install            # package.json pins the six develop tarballs as file:../../_toolbox/pack-develop-03aaf424/*.tgz, repeated in "overrides", plus @mastra/core, @mastra/sentry, @mastra/observability and zod from the registry
```

## Run

```bash
cd $REPRO/quickstarts/mastra
./run.sh guide        # MASTRA_FILE=./mastra-guide.mjs node run-agent.mjs                               -> results-guide.json
./run.sh env-only     # MASTRA_FILE=./mastra-env-only.mjs node run-agent.mjs                            -> results-env-only.json
./run.sh explicit     # MASTRA_FILE=./mastra-explicit.mjs node run-agent.mjs                            -> results-explicit.json
./run.sh tool-error   # TOOL_FAIL=1 MASTRA_FILE=./mastra-guide.mjs node run-agent.mjs (the tool throws) -> results-tool-error.json
./run.sh sdk-only     # MASTRA_FILE=./mastra-sdk-only.mjs node --import ./instrument.mjs run-agent.mjs  -> results-sdk-only.json
./run.sh both         # MASTRA_FILE=./mastra-guide.mjs node --import ./instrument.mjs run-agent.mjs     -> results-both.json
```

Each run starts the sink on `127.0.0.1:4739` and the mock model on `127.0.0.1:4740` (both checked free first),
exports `SENTRY_DSN`, `SENTRY_DEBUG=1` (read by `@sentry/node`'s `init`, since the exporter passes no `debug`),
runs the script under `timeout 90`, polls `/__items` until the sentinel event and the sentinel span have arrived
(hard deadline 60 s, no fixed sleeps), writes `results-<variant>.json` (console output with the installed
integrations, mock requests, compact sink items with every span attribute, raw span payloads, verdict) via
`summarize.mjs`, and kills all three processes. Machine paths are replaced by `$REPRO`.

## Expected (what the guide claims)

- `guides/mastra/index.mdx:17-19`: the guide "configures Mastra's `@mastra/sentry` exporter"; "The exporter uses `@sentry/node` internally, so it can send Mastra telemetry directly ... without another Sentry SDK".
- `guides/mastra/index.mdx:47`, `agent-tracing/mastra.mdx:55`: "You don't need to install or initialize `@sentry/node` separately ... The exporter includes it as a dependency and initializes it for you."
- `guides/mastra/index.mdx:81`: "Mastra sends agent data to Sentry as traces. Keep `tracesSampleRate` above `0`"; `:83`: the exporter reads `SENTRY_ENVIRONMENT` and `SENTRY_RELEASE`.
- `guides/mastra/index.mdx:89`: "If Mastra runs in the same process as an application that already calls `Sentry.init()`, don't initialize Sentry a second time without first confirming that the two SDK setups are compatible."
- `guides/mastra/index.mdx:95`: after one agent run the Agents page shows "an agent run with its model generations, tool calls, token usage, and any related errors".
- `guides/mastra/index.mdx:106`: "Mastra maps `metadata.threadId` to `gen_ai.conversation.id`".
- `guides/mastra/index.mdx:114-130`, `agent-tracing/mastra.mdx:111-125`: `AGENT_RUN` -> `gen_ai.invoke_agent`, `MODEL_GENERATION` -> `gen_ai.chat`, `TOOL_CALL` -> `gen_ai.execute_tool`, `GENERIC` -> `ai.span`; `MODEL_STEP`/`MODEL_CHUNK` skipped; `sentry.origin: auto.ai.mastra`.
- `agent-tracing/mastra.mdx:133-172`: attributes `ai.span.type`, `gen_ai.system`, `gen_ai.request.model`, `gen_ai.request.messages`, `gen_ai.response.text`, `gen_ai.response.tool_calls`, `gen_ai.usage.{input,output,total}_tokens`, `gen_ai.request.stream`, `gen_ai.request.temperature`, `gen_ai.completion_start_time`; tool spans `gen_ai.tool.name`, `gen_ai.tool.type: function`, `gen_ai.tool.call.id`, `gen_ai.tool.input`, `gen_ai.tool.output`, `tool.success`; agent spans `gen_ai.agent.name`, `gen_ai.pipeline.name`, `gen_ai.agent.instructions`, `gen_ai.usage.*` aggregated.
- `guides/mastra/index.mdx:136-139`: `@mastra/sentry >=1.0.0`, Node `>=22.13.0`.

## Observed on 2026-09-09

### Step 1, Install

`npm install` of the six develop tarballs plus `@mastra/core@latest`, `@mastra/sentry@latest`,
`@mastra/observability@latest` and `zod` succeeded (`added 274 packages in 40s`). `node_modules/@sentry` holds
`bundler-plugins conventions core node opentelemetry server-runtime-injection server-utils`, all `10.67.0` except
`@sentry/conventions@0.20.0` (registry, a normal published dependency); `package-lock.json` has no other
registry-resolved `@sentry/*` entry and no nested `@sentry/*` copy. **Holds**, with one caveat: `@mastra/sentry`
declares `@sentry/node: ^10.68.0`, so the develop tarball only gets in through `overrides`; a user without the
override gets the registry `10.68.x`.

Exports the snippets use: none from `@sentry/node` (`SentryExporter` comes from `@mastra/sentry`, `Observability`
from `@mastra/observability`). Checked in `node_modules/@sentry/node/build/types/index.d.ts:5` anyway:
`mastraIntegration` and `SentryMastraExporter` exist and are not `@deprecated`
(`node_modules/@sentry/server-utils/build/types/integrations/mastra.d.ts`, `.../ai/mastra/index.d.ts`). The
integration's d.ts says: "Hooks the `Mastra` constructor and registers a Sentry exporter via `registerExporter()`.
Enabled by default ... Requires the runtime hook or bundler plugin, and `@mastra/core >= 1.63.2`"; the SDK's
exporter "Never calls `Sentry.init()` / `Sentry.close()` — the community `@mastra/sentry` package does both and
replaces the app's client". Neither page mentions either export.

### Step 2, Configure and run (`guide`, `env-only`, `explicit`)

All three snippets run unchanged and reach the sink: `sentry.javascript.node` `10.67.0`, runtime `node`
`v26.5.0`, **46 integrations** installed by the exporter's internal `Sentry.init` (same list as the Koa run,
`Mastra` among them). Console shows `[instrumentation:@mastra/core] not injected yet, waiting for the module to
load` and `Runtime hook registered, injected libraries=[]`: because `Sentry.init` runs inside the
`SentryExporter` constructor, after `@mastra/core` was imported, the SDK's own Mastra hook never attaches, so
there is no double reporting on the guide path. The exporter defaults `environment` to `production` and
`release` to `""` (`node_modules/@mastra/sentry/dist/index.js:147-150`); the empty release makes `@sentry/node`
log `Discarded session because of missing or non-string release` twice per run (the Node run documents this
warning for a missing release).

One agent turn (two `POST /v1/chat/completions` calls to the mock, both `stream=false`) produces **one `span`
envelope, zero `transaction` envelopes** (v11 stream lifecycle; the page only says "traces", which matches) with
these items, all `sentry.origin: auto.ai.mastra` except the two `http.client` ones:

| Span | op | parent | notes |
| --- | --- | --- | --- |
| `invoke_agent Weather Agent` | `gen_ai.invoke_agent` | root segment | `gen_ai.agent.name`, `gen_ai.pipeline.name`, `gen_ai.conversation.id: thread-1`, `gen_ai.system_instructions`, `gen_ai.tool.definitions`, rolled-up `gen_ai.usage.input_tokens 24 / output_tokens 14 / total_tokens 38`, `gen_ai.response.model`, `gen_ai.response.text`, plus `mastra.span.type: agent_run`, `ai.span.type`, `metadata.threadId/resourceId/runId`, raw `input`/`output` |
| `chat gpt-4o-mini` | `gen_ai.chat` | agent span | one span for both model round trips (`MODEL_STEP` skipped, as documented); `gen_ai.request.model`, `gen_ai.provider.name: openai`, `gen_ai.input.messages`, `gen_ai.output.messages`, `gen_ai.response.text`, `gen_ai.response.tool_calls`, `gen_ai.response.id`, `gen_ai.response.finish_reasons`, `gen_ai.usage.*` (24/14/38, plus `reasoning_tokens`, `cache_read.input_tokens`), `gen_ai.completion_start_time`, `gen_ai.request.stream: true` and `gen_ai.response.streaming: true` although both HTTP calls were non-streaming |
| `execute_tool weatherTool` | `gen_ai.execute_tool` | chat span | `gen_ai.tool.name: weatherTool` (the `tools` map key, not the tool `id` `get-weather`), `gen_ai.tool.type: tool`, `gen_ai.tool.call.id`, `gen_ai.tool.description`, `gen_ai.tool.call.arguments`, `gen_ai.tool.call.result`, `tool.success: true` |
| `client_tool_call get-weather` | `ai.span` | agent span | `mastra.span.type: client_tool_call` |
| `model_inference Weather Agent` x2 | `ai.span` | chat span | one per model round trip, `mastra.model_inference.output` |
| `POST 127.0.0.1` x2 | `http.client` | **root segment each** (`auto.http.node_fetch`) | same trace id, but not children of the chat span |

`sentinel` arrives as an `event` (`environment: production`, breadcrumbs include the exporter's event-span
breadcrumb `model_chunk: chunk: 'tool-result'`) and as a `test` root span. `env-only` (`new SentryExporter()`)
behaves identically because the exporter's `tracesSampleRate` default is `1`.

### Step 3, Errors (`tool-error`)

With the tool throwing `Error("weather service down for Berlin")`: an error `event` arrives (`mechanism:
generic`, `handled: true`, same trace id as the agent span), the tool span has `status: error`,
`tool.success: false`, `error.type: unknown`, `error.message`, `sentry.status.message`; the agent and chat spans
stay `ok` and the run completes with the mock's final answer. "any related errors" **holds**.

### Step 4, The SDK's own integration (`sdk-only`, `both`)

`sdk-only` (`node --import ./instrument.mjs`, no `@mastra/sentry`): console shows `"@mastra/core" injected at
runtime, subscribing now`; the default `mastraIntegration` bootstraps an observability pipeline and produces
`invoke_agent Weather Agent` (root), `chat gpt-4o-mini`, **two** `gen_ai.execute_tool` spans for the one tool
call (`execute_tool get-weather` under the agent, from Mastra's `client_tool_call` span, and `execute_tool
weatherTool` under the chat span), no `ai.span` items, the same two orphan `http.client` segments; the tool spans
carry no `gen_ai.tool.type`, `gen_ai.tool.call.id` or `tool.success`, the chat span no `gen_ai.request.stream`.
Environment and release stay unset. Nothing on either docs page describes this route.

`both` (app `Sentry.init` via `--import`, then the guide snippet): `@sentry/node` prints `[Sentry] The
@mastra/sentry package is registered alongside the built-in Mastra integration, and both are now exporting spans.
Its exporter also calls Sentry.init() itself ... Remove @mastra/sentry from your Mastra exporters; the Sentry SDK
instruments Mastra on its own.` The result is **92 integrations** (every integration installed twice), the
client replaced by the exporter's init (`environment` flips from `undefined` to `production`, `release` to
`""`), and duplicated spans in one trace: 2 x `gen_ai.invoke_agent`, 2 x `gen_ai.chat`, 3 x `gen_ai.execute_tool`.
The guide's Alert (`index.mdx:89`) leaves "confirming that the two SDK setups are compatible" to the user; the
build's answer is that they are not.

## Findings

| # | Severity | Kind | Docs | Claim | Observed | Fix |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | P1 | docs wrong | `guides/mastra/index.mdx:17-19,47,85-91`; `agent-tracing/mastra.mdx:55` | `@mastra/sentry` is the way to send Mastra data; "don't initialize Sentry a second time without first confirming that the two SDK setups are compatible" | `@sentry/node` ships a default `mastraIntegration` that instruments Mastra on its own with `--import` (`sdk-only`), and when both are present the SDK logs "Remove `@mastra/sentry` from your Mastra `exporters`", installs 92 integrations, replaces the app client and duplicates every gen_ai span (`both`) | Document the built-in integration (`Sentry.init` + `--import`, no `@mastra/sentry`) for apps that call `Sentry.init`, and state that `@mastra/sentry` must not be combined with it |
| 2 | P2 | docs wrong | `agent-tracing/mastra.mdx:140-172` | model spans carry `gen_ai.system`, `gen_ai.request.messages`, `gen_ai.request.temperature`; tool spans `gen_ai.tool.type: function`, `gen_ai.tool.input`, `gen_ai.tool.output`; agent spans `gen_ai.agent.instructions` | the build sends `gen_ai.provider.name`, `gen_ai.input.messages`/`gen_ai.output.messages`, `gen_ai.tool.type: tool`, `gen_ai.tool.call.arguments`/`gen_ai.tool.call.result`, `gen_ai.system_instructions`; no `gen_ai.request.temperature`; `gen_ai.request.stream: true` on a non-streaming call | Replace the attribute list with the names the exporter emits |
| 3 | P2 | SDK limit | `guides/mastra/index.mdx:95` | the Agents page shows the agent run with its model generations | the model HTTP calls appear as two extra `http.client` root segments (`POST 127.0.0.1`) in the same trace, not under `gen_ai.chat`, on both the exporter and the built-in route | Say that outgoing model requests show up as separate `http.client` segments |
| 4 | P2 | SDK limit | (none) | one tool call per run | the built-in `mastraIntegration` emits two `gen_ai.execute_tool` spans per tool call (`client_tool_call` and `tool_call`), so tool counts double on that route | none docs-side until the SDK maps `client_tool_call` elsewhere |
| 5 | P2 | docs wrong | `guides/mastra/index.mdx:83`; `agent-tracing/mastra.mdx:61` | the exporter reads `SENTRY_ENVIRONMENT` and `SENTRY_RELEASE` | unset, they default to `environment: "production"` and `release: ""`; the empty release logs `Discarded session because of missing or non-string release` twice per run | Name the defaults and tell users to set `SENTRY_RELEASE` |
| 6 | P2 | docs wrong | `guides/mastra/index.mdx:47`; `agent-tracing/mastra.mdx:55` | "The exporter includes it as a dependency" | `@mastra/sentry@1.2.16` pins `@sentry/node ^10.68.0`; the develop build (`10.67.0`) only installs through `overrides` | Mention that the `@sentry/node` version is chosen by `@mastra/sentry`, not by the user |

Holds: the span type to op table (`AGENT_RUN`, `MODEL_GENERATION`, `TOOL_CALL`, `GENERIC`), `sentry.origin:
auto.ai.mastra`, `metadata.threadId` -> `gen_ai.conversation.id`, token usage on the chat span and rolled up on
the agent span, `MODEL_STEP`/`MODEL_CHUNK` skipped, error capture for a throwing tool, `tracesSampleRate` default
above 0, Node `>=22.13.0` (run on `v26.5.0`).
