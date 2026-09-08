# N4 - Cloudflare Agents SDK: `instrumentAgentWithSentry`, callable spans and conversation IDs

Runtime: Cloudflare Workers (`wrangler dev` 4.129.0 / workerd 1.20260903.1) | SDK:
`@sentry/cloudflare` 10.67.0 (develop line, tarballs in `_toolbox/pack/`) | `agents` 0.22.0,
`@cloudflare/ai-chat` 0.11.0 | default `traceLifecycle: 'stream'`, so spans arrive as `span`
envelopes.

## What it reproduces

One Worker exports three Durable Object classes driven over HTTP and WebSocket: `MyAgent`, an
`Agent` from `agents` wrapped with `Sentry.instrumentAgentWithSentry` and carrying five
`@callable()` methods (`greet`, `aiTurn`, `writeKeys`, `clearChat`, `sentinel`) plus an `onRequest`
handler; `LegacyAgent`, the same shape wrapped with `Sentry.instrumentDurableObjectWithSentry` and
calling `Sentry.setConversationId('conv_abc123')` by hand, which is the path the docs page
prescribes for SDKs before 10.69.0; and `MyChatAgent`, an `AIChatAgent` from `@cloudflare/ai-chat`
wrapped with `instrumentAgentWithSentry` and driven through the real client protocol
(`cf_agent_use_chat_request`, then `cf_agent_chat_clear`). The `gen_ai.chat` spans are plain
`Sentry.startSpan({ op: 'gen_ai.chat' })` calls with no model provider behind them, which is all
`conversationIdIntegration` needs: it stamps `gen_ai.conversation.id` at `spanStart` on any op
starting with `gen_ai.`. The probe checks what the callable RPC span carries, what the automatic
conversation ID actually is and when it rotates, which Durable Object storage keys get a span, and
whether the docs page's own sample compiles against develop's option types.

## Install

```
cd $REPRO/probes/N4 && npm install --no-audit --no-fund \
  ../../_toolbox/pack/sentry-cloudflare-10.67.0.tgz \
  ../../_toolbox/pack/sentry-core-10.67.0.tgz \
  ../../_toolbox/pack/sentry-opentelemetry-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  agents@0.22.0 @cloudflare/ai-chat@0.11.0 ws wrangler@4 typescript@5.9.2 @cloudflare/workers-types
```

## Run

The sink URL (`http://127.0.0.1:47211/`) is baked into `wrangler.jsonc` as the `SINK_URL` var;
change it there too if the port is taken. From this directory:

```
D=$REPRO/probes/N4
cd $D && PORT=47211 node sink.mjs > sink.log 2>&1 & spid=$!

# main run: instrumentAgentWithSentry + instrumentDurableObjectWithSentry
cd $D && npx wrangler dev --port 51735 --inspector-port 0 > wrangler.log 2>&1 & w=$!
# wait for "Ready on http" in wrangler.log
cd $D && APP_PORT=51735 SINK_PORT=47211 node drive-agent.mjs | tee run-agent.txt
cd $D && APP_PORT=51735 SINK_PORT=47211 node drive-chat.mjs  | tee run-chat.txt
kill $w; wait $w

# the removed `enableRpcTracePropagation` option, passed at runtime
cd $D && npx wrangler dev --port 51736 --inspector-port 0 --var RPC_PROP:1 > wrangler-rpcprop.log 2>&1 & w=$!
cd $D && APP_PORT=51736 SINK_PORT=47211 node drive-rpcprop.mjs | tee run-rpcprop.txt
kill $w; wait $w

kill $spid; wait $spid

# the docs page's sample verbatim, and the worker source
cd $D && npx tsc -p tscheck/tsconfig.json | tee run-tscheck.txt
cd $D && npx tsc -p tsconfig.json         | tee run-tsc-src.txt
```

`drive-n4b.mjs`, `run-agent-rpcprop.txt`, `tscheck/docs-sample-fixed.ts`,
`tscheck/tsconfig.fixed.json` and `tscheck/run-types*.txt` are leftovers of an earlier abandoned
attempt in this directory; none of the commands above use them. `.wrangler/state` holds the local
Durable Object storage, so a rerun starts from the conversation IDs persisted by the last run
rather than minting new ones on the first turn.

