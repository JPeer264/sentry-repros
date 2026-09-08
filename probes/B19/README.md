# B19 — OpenAI SDK on Bun via the plugin build (mock server)

Runtime: `bun` 1.4.0 · SDK: `develop` tarballs at 10.67.0 (`_toolbox/pack/*.tgz`) · Recorded verdict: **works**

## What it reproduces

A `Bun.serve` app with a module-scope `openai` client pointed at a local mock chat-completions server,
built two ways from the same source. Built with `Bun.build` + `sentryBunPlugin()` from `@sentry/bun/plugin`
and run as `bun dist/app.js`, the OpenAI integration records a `gen_ai.chat` span named `chat gpt-4o-mini`
with `gen_ai.request.model`, `gen_ai.usage.input_tokens=5` / `output_tokens=7` / `total_tokens=12` and
origin `auto.ai.openai`, alongside the `http.client` fetch child inside the `GET /ai` transaction. Run
plainly as `bun run app.ts`, the same code produces only the transaction and its `http.client` span, no
`gen_ai` span anywhere, and the SDK warns (`debug: true`) that no diagnostics-channel injection was
detected. Note the `gen_ai.chat` span ships as a standalone `span` (span-v2) envelope item even though
the app runs with `traceLifecycle: 'static'`, so it is *not* nested in `transaction.spans`.

## Install

```sh
cd $REPRO/probes/B19 && npm install --no-audit --no-fund
```

(`package.json` points at the mirrored develop tarballs in `../../_toolbox/pack/`; `openai` is pinned to
7.10.0. `bun add` cannot resolve the tarballs' transitive `@sentry/*@10.67.0` deps — use npm, then run
with bun.)

## Run

From this directory. `dist/app.js` is committed, so the build step is only needed if you change `app.ts`.
Ports are arbitrary; pick free ones.

```sh
PORT=51871 node sink.mjs > sink.log 2>&1 & SP=$!
PORT=51872 node mock-openai.mjs > mock.log 2>&1 & MP=$!
sleep 1

# plugin build
bun run build.ts > build.log 2>&1            # writes dist/app.js; grep -c orchestrion:openai dist/app.js -> 4
SINK_PORT=51871 MOCK_PORT=51872 PORT=51873 SENTRY_DEBUG=1 bun dist/app.js > app-plugin.log 2>&1 & AP=$!
sleep 4
node drive.mjs 51873 51871 > drive-plugin.log 2>&1
kill $AP; wait $AP

# baseline: plain bun run
SINK_PORT=51871 MOCK_PORT=51872 PORT=51875 SENTRY_DEBUG=1 bun run app.ts > app-plain.log 2>&1 & BP=$!
sleep 4
node drive.mjs 51875 51871 > drive-plain.log 2>&1
kill $BP; wait $BP

kill $MP; kill $SP; wait $MP $SP
```

`drive.mjs` clears the sink, hits `/ai`, then `/sentinel` (which calls `Sentry.captureMessage('sentinel')`)
and polls `/__items` until the sentinel event has arrived, so everything sent before it is known to be in
the sink. Results land in `drive-plugin.log` and `drive-plain.log`.

Files: `instrument.ts` (Sentry init, imported first, `traceLifecycle: 'static'`), `app.ts` (`Bun.serve`
with a module-scope OpenAI client), `build.ts` (Bun.build + `sentryBunPlugin`), `sink.mjs` (envelope sink,
extended from `_toolbox/sink.mjs` to keep per-span `sentry.op` / `sentry.origin` / `gen_ai.*` attributes),
`mock-openai.mjs` (mock `/v1/chat/completions` server), `drive.mjs` (plain-node driver).

## Expected

Recorded verdict: **works**.

Plugin build (`bun build` + `sentryBunPlugin`, then `bun dist/app.js`) records a `gen_ai.chat` span named
`chat gpt-4o-mini` with `gen_ai.request.model`, `gen_ai.usage.input_tokens=5`, `output_tokens=7`,
`total_tokens=12`, origin `auto.ai.openai`, plus a nested `http.client` fetch span inside the `GET /ai`
transaction. Plain `bun run app.ts` records only the transaction and the `http.client` fetch span, no
`gen_ai` span, and warns `No diagnostics-channel injection detected` (`debug: true`).

Recorded evidence lines:

