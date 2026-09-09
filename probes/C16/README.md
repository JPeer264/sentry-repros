# C16 - OpenAI SDK on Workers via the Vite plugin (mock server)

Runtime: Cloudflare Workers (`wrangler dev` 4.129.0 / workerd 1.20260903.1, vite 8.2.2,
`@cloudflare/vite-plugin` 1.54.4) | SDK: `@sentry/cloudflare` 10.67.0 (develop line, tarballs in
`_toolbox/pack/`) | `openai` 7.10.0

## What it reproduces

A Worker wrapped in `withSentry` (`tracesSampleRate: 1`, `sendDefaultPii: true`, `tunnel` from the
`SINK_URL` var) creates an `OpenAI` client at module scope pointed at a local mock OpenAI server, and
answers `/ai` with one `client.chat.completions.create({model: 'gpt-4o-mini', messages: [...]})` call,
`/injected` with the channel integrations the build injected, and `/sentinel` with a sink sentinel.
The same source is run three ways to see where the `gen_ai.chat` span comes from: built by `vite build`
with `cloudflare()` + `sentryCloudflareVitePlugin()` and no flags (the plugin should inject
`tracingChannel("orchestrion:openai:chat")` into the bundled `openai` package and register the matching
subscriber), run by plain `wrangler dev` on `src/index.ts` with no plugin at all, and run by plain
`wrangler dev` on `src/manual.ts`, which is the same Worker with `Sentry.instrumentOpenAiClient(client)`
around the client instead.

## Install

From this directory:

```
npm install --no-audit --no-fund \
  ../../_toolbox/pack/sentry-cloudflare-10.67.0.tgz \
  ../../_toolbox/pack/sentry-core-10.67.0.tgz \
  ../../_toolbox/pack/sentry-opentelemetry-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  openai@7.10.0 vite @cloudflare/vite-plugin wrangler@4
```

## Run

The mock OpenAI base URL (`http://127.0.0.1:51213/v1`) is baked into `src/index.ts` and
`src/manual.ts`, the sink URL (`http://127.0.0.1:51216/`) into both wrangler configs. Change them
together if those ports are taken. From this directory:

```
PORT=51213 node mock-openai.mjs > mock.log 2>&1 & mpid=$!
PORT=51216 node sink.mjs > sink.log 2>&1 & spid=$!

# 1) vite plugin
npx vite build > vite-build.log 2>&1
grep -c 'tracingChannel("orchestrion:openai:chat")' dist/c16_develop/index.js
npx wrangler dev --config dist/c16_develop/wrangler.json --port 51413 --inspector-port 0 > app-vite.log 2>&1 & apid=$!
for i in $(seq 1 60); do grep -q "Ready on http://localhost:51413" app-vite.log && break; sleep 1; done
node drive.mjs 51413 51216 > result-vite.json 2>&1
kill $apid; wait $apid

# 2) no plugin
npx wrangler dev --config wrangler.jsonc --port 51415 --inspector-port 0 > app-plain.log 2>&1 & apid=$!
for i in $(seq 1 60); do grep -q "Ready on http://localhost:51415" app-plain.log && break; sleep 1; done
node drive.mjs 51415 51216 > result-plain.json 2>&1
kill $apid; wait $apid

# 3) no plugin, manual instrumentOpenAiClient
npx wrangler dev --config wrangler.manual.jsonc --port 51417 --inspector-port 0 > app-manual.log 2>&1 & apid=$!
for i in $(seq 1 60); do grep -q "Ready on http://localhost:51417" app-manual.log && break; sleep 1; done
node drive.mjs 51417 51216 > result-manual.json 2>&1
kill $apid; wait $apid

kill $mpid; kill $spid; wait $mpid; wait $spid
```

Run the three `wrangler dev` processes one after another, never two at once in this directory: the
recorded run noted that two simultaneous `wrangler dev` processes in the same directory crash one of
them. `drive.mjs` clears the sink, calls `/ai` twice, `/injected` and `/sentinel`, then polls the sink
until the sentinel event is there and prints the whole sink. `sink.mjs` is `_toolbox/sink.mjs` with
the span mapping extended to keep, per span, `name`, `op`, whether it has a parent, `status` and every
`sentry.origin` / `sentry.op` / `gen_ai.*` attribute.

## Expected

Recorded verdict: **works**.