## Expected

Recorded verdict: **partial**.

`instrumentAgentWithSentry` works: one `rpc` span per `@callable()` over WebSocket, a conversation
ID on every `gen_ai` span for HTTP/RPC/chat-turn units of work, rotation on `message:clear`
(including the real `cf_agent_chat_clear` message on `AIChatAgent`), and DO storage spans only for
the non-framework key. Three docs claims are wrong: (a) the callable span carries the agent class
ONLY, there is no instance-name attribute; (b) the class it carries is the *base* class name
(`MyAgentBase`), not the exported/bound class (`MyAgent`); (c) the conversation ID is a fresh uuid4,
NOT the agent instance name (`room-1`) as `features/agents-sdk.mdx:39` claims. The page's main
sample also fails `tsc` on develop because `enableRpcTracePropagation` was removed; at runtime it is
silently ignored.

Recorded evidence lines:

```
Callable RPC span (span envelope, /agents/my-agent/room-1, method `greet`) - agent class present, no instance name:
{"name":"greet","attrs":{"sentry.origin":"auto.faas.cloudflare.agents","sentry.op":"rpc","gen_ai.agent.name":"MyAgentBase","sentry.segment.name":"webSocketMessage","sentry.sdk.version":"10.67.0"}}
(one such span for each of greet / aiTurn / writeKeys / clearChat / sentinel - 5 callables, 5 rpc spans; no `cloudflare.agent.name` and no other instance attribute anywhere in the envelope)

Conversation ID on the HTTP (onRequest) turn - a uuid4, not the instance name "room-1":
{"name":"chat-http","attrs":{"sentry.origin":"manual","sentry.op":"gen_ai.chat","gen_ai.conversation.id":"211054c169a44385955212b92af9087d"}}

Same ID inside the first callable RPC (consistent per instance across HTTP and RPC):
{"name":"chat","attrs":{"sentry.op":"gen_ai.chat","gen_ai.conversation.id":"211054c169a44385955212b92af9087d","sentry.segment.name":"webSocketMessage"}}

After `clearChat` (which calls `this._emit("message:clear")`) - rotated:
{"name":"chat","attrs":{"sentry.op":"gen_ai.chat","gen_ai.conversation.id":"7ddb2ba71aaf45b1a3411d122f4c1797"}}

Storage filtering - writeKeys put 'mine', 'cf_x', '__ps_y', '/z'; exactly ONE storage span in that segment:
{"name":"durable_object_storage_put","attrs":{"sentry.op":"db","db.system.name":"cloudflare.durable_object.storage","db.operation.name":"put","sentry.segment.name":"webSocketMessage"}}

AIChatAgent (@cloudflare/ai-chat 0.11.0) with the REAL clear path (client sends {"type":"cf_agent_chat_clear"}):
{"name":"chat","op":"gen_ai.chat","conv":"56b25163c0794906836377285bddb4d8"}
{"name":"aiTurn","op":"rpc","agent":"MyChatAgentBase"}
{"name":"chat","op":"gen_ai.chat","conv":"6d2a5399d3e84a2c8a192d6faa97e01d"}   <- rotated

Docs' pre-10.69 path (instrumentDurableObjectWithSentry + Sentry.setConversationId in onRequest) - works, and the user-set ID is honoured:
{"name":"legacy-chat-http","attrs":{"sentry.origin":"manual","sentry.op":"gen_ai.chat","gen_ai.conversation.id":"conv_abc123"}}
The same class over WebSocket gets NO rpc span and NO conversation ID (confirms callable spans/auto IDs come only from instrumentAgentWithSentry):
{"name":"legacy-chat","attrs":{"sentry.origin":"manual","sentry.op":"gen_ai.chat","sentry.segment.name":"webSocketMessage"}}

The page's sample verbatim (features/agents-sdk.mdx:25-32) fails type checking on develop:
docs-sample.ts(15,3): error TS2345: Argument of type '(env: Env) => { dsn: string; tracesSampleRate: number; enableRpcTracePropagation: boolean; }' is not assignable to parameter of type '(env: Env) => { ... } & CloudflareOptions & Record<"enableRpcTracePropagation", never>'.
        Type 'boolean' is not assignable to type 'never'.
(the same file with that one line removed type-checks clean). At runtime the option is accepted and ignored: with `enableRpcTracePropagation: true` in the options the Worker boots and still emits the `rpc` span.
```

