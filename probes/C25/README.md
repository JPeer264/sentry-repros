# C25 — WorkerEntrypoint RPC via a self service binding

Runtime: cloudflare (`wrangler dev`, local workerd). SDK under test: `@sentry/cloudflare` 10.67.0
(develop, `getsentry/sentry-javascript` @ `6f2da7483d`), installed from the tarballs in
`_toolbox/pack`.

## What it reproduces

One Worker (`c25-rpc`) exports both a default `fetch` handler and a `WorkerEntrypoint` subclass
`Api`, and binds itself back to itself through a service binding `SELF` pointing at the `Api`
entrypoint; both exports are wrapped with `Sentry.withSentry` and both pass
`rpcTracePropagationBindings: ['SELF']`. Hitting `/rpc` calls `env.SELF.hello('x')` over RPC, `/rpc-error`
calls `env.SELF.hello('boom')` which throws inside the entrypoint, and `/svc-fetch` calls
`env.SELF.fetch('http://api.invalid/inner')`. The probe checks that the receiver-side RPC method gets an
`rpc hello` span parented to the caller's `http.server` span in the same trace, that the error thrown
inside the RPC method is captured with mechanism `auto.faas.cloudflare.worker_entrypoint` / `handled:false`
in that same trace, and that `env.SELF.fetch()` propagates `sentry-trace` so the callee's `http.server`
span continues the caller's trace. `wrangler-control.jsonc` sets `RPC_PROPAGATION=off`, which drops the
`rpcTracePropagationBindings` option, as the negative control.

## Install

```
npm install
```

(from this directory; the dependencies are `file:` paths into `../../_toolbox/pack`)

## Run

```
cd $REPRO/probes/C25
PORT=43917 node sink.mjs > sink.log 2>&1 &
npx wrangler dev --port 51234 --inspector-port 0 > app.log 2>&1 &   # wait for 'Ready on http://localhost:51234'
node drive.mjs 51234 43917
```

Negative control (stop the wrangler process first, keep the sink running):

```
npx wrangler dev --config wrangler-control.jsonc --port 51234 --inspector-port 0 > app-control.log 2>&1 &
node drive.mjs 51234 43917
```

Kill both background processes when done (capture their pids with `$!`).

## Expected

Recorded verdict: **works**.

With `rpcTracePropagationBindings: ["SELF"]` on both `withSentry` calls, `env.SELF.hello("x")` produces an
`rpc hello` span in the caller's trace (parent = caller's `http.server` span), the thrown error inside
`hello()` is captured with mechanism `auto.faas.cloudflare.worker_entrypoint` / handled false in the same
`trace_id`, and `env.SELF.fetch()` propagates `sentry-trace` so the callee's `http.server` span continues
the caller's trace. Negative control without the option: no `rpc` span at all and the RPC error lands in a
separate trace.

Recorded evidence lines:

```
/rpc:
  "http.server GET trace=3194030cd6894215818dfed36c1cd3bb span=8f16a5b1f6f283ad parent=- status=ok origin=auto.http.cloudflare"
  "rpc hello trace=3194030cd6894215818dfed36c1cd3bb span=9f77e3860b33eb5b parent=8f16a5b1f6f283ad status=ok origin=auto.faas.cloudflare.worker_entrypoint"
/rpc-error:
  {"type":"event","exception":"rpc boom","mechanism":"auto.faas.cloudflare.worker_entrypoint","handled":false,"trace_id":"ac9304ad887e459187b7fc84a8ea6b11","span_id":"9f201e341e1ca6df"}
  "rpc hello trace=ac9304ad887e459187b7fc84a8ea6b11 span=9f201e341e1ca6df parent=822f0ca0565fcc08 status=error origin=auto.faas.cloudflare.worker_entrypoint"
  "http.server GET trace=ac9304ad887e459187b7fc84a8ea6b11 span=822f0ca0565fcc08 parent=- status=ok origin=auto.http.cloudflare"
/svc-fetch (response body: api fetch /inner sentry-trace=9abf564397984665a691f90a410dd368-b181f9e287aaacdb-1):
  "http.server GET trace=9abf564397984665a691f90a410dd368 span=8f2a75930d90107e parent=b181f9e287aaacdb status=ok origin=auto.http.cloudflare"
  "http.server GET trace=9abf564397984665a691f90a410dd368 span=b181f9e287aaacdb parent=- status=ok origin=auto.http.cloudflare"
Negative control (option removed): /rpc only "http.server GET trace=4c5482a5d7f84edb93a958802e002f5d ..." (no rpc span);
/rpc-error event trace_id c756261b1bfd4f3a9b2fa73e3650443c vs caller http.server trace=bd8380630b6741ab848170adc1c77006
```