With `cloudflare()` + `sentryCloudflareVitePlugin()` (no flags), `vite build` injects
`tracingChannel("orchestrion:openai:chat")` into the `openai@7.10.0` bundle and each `/ai` request
produces a `gen_ai.chat` span (name `chat gpt-4o-mini`, origin `auto.ai.openai`) with request/response
model, input/output/total token counts, response id, finish reasons and response text, parented under
the `http.server` span. Plain `wrangler dev` on `src/index.ts` (no plugin) yields only the
`http.server` span and no `gen_ai` span. Manual `Sentry.instrumentOpenAiClient(client)` at module
scope without the plugin produces the identical `gen_ai.chat` span with the same attributes.

Recorded evidence lines:

```
[vite plugin, wrangler dev --config dist/c16_develop/wrangler.json, sink 41213]
{"type":"span","items":[{"name":"chat gpt-4o-mini","op":"gen_ai.chat","parent":true,"status":"ok","attrs":{"sentry.origin":"auto.ai.openai","sentry.op":"gen_ai.chat","gen_ai.provider.name":"openai","gen_ai.operation.name":"chat","gen_ai.request.model":"gpt-4o-mini","gen_ai.input.messages":"[{\"role\":\"user\",\"content\":\"Say hi\"}]","gen_ai.response.id":"chatcmpl-mock-1","gen_ai.response.model":"gpt-4o-mini-2025-01-01","gen_ai.usage.input_tokens":12,"gen_ai.usage.output_tokens":7,"gen_ai.usage.total_tokens":19,"gen_ai.response.finish_reasons":"[\"stop\"]","gen_ai.response.text":"[\"Hello from the mock (1)\"]"}},{"name":"GET","op":"http.server","parent":false,"status":"ok","attrs":{"sentry.origin":"auto.http.cloudflare","sentry.op":"http.server"}}]}
(second /ai identical with chatcmpl-mock-2), then {"type":"event","message":"sentinel","sdk":"sentry.javascript.cloudflare","sdkVersion":"10.67.0"}
GET /injected -> {"integrations":["openai"],"bundler":["openai"]}
grep -o 'tracingChannel("orchestrion:openai:chat")' dist/c16_develop/index.js -> 1 hit

[no plugin, wrangler dev --config wrangler.jsonc, sink 41213]
{"type":"span","items":[{"name":"GET","op":"http.server","parent":false,"status":"ok","attrs":{"sentry.origin":"auto.http.cloudflare","sentry.op":"http.server"}}]}
(x2 for the two /ai calls; no gen_ai item anywhere), then {"type":"event","message":"sentinel",..."sdkVersion":"10.67.0"}

[no plugin, instrumentOpenAiClient(client), wrangler dev --config wrangler.manual.jsonc, sink 41213]
{"type":"span","items":[{"name":"chat gpt-4o-mini","op":"gen_ai.chat","parent":true,"status":"ok","attrs":{"sentry.origin":"auto.ai.openai","sentry.op":"gen_ai.chat","gen_ai.provider.name":"openai","gen_ai.operation.name":"chat","gen_ai.request.model":"gpt-4o-mini","gen_ai.input.messages":"[{\"role\":\"user\",\"content\":\"Say hi\"}]","gen_ai.response.id":"chatcmpl-mock-7","gen_ai.response.model":"gpt-4o-mini-2025-01-01","gen_ai.usage.input_tokens":12,"gen_ai.usage.output_tokens":7,"gen_ai.usage.total_tokens":19,"gen_ai.response.finish_reasons":"[\"stop\"]","gen_ai.response.text":"[\"Hello from the mock (7)\"]"}},{"name":"GET","op":"http.server","parent":false,"status":"ok","attrs":{"sentry.origin":"auto.http.cloudflare","sentry.op":"http.server"}}]}

[mock log] mock POST /v1/chat/completions auth=Bearer test-key body={"model":"gpt-4o-mini","messages":[{"role":"user","content":"Say hi"}]}  (one line per /ai call)
```

The record also notes: in no variant does the outgoing `fetch` to the mock produce an `http.client`
span, because the `openai` client captures `globalThis.fetch` at construction (module scope) before
`withSentry` instruments it; and the sentinel `captureMessage` event carries
`exception.values[0].value === "sentinel"` on develop.

## Observed on 2026-09-07

Matches the recorded verdict (**works**), for all three variants. Verbatim trimmed output of the run
above (`result-vite.json`, `result-plain.json`, `result-manual.json`, `mock.log`, `vite-build.log` in
this directory):