Recorded notes worth keeping: `agents@0.22.0` needs standard (TC39) decorators, which wrangler's
esbuild handles with no `experimentalDecorators` in `tsconfig.json`. `McpAgent` from `agents/mcp`
was never exercised. The record also notes a flake: a `Sentry.captureMessage` fired inside a
callable RPC reached the sink on one run and not on another, while the `rpc` span for the same call
always arrived.

## Observed on 2026-09-07

Matches the recorded verdict. Every claim above reproduced, including all three docs defects.

`run-agent.txt`, the `instrumentAgentWithSentry` class over HTTP and WebSocket:

```
{"name":"chat-http","attrs":{"sentry.origin":"manual","sentry.op":"gen_ai.chat","gen_ai.conversation.id":"c1d29ca2b86441289bcf69e5d65c2da2","sentry.segment.name":"GET","sentry.sdk.version":"10.67.0"}}
{"name":"greet","attrs":{"sentry.origin":"auto.faas.cloudflare.agents","sentry.op":"rpc","gen_ai.agent.name":"MyAgentBase","sentry.segment.name":"webSocketMessage","sentry.sdk.version":"10.67.0"}}
{"name":"chat","attrs":{"sentry.origin":"manual","sentry.op":"gen_ai.chat","gen_ai.conversation.id":"c1d29ca2b86441289bcf69e5d65c2da2","sentry.segment.name":"webSocketMessage","sentry.sdk.version":"10.67.0"}}
{"name":"aiTurn","attrs":{"sentry.origin":"auto.faas.cloudflare.agents","sentry.op":"rpc","gen_ai.agent.name":"MyAgentBase","sentry.segment.name":"webSocketMessage","sentry.sdk.version":"10.67.0"}}
{"name":"durable_object_storage_put","attrs":{"sentry.origin":"auto.db.cloudflare.durable_object","sentry.op":"db","sentry.segment.name":"webSocketMessage","sentry.sdk.version":"10.67.0","db.system.name":"cloudflare.durable_object.storage","db.operation.name":"put"}}
{"name":"writeKeys","attrs":{"sentry.origin":"auto.faas.cloudflare.agents","sentry.op":"rpc","gen_ai.agent.name":"MyAgentBase","sentry.segment.name":"webSocketMessage","sentry.sdk.version":"10.67.0"}}
{"name":"clearChat","attrs":{"sentry.origin":"auto.faas.cloudflare.agents","sentry.op":"rpc","gen_ai.agent.name":"MyAgentBase","sentry.segment.name":"webSocketMessage","sentry.sdk.version":"10.67.0"}}
{"name":"chat","attrs":{"sentry.origin":"manual","sentry.op":"gen_ai.chat","gen_ai.conversation.id":"c01b3e18f232443ba6424101e3c70e22","sentry.segment.name":"webSocketMessage","sentry.sdk.version":"10.67.0"}}
{"name":"aiTurn","attrs":{"sentry.origin":"auto.faas.cloudflare.agents","sentry.op":"rpc","gen_ai.agent.name":"MyAgentBase","sentry.segment.name":"webSocketMessage","sentry.sdk.version":"10.67.0"}}
{"name":"sentinel","attrs":{"sentry.origin":"auto.faas.cloudflare.agents","sentry.op":"rpc","gen_ai.agent.name":"MyAgentBase","sentry.segment.name":"webSocketMessage","sentry.sdk.version":"10.67.0"}}
```

Six callable calls over five distinct methods, six `rpc` spans, each carrying `gen_ai.agent.name`
= `MyAgentBase` (the base class, not the exported `MyAgent`) and no instance-name attribute:
`cloudflare.agent.name` is in this sink's kept-attribute list and never appeared, and
`getAgentAttributes` in `packages/cloudflare/src/instrumentations/agents/types.ts` sets
`gen_ai.agent.name` and nothing else. The conversation ID
`c1d29ca2b86441289bcf69e5d65c2da2` is a uuid4, not the instance name `room-1`, and it is the same
on the HTTP turn and inside the callable; after `clearChat` it rotates to
`c01b3e18f232443ba6424101e3c70e22`. `writeKeys` put `mine`, `cf_x`, `__ps_y` and `/z` and produced
exactly one `durable_object_storage_put` span.