```
PLUGIN BUILD (bun dist/app.js), sink items:
{"type":"transaction","name":"GET /ai","op":"http.server","source":"route","status":"ok","spans":[{"span":"http.client POST http://127.0.0.1:47312/v1/chat/completions","attrs":{"sentry.origin":"auto.http.fetch","sentry.op":"http.client"}}]}
{"type":"span","items":[{"span":"gen_ai.chat chat gpt-4o-mini","attrs":{"sentry.origin":"auto.ai.openai","sentry.op":"gen_ai.chat","gen_ai.provider.name":"openai","gen_ai.operation.name":"chat","gen_ai.request.model":"gpt-4o-mini","gen_ai.input.messages":"[{\"role\":\"user\",\"content\":\"Say hi\"}]","gen_ai.response.id":"chatcmpl-mock1","gen_ai.response.model":"gpt-4o-mini","gen_ai.usage.input_tokens":5,"gen_ai.usage.output_tokens":7,"gen_ai.usage.total_tokens":12,"gen_ai.response.finish_reasons":"[\"stop\"]","gen_ai.response.text":"[\"Hello from mock\"]"}}]}
{"type":"event","message":"sentinel","sdk":"sentry.javascript.bun","runtime":"bun"}
app log: `Sentry Logger [log]: [instrumentation:openai] Bun/Deno, subscribing eagerly` / `Integration installed: OpenAI` / `[Tracing] Finishing "gen_ai.chat" span "chat gpt-4o-mini"`

PLAIN `bun run app.ts`, sink items:
{"type":"transaction","name":"GET /ai","op":"http.server","source":"route","status":"ok","spans":[{"span":"http.client POST http://127.0.0.1:47312/v1/chat/completions","attrs":{"sentry.origin":"auto.http.fetch","sentry.op":"http.client"}}]}
{"type":"event","message":"sentinel","sdk":"sentry.javascript.bun","runtime":"bun"}
(no `span` item, no gen_ai.* anywhere)
app log: `Sentry Logger [warn]: [Sentry] No diagnostics-channel injection detected. Channel-based integrations will not record spans. Make sure the diagnostics channels are injected via the runtime `--import` hook or a bundler plugin before the instrumented modules load.`
```

## Observed on 2026-09-07

Rebuilt and run once. **Matches the recorded verdict** — `works`, attribute for attribute.

`grep -c orchestrion:openai dist/app.js` -> `4`.

Plugin build (`bun dist/app.js`), `drive-plugin.log`:

```
{"route":"/ai","status":200,"body":{"text":"Hello from mock","usage":{"prompt_tokens":5,"completion_tokens":7,"total_tokens":12}}}
--- sink items ---
{"type":"transaction","name":"GET /ai","op":"http.server","source":"route","status":"ok","spans":[{"span":"http.client POST http://127.0.0.1:51872/v1/chat/completions","attrs":{"sentry.origin":"auto.http.fetch","sentry.op":"http.client"}}]}
{"type":"span","items":[{"span":"gen_ai.chat chat gpt-4o-mini","attrs":{"sentry.origin":"auto.ai.openai","sentry.op":"gen_ai.chat","gen_ai.provider.name":"openai","gen_ai.operation.name":"chat","gen_ai.request.model":"gpt-4o-mini","gen_ai.input.messages":"[{\"role\":\"user\",\"content\":\"Say hi\"}]","gen_ai.response.id":"chatcmpl-mock1","gen_ai.response.model":"gpt-4o-mini","gen_ai.usage.input_tokens":5,"gen_ai.usage.output_tokens":7,"gen_ai.usage.total_tokens":12,"gen_ai.response.finish_reasons":"[\"stop\"]","gen_ai.response.text":"[\"Hello from mock\"]"}}]}
{"type":"event","message":"sentinel","sdk":"sentry.javascript.bun","runtime":"bun"}
{"type":"transaction","name":"GET /sentinel","op":"http.server","source":"route","status":"ok","spans":[]}
```

`app-plugin.log`:

```
Sentry Logger [log]: [instrumentation:openai] Bun/Deno, subscribing eagerly
Sentry Logger [log]: [instrumentation:openai] subscribing to channels
Sentry Logger [log]: Integration installed: OpenAI
Sentry Logger [log]: [Tracing] Finishing "gen_ai.chat" span "chat gpt-4o-mini" with ID a46a167f0431d6e1
```

Plain `bun run app.ts`, `drive-plain.log`:

```
{"route":"/ai","status":200,"body":{"text":"Hello from mock","usage":{"prompt_tokens":5,"completion_tokens":7,"total_tokens":12}}}
--- sink items ---
{"type":"transaction","name":"GET /ai","op":"http.server","source":"route","status":"ok","spans":[{"span":"http.client POST http://127.0.0.1:51872/v1/chat/completions","attrs":{"sentry.origin":"auto.http.fetch","sentry.op":"http.client"}}]}
{"type":"event","message":"sentinel","sdk":"sentry.javascript.bun","runtime":"bun"}
{"type":"transaction","name":"GET /sentinel","op":"http.server","source":"route","status":"ok","spans":[]}
```

`app-plain.log`:

```
Sentry Logger [log]: [instrumentation:openai] Bun/Deno, subscribing eagerly
Sentry Logger [log]: [instrumentation:openai] subscribing to channels
Sentry Logger [log]: Integration installed: OpenAI
Sentry Logger [warn]: [Sentry] No diagnostics-channel injection detected. Channel-based integrations will not record spans. Make sure the diagnostics channels are injected via the runtime `--import` hook or a bundler plugin before the instrumented modules load.
```

Differences from the record are cosmetic only: fresh ports (mock on 51872 instead of 47312) and a fresh
span id, plus a trailing `GET /sentinel` transaction that the recorded evidence trimmed away. The recorded
notes still hold on this run: the `gen_ai.chat` span arrives as a standalone `span` envelope item under
`traceLifecycle: 'static'`, and develop records `gen_ai.input.messages` / `gen_ai.response.text` without
`sendDefaultPii`.

Not rebuilt: the 10.73.0 comparison arm from the record's notes (origin `auto.ai.orchestrion.openai`,
`gen_ai.system`, no `http.client` child, no warning). The rebuild brief is develop-only.