```
$ grep -c 'tracingChannel("orchestrion:openai:chat")' dist/c16_develop/index.js
1

[vite plugin, wrangler dev --config dist/c16_develop/wrangler.json, port 51413, sink 51216]
GET /ai (1) -> 200 {"id":"chatcmpl-mock-1","text":"Hello from the mock (1)"}
GET /ai (2) -> 200 {"id":"chatcmpl-mock-2","text":"Hello from the mock (2)"}
GET /injected -> {"integrations":["OpenAI"],"bundler":["openai"]}
{"type": "span", "items": [{"name": "chat gpt-4o-mini", "op": "gen_ai.chat", "parent": true, "status": "ok", "attrs": {"sentry.origin": "auto.ai.openai", "sentry.op": "gen_ai.chat", "gen_ai.provider.name": "openai", "gen_ai.operation.name": "chat", "gen_ai.request.model": "gpt-4o-mini", "gen_ai.input.messages": "[{\"role\":\"user\",\"content\":\"Say hi\"}]", "gen_ai.response.id": "chatcmpl-mock-1", "gen_ai.response.model": "gpt-4o-mini-2025-01-01", "gen_ai.usage.input_tokens": 12, "gen_ai.usage.output_tokens": 7, "gen_ai.usage.total_tokens": 19, "gen_ai.response.finish_reasons": "[\"stop\"]", "gen_ai.response.text": "[\"Hello from the mock (1)\"]"}}, {"name": "GET", "op": "http.server", "parent": false, "status": "ok", "attrs": {"sentry.origin": "auto.http.cloudflare", "sentry.op": "http.server"}}]}
{"type": "span", "items": [{"name": "chat gpt-4o-mini", "op": "gen_ai.chat", "parent": true, "status": "ok", "attrs": {... identical ..., "gen_ai.response.id": "chatcmpl-mock-2", "gen_ai.response.text": "[\"Hello from the mock (2)\"]"}}, {"name": "GET", "op": "http.server", "parent": false, "status": "ok", ...}]}
{"type": "span", "items": [{"name": "GET", "op": "http.server", "parent": false, "status": "ok", ...}]}          # /injected
{"type": "event", "message": "sentinel", "exception": "undefined: sentinel", "sdk": "sentry.javascript.cloudflare", "sdkVersion": "10.67.0"}
{"type": "span", "items": [{"name": "GET", "op": "http.server", "parent": false, "status": "ok", ...}]}          # /sentinel

[no plugin, wrangler dev --config wrangler.jsonc, port 51415, sink 51216]
GET /ai (1) -> 200 {"id":"chatcmpl-mock-3","text":"Hello from the mock (3)"}
GET /ai (2) -> 200 {"id":"chatcmpl-mock-4","text":"Hello from the mock (4)"}
GET /injected -> {"integrations":[],"bundler":[]}
{"type": "span", "items": [{"name": "GET", "op": "http.server", "parent": false, "status": "ok", "attrs": {"sentry.origin": "auto.http.cloudflare", "sentry.op": "http.server"}}]}
{"type": "span", "items": [{"name": "GET", "op": "http.server", "parent": false, "status": "ok", ...}]}
{"type": "span", "items": [{"name": "GET", "op": "http.server", "parent": false, "status": "ok", ...}]}
{"type": "event", "message": "sentinel", "exception": "undefined: sentinel", "sdk": "sentry.javascript.cloudflare", "sdkVersion": "10.67.0"}
{"type": "span", "items": [{"name": "GET", "op": "http.server", "parent": false, "status": "ok", ...}]}
-> no gen_ai item anywhere in result-plain.json

[no plugin, instrumentOpenAiClient(client), wrangler dev --config wrangler.manual.jsonc, port 51417, sink 51216]
GET /ai (1) -> 200 {"id":"chatcmpl-mock-5","text":"Hello from the mock (5)"}
GET /ai (2) -> 200 {"id":"chatcmpl-mock-6","text":"Hello from the mock (6)"}
GET /injected -> {"integrations":[],"bundler":[]}
{"type": "span", "items": [{"name": "chat gpt-4o-mini", "op": "gen_ai.chat", "parent": true, "status": "ok", "attrs": {"sentry.origin": "auto.ai.openai", "sentry.op": "gen_ai.chat", "gen_ai.provider.name": "openai", "gen_ai.operation.name": "chat", "gen_ai.request.model": "gpt-4o-mini", "gen_ai.input.messages": "[{\"role\":\"user\",\"content\":\"Say hi\"}]", "gen_ai.response.id": "chatcmpl-mock-5", "gen_ai.response.model": "gpt-4o-mini-2025-01-01", "gen_ai.usage.input_tokens": 12, "gen_ai.usage.output_tokens": 7, "gen_ai.usage.total_tokens": 19, "gen_ai.response.finish_reasons": "[\"stop\"]", "gen_ai.response.text": "[\"Hello from the mock (5)\"]"}}, {"name": "GET", "op": "http.server", "parent": false, "status": "ok", "attrs": {"sentry.origin": "auto.http.cloudflare", "sentry.op": "http.server"}}]}
{"type": "span", "items": [{"name": "chat gpt-4o-mini", "op": "gen_ai.chat", "parent": true, "status": "ok", "attrs": {... identical ..., "gen_ai.response.id": "chatcmpl-mock-6", "gen_ai.response.text": "[\"Hello from the mock (6)\"]"}}, {"name": "GET", "op": "http.server", ...}]}
{"type": "event", "message": "sentinel", "exception": "undefined: sentinel", "sdk": "sentry.javascript.cloudflare", "sdkVersion": "10.67.0"}

[mock.log] six identical lines, one per /ai call:
mock POST /v1/chat/completions auth=Bearer test-key body={"model":"gpt-4o-mini","messages":[{"role":"user","content":"Say hi"}]}
```

