# D17 - OpenAI SDK on Deno via the hook (mock server)

Runtime: deno 2.9.0 | SDK: `@sentry/deno` 10.67.0 (develop line, tarballs in `_toolbox/pack/`) | `openai` 7.9.0

## What it reproduces

A Deno server initialises `@sentry/deno` against a local envelope sink, creates an `openai` client
pointed at a local mock chat-completions server, and serves `/ai` (one `chat.completions.create`
call) plus `/sentinel` (a `captureException` used as the arrival sentinel). Three entries differ only
in how `openai` is loaded: `main.ts` uses the module hook (`import "@sentry/deno/import";` first
line) together with the documented `import OpenAI from "openai"`, `main-nohook.ts` uses the same ESM
import without the hook, and `main-cjs2.ts` keeps the hook but loads the package as CommonJS through
`createRequire(import.meta.url)("openai")`. Three small probes explain the difference:
`probe-esm.ts` / `probe-cjs2.ts` print the source of `OpenAI.Chat.Completions.prototype.create` to
show whether the instrumentation wrapper was injected, and `probe-format.ts` registers its own
`Module.registerHooks` load hook to print the `format` Deno reports for openai's ESM
`completions.mjs`. The point is whether the natural ESM import gets `gen_ai` spans on Deno.

## Install

From this directory:

```
npm install --no-audit --no-fund
```

(`package.json` points at the `_toolbox/pack/` tarballs plus `openai@7.9.0`; `deno.json` sets
`nodeModulesDir: "manual"`, so Deno uses the resulting `node_modules` as-is.)

## Run

From this directory. The ports default to sink 41317, mock 41318, app 41319 and can be overridden as
the third to fifth argument of `run.sh` (`./run.sh main.ts hook 47101 47102 47103`, the ports the
"Observed" run below used); check a port first with `lsof -nP -iTCP:41317`.

```
./run.sh main.ts hook              # hook + ESM import
./run.sh main-nohook.ts nohook     # no hook, ESM import
./run.sh main-cjs2.ts cjs2         # hook + createRequire("openai")

deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys probe-esm.ts
deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys probe-cjs2.ts
deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys probe-format.ts

SENTRY_DEBUG=1 ./run.sh main.ts hookdbg   # SDK debug log, see app-hookdbg.log
```

`run.sh` starts `sink.mjs` (envelope sink, keeps every span attribute; `RAW_FILE` writes the raw
payloads to `raw-<label>.ndjson`) and `mock.mjs` (mock OpenAI server that logs each request and
answers a fixed chat completion) on those ports, runs
`SINK_PORT=.. MOCK_PORT=.. APP_PORT=.. deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys <entry>`,
then `node drive.mjs <appPort> <sinkPort>` (GET `/ai`, GET `/sentinel`, wait until the sentinel event
is in the sink, print the items), and kills all three processes. Per-run output lands in
`items-<label>.log`, `app-<label>.log`, `mock-<label>.log`, `sink-<label>.log`.

## Expected

Recorded verdict: **broken**.

With the hook and the documented `import OpenAI from "openai"` the request reaches the mock and the
`http.server` span arrives, but no `gen_ai` span is emitted; the ESM `completions.mjs` is never
transformed. Without the hook: no `gen_ai` span either (expected). The instrumentation itself works
on Deno when `openai` is loaded as CommonJS via `createRequire(import.meta.url)("openai")`: then a
`gen_ai.chat chat gpt-4o-mini` span with model and token attributes arrives.

Recorded evidence lines:

```
hook, ESM import (items2-hook.json):
{"type":"event","message":"sentinel","exception":"sentinel","sdk":"sentry.javascript.deno"}
{"type":"span","items":[{"span":"http.server GET","attrs":{"sentry.origin":"auto.http.deno","sentry.op":"http.server"}}]}
{"type":"span","items":[{"span":"http.server GET","attrs":{"sentry.origin":"auto.http.deno","sentry.op":"http.server"}}]}
mock2-hook.log: MOCK POST /v1/chat/completions {"model":"gpt-4o-mini","messages":[{"role":"user","content":"Say hi"}]}

no hook (items2-nohook.json): identical, only the two `http.server GET` span envelopes and the sentinel event.

hook, CJS require (items2-cjs2.json):
{"span":"gen_ai.chat chat gpt-4o-mini","attrs":{"sentry.origin":"auto.ai.openai","sentry.op":"gen_ai.chat","gen_ai.provider.name":"openai","gen_ai.operation.name":"chat","gen_ai.request.model":"gpt-4o-mini","gen_ai.input.messages":"[{\"role\":\"user\",\"content\":\"Say hi\"}]","gen_ai.response.id":"chatcmpl-mock123","gen_ai.response.model":"gpt-4o-mini","gen_ai.usage.input_tokens":12,"gen_ai.usage.output_tokens":7,"gen_ai.usage.total_tokens":19,"gen_ai.response.finish_reasons":"[\"stop\"]","gen_ai.response.text":"[\"Hello from the mock\"]"}}

probe-esm.ts: `create(body, options) { return this._client.post('/chat/completions', ...` (untransformed)
probe-cjs2.ts: `create(__apm$arg0, __apm$arg1, ...__apm$args) { const __apm$arguments = ...` (transformed)
probe-format.ts (Module.registerHooks load wrapper): `load format for openai/resources/chat/completions/completions.mjs => undefined ctx.format: undefined source type: string`
SENTRY_DEBUG=1 (app2-hookdbg.log): `[instrumentation:openai] Bun/Deno, subscribing eagerly` / `Integration installed: OpenAI`, no `failed to inject` line.
```

Recorded root cause: the hook's load path in `@apm-js-collab/tracing-hooks` derives the module type
from `result.format`; on Deno 2.9.0 `Module.registerHooks`' `nextLoad` returns `format: undefined`
for openai's `resources/chat/completions/completions.mjs`, so the ESM file is handed back
untransformed and no `failed to inject` warning is logged, while the CommonJS `completions.js`
loaded through `createRequire` does get the `__apm$` wrapper.

## Observed on 2026-09-07

Matches the recorded verdict. Rebuilt from the `_toolbox/pack/` tarballs plus `openai@7.9.0`
(`npm install`), run with `./run.sh <entry> <label> 47101 47102 47103`. Full output in
`items-*.log` / `raw-*.ndjson`; the lines below are trimmed to the attributes that carry the verdict
(the `sentry.sdk.integrations` list, the device/os attributes and the request headers are cut).

```
== hook (main.ts)
/ai -> 200 {"id":"chatcmpl-mock123","object":"chat.completion","created":1700000000,"model":"gpt-4o-mini","choices":[{"index":0,"message":{"role":"assistant","content":"Hello from the mock"},"finish_reason":"sto
/sentinel -> 200 sentinel
{"type":"span","items":[{"span":"http.server GET","attrs":{"sentry.origin":"auto.http.deno","sentry.op":"http.server","sentry.segment.name.source":"url","sentry.sample_rate":1,"http.request.method":"GET","url.full":"http://127.0.0.1:47103/ai","url.path":"/ai","http.response.status_code":200,"sentry.trace_lifecycle":"stream","sentry.segment.name":"GET","sentry.segment.id":"9297b5d13119c4af","sentry.sdk.name":"sentry.javascript.deno","sentry.sdk.version":"10.67.0",...}}]}
{"type":"event","exception":"sentinel","sdk":"sentry.javascript.deno"}
== mock:
MOCK POST /v1/chat/completions {"model":"gpt-4o-mini","messages":[{"role":"user","content":"Say hi"}]}

== nohook (main-nohook.ts)
/ai -> 200 {"id":"chatcmpl-mock123","object":"chat.completion",...}
/sentinel -> 200 sentinel
{"type":"span","items":[{"span":"http.server GET","attrs":{"sentry.origin":"auto.http.deno","sentry.op":"http.server","url.full":"http://127.0.0.1:47103/ai","url.path":"/ai","http.response.status_code":200,...}}]}
{"type":"event","exception":"sentinel","sdk":"sentry.javascript.deno"}
(grep -c gen_ai items-nohook.log -> 0; items-hook.log -> 0; items-cjs2.log -> 1)
== mock:
MOCK POST /v1/chat/completions {"model":"gpt-4o-mini","messages":[{"role":"user","content":"Say hi"}]}

== cjs2 (main-cjs2.ts)
/ai -> 200 {"id":"chatcmpl-mock123","object":"chat.completion",...}
/sentinel -> 200 sentinel
{"type":"span","items":[{"span":"gen_ai.chat chat gpt-4o-mini","attrs":{"sentry.origin":"auto.ai.openai","sentry.op":"gen_ai.chat","gen_ai.provider.name":"openai","gen_ai.operation.name":"chat","gen_ai.request.model":"gpt-4o-mini","gen_ai.input.messages":"[{\"role\":\"user\",\"content\":\"Say hi\"}]","gen_ai.response.id":"chatcmpl-mock123","gen_ai.response.model":"gpt-4o-mini","gen_ai.usage.input_tokens":12,"gen_ai.usage.output_tokens":7,"gen_ai.usage.total_tokens":19,"gen_ai.response.finish_reasons":"[\"stop\"]","gen_ai.response.text":"[\"Hello from the mock\"]","sentry.trace_lifecycle":"stream","sentry.segment.name":"GET","sentry.segment.id":"948763a4c8b2beb5"}},{"span":"http.server GET","attrs":{"sentry.origin":"auto.http.deno","sentry.op":"http.server","url.path":"/ai","sentry.segment.id":"948763a4c8b2beb5",...}}]}
{"type":"event","exception":"sentinel","sdk":"sentry.javascript.deno"}
== mock:
MOCK POST /v1/chat/completions {"model":"gpt-4o-mini","messages":[{"role":"user","content":"Say hi"}]}

== probes.log
ESM create source: create(body, options) {         return this._client.post('/chat/completions', {             body,             ...options,             stream: body.stream ?? fal
CJS create source: create(__apm$arg0, __apm$arg1, ...__apm$args) {     const __apm$arguments = [__apm$arg0, __apm$arg1, ...__apm$args].slice(0, arguments.length);     const __apm$
load format for openai/resources/chat/completions/completions.mjs => undefined ctx.format: undefined source type: string

== app-hookdbg.log (SENTRY_DEBUG=1 ./run.sh main.ts hookdbg 47101 47102 47103)
Sentry Logger [log]: [instrumentation:openai] Bun/Deno, subscribing eagerly
Sentry Logger [log]: [instrumentation:openai] subscribing to channels
Sentry Logger [log]: Integration installed: OpenAI
```

Every recorded element reproduces: the mock is hit in all three runs, the hook + ESM run emits only
an `http.server GET` span and no `gen_ai` span, the no-hook run is identical, the CJS-require run
emits the `gen_ai.chat chat gpt-4o-mini` span with `sentry.origin: auto.ai.openai` and the same
model, token, finish-reason and response-text attributes, the ESM `create` is untransformed while
the CJS one carries the `__apm$` wrapper, `nextLoad` reports `format: undefined` for
`completions.mjs`, and the debug log shows the OpenAI integration installed and subscribing with no
`failed to inject` line.

Differences from the record, all cosmetic:

- The record shows two `http.server GET` span envelopes per run; here the driver stops as soon as the
  sentinel event is in the sink, so the `/sentinel` request's own span is usually still in flight and
  only the `/ai` span is listed. The verdict-carrying part (no `gen_ai` span with the ESM import) is
  unaffected.
- The sentinel event prints as `{"type":"event","exception":"sentinel",...}` because this rebuild
  captures `new Error("sentinel")`; the record's line also carried `message`.
- The SDK is installed from the `_toolbox/pack/` tarballs instead of the record's symlinks into the
  build worktree, so the install is reproducible.

## Files

- `app.ts` - shared `Sentry.init`, `Deno.serve` with `/ai` and `/sentinel`, openai client options
- `main.ts` - hook (`import "@sentry/deno/import"`) + `import OpenAI from "openai"`
- `main-nohook.ts` - same ESM import, no hook
- `main-cjs2.ts` - hook + `createRequire(import.meta.url)("openai")`
- `probe-esm.ts`, `probe-cjs2.ts` - print `Chat.Completions.prototype.create` source for each load path
- `probe-format.ts` - own `Module.registerHooks` load hook printing the `format` Deno reports for `completions.mjs`
- `mock.mjs` - mock OpenAI chat-completions server, logs each request
- `sink.mjs` - envelope sink keeping full span attributes (`RAW_FILE` for raw payloads)
- `drive.mjs` - hits `/ai` and `/sentinel`, waits for the sentinel, prints the sink items
- `run.sh` - starts sink and mock, runs one entry, drives it, prints items and mock log, kills everything
- `items-*.log`, `app-*.log`, `mock-*.log`, `sink-*.log`, `raw-*.ndjson`, `probes.log` - output of the run above