The pre-10.69 path in the same run:

```
{"name":"legacy-chat-http","attrs":{"sentry.origin":"manual","sentry.op":"gen_ai.chat","gen_ai.conversation.id":"conv_abc123","sentry.segment.name":"GET","sentry.sdk.version":"10.67.0"}}
{"name":"legacy-chat","attrs":{"sentry.origin":"manual","sentry.op":"gen_ai.chat","sentry.segment.name":"webSocketMessage","sentry.sdk.version":"10.67.0"}}
```

The hand-set `conv_abc123` is honoured, and the same class over WebSocket gets no `rpc` span and no
conversation ID.

`run-chat.txt`, `AIChatAgent` driven through the real client protocol:

```
{"name":"chat","attrs":{"sentry.origin":"manual","sentry.op":"gen_ai.chat","gen_ai.conversation.id":"d32f9862122b4c46a57c17bb6ef18623","sentry.segment.name":"webSocketMessage","sentry.sdk.version":"10.67.0"}}
{"name":"aiTurn","attrs":{"sentry.origin":"auto.faas.cloudflare.agents","sentry.op":"rpc","gen_ai.agent.name":"MyChatAgentBase","sentry.segment.name":"webSocketMessage","sentry.sdk.version":"10.67.0"}}
{"name":"chat","attrs":{"sentry.origin":"manual","sentry.op":"gen_ai.chat","gen_ai.conversation.id":"3b275f780e244fc39b4166a1b587075a","sentry.segment.name":"webSocketMessage","sentry.sdk.version":"10.67.0"}}
```

The `cf_agent_chat_clear` frame the client really sends rotates the ID between the two chat turns.

`run-tscheck.txt`, the docs page's sample verbatim:

```
tscheck/docs-sample.ts(16,3): error TS2345: Argument of type '(env: Env) => { dsn: string; tracesSampleRate: number; enableRpcTracePropagation: boolean; }' is not assignable to parameter of type '(env: Env) => { dsn: string; tracesSampleRate: number; enableRpcTracePropagation: boolean; } & CloudflareOptions & Record<"enableRpcTracePropagation", never>'.
  Type '{ dsn: string; tracesSampleRate: number; enableRpcTracePropagation: boolean; }' is not assignable to type '{ dsn: string; tracesSampleRate: number; enableRpcTracePropagation: boolean; } & CloudflareOptions & Record<"enableRpcTracePropagation", never>'.
    Type '{ dsn: string; tracesSampleRate: number; enableRpcTracePropagation: boolean; }' is not assignable to type 'Record<"enableRpcTracePropagation", never>'.
      Types of property 'enableRpcTracePropagation' are incompatible.
        Type 'boolean' is not assignable to type 'never'.
```

`tscheck/docs-sample-no-rpcprop.ts`, the same file with that one line removed, is in the same
`tsc` project and produces no error; `run-tsc-src.txt` (the worker source) is empty. At runtime the
option is accepted and ignored - `run-rpcprop.txt`, booted with `--var RPC_PROP:1`, which puts
`enableRpcTracePropagation: true` into the options object:

```
{"name":"greet","attrs":{"sentry.origin":"auto.faas.cloudflare.agents","sentry.op":"rpc","gen_ai.agent.name":"MyAgentBase","sentry.segment.name":"webSocketMessage","sentry.sdk.version":"10.67.0"}}
```

Two differences from the record, neither touching the verdict:

- The record's line numbers for the `tsc` error are `docs-sample.ts(15,3)`; here it is `(16,3)`,
  because this copy of the sample carries one extra leading comment line. The error itself is
  identical.
- The recorded `captureMessage` flake showed up again, on the other side: the `sentinel` capture
  fired inside a callable RPC arrived fine in `run-agent.txt`, but the `worker-sentinel` capture
  from the plain `fetch` handler never reached the sink during `run-chat.txt`, and a later manual
  `curl /sentinel` on the same Worker process produced its `http.server` span but again no event.
  Spans, which is what this probe asserts on, were unaffected throughout.