Every recorded attribute is present with the recorded value, including `sentry.origin:
auto.ai.openai`, `gen_ai.provider.name: openai` and the 12/7/19 token counts, and the `gen_ai.chat`
span has a parent while the `http.server` span does not. The two side observations in the record also
hold: no `http.client` span for the call to the mock in any variant, and the sentinel
`captureMessage` arrives with `exception.values[0].value === "sentinel"` (the sink prints
`"undefined: sentinel"` because the exception has a value but no type).

Differences from the record, none of which change the verdict:

- Ports (mock 51213, sink 51216, workers 51413/51415/51417 instead of 41313/41213/41413/41415/41417)
  and therefore the mock response ids: the manual variant sees `chatcmpl-mock-5/6` where the record
  saw `chatcmpl-mock-7`, because this run made six mock calls in a different order.
- `/injected` reports `{"integrations":["OpenAI"],"bundler":["openai"]}` where the record has
  `{"integrations":["openai"],...}`. `openai` is the key the build-time snippet registers on
  `globalThis.__SENTRY_ORCHESTRION__.integrations` (the `bundler` half, identical to the record);
  `OpenAI` is the `name` of the integration that key's factory returns, which is what this rebuilt
  `/injected` route reads. The record's route evidently printed the marker key on both halves. The
  underlying fact is the same in both runs: exactly one channel integration, for `openai`, is
  registered under the Vite plugin and none without it.
- vite 8.2.2 / `@cloudflare/vite-plugin` 1.54.4 / wrangler 4.129.0 as resolved today; the record did
  not pin them.

## Files

- `src/index.ts` - the Worker (`withSentry`, module-scope `OpenAI` client, `/ai`, `/injected`, `/sentinel`)
- `src/manual.ts` - the same Worker with `Sentry.instrumentOpenAiClient(client)`
- `vite.config.ts` - `cloudflare()` + `sentryCloudflareVitePlugin()`, both with no options
- `wrangler.jsonc` - `c16_develop`, `main: src/index.ts`, `compatibility_date: 2026-05-01`, `nodejs_compat`, `SINK_URL` var
- `wrangler.manual.jsonc` - `c16_manual`, `main: src/manual.ts`, otherwise identical
- `mock-openai.mjs` - node http mock answering `POST /v1/chat/completions` with usage 12/7/19
- `sink.mjs` - envelope sink, span mapping extended to keep `gen_ai.*` attributes
- `drive.mjs` - request driver plus sentinel poll, prints the sink
- `dist/c16_develop/` - the `vite build` output of the run above (kept: it carries the injected
  `tracingChannel` call the evidence greps for)
- `result-vite.json`, `result-plain.json`, `result-manual.json`, `mock.log`, `sink.log`,
  `app-vite.log`, `app-plain.log`, `app-manual.log`, `vite-build.log` - output of the run above