Recorded side notes that still hold: no `http.client` span is emitted for `env.SELF.fetch()` (the callee's
`http.server` span is parented directly to the caller's `http.server` span), and there is no caller-side
span for the RPC method call, only the receiver-side `rpc` span.

## Observed on 2026-09-07

Main run (`wrangler.jsonc`, `RPC_PROPAGATION=on`), verbatim from `run-develop.log`:

```
/rpc 200 hello x
/rpc-error 200 caught rpc boom
/svc-fetch 200 api fetch /inner sentry-trace=0ab71f6d5f034e78b48c496b22f8a885-8f8480acc58f40ae-1
/sentinel 200 sentinel
--- sink ---
{"type":"span","items":["rpc hello trace=4932b3c606a64a8d8f64f9c6037bda36 span=a8e86ddbbaa81446 parent=85b8e284c6be46e5 status=ok origin=auto.faas.cloudflare.worker_entrypoint"]}
{"type":"span","items":["http.server GET trace=4932b3c606a64a8d8f64f9c6037bda36 span=85b8e284c6be46e5 parent=- status=ok origin=auto.http.cloudflare"]}
{"type":"event","exception":"rpc boom","mechanism":"auto.faas.cloudflare.worker_entrypoint","handled":false,"trace_id":"92363b76071c4c86a488141e3dced25b","span_id":"ba3741c97e419506"}
{"type":"span","items":["rpc hello trace=92363b76071c4c86a488141e3dced25b span=ba3741c97e419506 parent=9011883b21f856b5 status=error origin=auto.faas.cloudflare.worker_entrypoint"]}
{"type":"span","items":["http.server GET trace=92363b76071c4c86a488141e3dced25b span=9011883b21f856b5 parent=- status=ok origin=auto.http.cloudflare"]}
{"type":"span","items":["http.server GET trace=0ab71f6d5f034e78b48c496b22f8a885 span=9771d620b8c69a1d parent=8f8480acc58f40ae status=ok origin=auto.http.cloudflare"]}
{"type":"span","items":["http.server GET trace=0ab71f6d5f034e78b48c496b22f8a885 span=8f8480acc58f40ae parent=- status=ok origin=auto.http.cloudflare"]}
```

Negative control (`wrangler-control.jsonc`, `RPC_PROPAGATION=off`), verbatim from `run-control.log`:

```
/rpc 200 hello x
/rpc-error 200 caught rpc boom
/svc-fetch 200 api fetch /inner sentry-trace=524d2184912640e3aec5ddc3ecf0a65d-81cd7c125c1df031-1
--- sink ---
{"type":"span","items":["http.server GET trace=227e8658444443a9914f5b84fa97c488 span=9c7cbdabcf8d5e3a parent=- status=ok origin=auto.http.cloudflare"]}
{"type":"event","exception":"rpc boom","mechanism":"auto.faas.cloudflare.worker_entrypoint","handled":false,"trace_id":"37416a77484c4aa89679724ee45a7cbe","span_id":"8d49ad608e49447a"}
{"type":"span","items":["http.server GET trace=53fc2add3f3a4f33a78d20fa8e3cba4d span=b6f248de124f410b parent=- status=ok origin=auto.http.cloudflare"]}
```

Matches the recorded verdict. `/rpc` gives an `rpc hello` span parented to the caller's `http.server`
span in the same trace, `/rpc-error` gives the same trace for the error event, the `rpc hello`
`status=error` span and the caller span, `/svc-fetch` shows the callee's `http.server` span parented to
the caller's span in one trace, and the control loses the `rpc` span entirely while the RPC error lands
in its own trace (`37416a77…`) separate from the caller (`53fc2add…`).

One observation the record did not cover: in the negative control `env.SELF.fetch()` still propagated
`sentry-trace` (callee `http.server` span `864f9d64f0d75727` parent `81cd7c125c1df031`, one trace
`524d2184912640e3aec5ddc3ecf0a65d`), so `rpcTracePropagationBindings` gates the RPC method path but not
the service-binding `fetch` path. This does not contradict any recorded evidence line.

## Files

- `src/index.ts` — worker: default `fetch` handler, `Api` WorkerEntrypoint, both wrapped with `withSentry`
- `wrangler.jsonc` — self service binding `SELF` → `c25-rpc#Api`, `RPC_PROPAGATION=on`
- `wrangler-control.jsonc` — same, `RPC_PROPAGATION=off` (negative control)
- `sink.mjs` — envelope sink; prints spans as `<op> <name> trace= span= parent= status= origin=`
- `drive.mjs` — hits `/rpc`, `/rpc-error`, `/svc-fetch`, then a `sentinel` message, then dumps the sink
- `run-develop.log`, `run-control.log` — the two runs above
