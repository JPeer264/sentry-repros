# C26 - Cloudflare Workflows, locally

## What it reproduces

A Cloudflare Worker running under `wrangler dev` with a `WorkflowEntrypoint` class wrapped in
`instrumentWorkflowWithSentry` from `@sentry/cloudflare` 10.67.0 (develop / v11 line). Three
workflow instances are started: **A** with a UUID instance id whose second step throws on attempt 1
and succeeds on attempt 2 (`retries.limit: 3`), **B** identical to A but with a non-UUID instance id
(`probe-c26-nonuuid-<epoch>`), and **C** with a UUID id whose second step always throws with
`retries.limit: 1`. It checks three things: that every `step.do` produces its own `function` segment
span carrying the workflow step attributes, that every span and event of one instance shares a trace
id deterministically derived from the instance id (UUID with the dashes stripped, otherwise the first
16 bytes of the SHA-1 of the id), and how many exception events reach Sentry when a step fails and is
retried. The local workflows engine passes a step context with `attempt` and `config.retries.limit`,
so `workflows.ts` feature-detects it and only captures on the final attempt - which is why a step
that fails and then succeeds sends nothing at all.

## Install

```
npm install
```

## Run

```
cd $REPRO/probes/C26
RAW=raw.ndjson PORT=41726 node sink.mjs > sink.log 2>&1 &
npx wrangler dev --port 41826 --inspector-port 0 > app.log 2>&1 &   # wait for 'Ready on http://localhost:41826'
node drive.mjs 41826 41726 > drive.out 2>&1
grep -n 'step-\|hung' app.log
```

`drive.mjs` creates the three instances, polls `/status/<id>` until each is terminal, prints the
expected trace ids, sends `/sentinel` and waits for it in the sink, then prints every sink item.
The tunnel port is fixed in `wrangler.jsonc` (`SENTRY_TUNNEL`); change it there if you move the sink.

## Expected

Recorded verdict: **partial**.

Step spans and the deterministic trace id work: each `step.do` produces a `function` segment span
named after the step (attributes `code.function.name`, `workflow.step.name`,
`cloudflare.workflow.attempt` / `retries.*`, origin `auto.faas.cloudflare.workflow`, source `task`),
and every span/event of an instance carries `trace_id` = instanceId without dashes (UUID ids) or the
SHA-1-derived id (non-UUID id `probe-c26-nonuuid-1788510789726` -> `82f4e4ec1be76973794b1bb7c7bc954f`).
Error capture does NOT match the claim "both failures captured since dedupe is off": the local engine
(wrangler 4.128.0) passes a step context with `attempt` and `config.retries.limit`, so the SDK only
captures the error on the final attempt. A step that throws once and then succeeds (limit 3) produces
zero exception events; an always-failing step with limit 1 produces one event (attempt 2), not two.

Recorded evidence lines:

```
status {"A":{"status":"complete",..."output":{"one":{"hello":"world"},"two":{"ok":true,"attempts":2}}},"B":{"status":"complete",...},"C":{"status":"errored",..."error":{"message":"step-two boom a0d90d18-f26b-4f90-838a-b34dd579594a","name":"Error"}}}
expected trace ids: { A: '78a66221f55c41c0b3b161c2e4a243c7', B: '82f4e4ec1be76973794b1bb7c7bc954f', C: 'a0d90d18f26b4f90838ab34dd579594a' }
{"type":"span","items":[{"op":"function","name":"step-one","trace_id":"78a66221f55c41c0b3b161c2e4a243c7","status":"ok","is_segment":true,"attrs":{"sentry.origin":"auto.faas.cloudflare.workflow","sentry.segment.name.source":"task","code.function.name":"step-one","workflow.step.name":"step-one","cloudflare.workflow.attempt":1,"sentry.segment.name":"step-one",...}},{"op":"function","name":"step-two","trace_id":"78a66221f55c41c0b3b161c2e4a243c7","status":"error","is_segment":true,"attrs":{..."cloudflare.workflow.retries.backoff":"constant","cloudflare.workflow.retries.delay":"1 second","cloudflare.workflow.retries.limit":3,"cloudflare.workflow.attempt":1,...}}]}
{"type":"span","items":[{"op":"function","name":"step-two","trace_id":"78a66221f55c41c0b3b161c2e4a243c7","status":"ok","is_segment":true,"attrs":{..."cloudflare.workflow.retries.limit":3,"cloudflare.workflow.attempt":2,...}}]}
{"type":"event","exception":"step-two boom a0d90d18-f26b-4f90-838a-b34dd579594a","mechanism":"auto.faas.cloudflare.workflow","handled":true,"trace_id":"a0d90d18f26b4f90838ab34dd579594a","span_id":"9ca30e9cfd5dd9f9","sdk":"sentry.javascript.cloudflare","event_id":"9bd88d1da605488fb8246e5f085798a4"}
(total exception events for 3 instances: 1; no event for instance A/B attempt 1 nor for C attempt 1)
app.log: step-two ctx: {"step":{"name":"step-two","count":1},"attempt":1,"config":{"retries":{"limit":3,"backoff":"constant","delay":"1 second"},"timeout":"10 minutes"}} attempt# 1
```

## Observed on 2026-09-07

wrangler 4.129.0, `@sentry/cloudflare` 10.67.0 from `_toolbox/pack`. Matches the recorded verdict
(`partial`) in every part. Trimmed output from `drive.out` / `app.log`:

```
instance ids: {"A":"ff505564-1a82-42ea-b0a3-741d8d65e445","B":"probe-c26-nonuuid-1788771672031","C":"02aaa15f-67bb-421f-bc7a-674e1538ff42"}
status {"A":{"status":"complete","__LOCAL_DEV_STEP_OUTPUTS":[{"hello":"world"},{"ok":true,"attempts":2}],"output":{"one":{"hello":"world"},"two":{"ok":true,"attempts":2}}},"B":{"status":"complete","__LOCAL_DEV_STEP_OUTPUTS":[{"hello":"world"},{"ok":true,"attempts":2}],"output":{"one":{"hello":"world"},"two":{"ok":true,"attempts":2}}},"C":{"status":"errored","__LOCAL_DEV_STEP_OUTPUTS":[{"hello":"world"}],"output":null,"error":{"message":"step-two boom 02aaa15f-67bb-421f-bc7a-674e1538ff42","name":"Error"}}}
expected trace ids: {
  A: 'ff5055641a8242eab0a3741d8d65e445',
  B: '52262895dec878fb9cad5c287784f619',
  C: '02aaa15f67bb421fbc7a674e1538ff42'
}
{"op":"function","name":"step-one","trace_id":"ff5055641a8242eab0a3741d8d65e445","status":"ok","is_segment":true,"attrs":{"sentry.origin":"auto.faas.cloudflare.workflow","sentry.op":"function","sentry.segment.name.source":"task","sentry.sample_rate":1,"code.function.name":"step-one","workflow.step.name":"step-one","cloudflare.workflow.attempt":1,...,"sentry.segment.name":"step-one","sentry.segment.id":"ba4b99ca4f4b8f3f",...}}
{"op":"function","name":"step-two","trace_id":"ff5055641a8242eab0a3741d8d65e445","status":"error","is_segment":true,"attrs":{"sentry.status.message":"internal_error","sentry.origin":"auto.faas.cloudflare.workflow","sentry.op":"function",...,"cloudflare.workflow.timeout":"10 minutes","cloudflare.workflow.retries.backoff":"constant","cloudflare.workflow.retries.delay":"1 second","cloudflare.workflow.retries.limit":3,"cloudflare.workflow.attempt":1,...}}
{"op":"function","name":"step-one","trace_id":"52262895dec878fb9cad5c287784f619","status":"ok","is_segment":true,...}
{"op":"function","name":"step-two","trace_id":"52262895dec878fb9cad5c287784f619","status":"error","is_segment":true,...,"cloudflare.workflow.retries.limit":3,"cloudflare.workflow.attempt":1,...}
{"op":"function","name":"step-two","trace_id":"ff5055641a8242eab0a3741d8d65e445","status":"ok","is_segment":true,...,"cloudflare.workflow.retries.limit":3,"cloudflare.workflow.attempt":2,...}
{"op":"function","name":"step-two","trace_id":"52262895dec878fb9cad5c287784f619","status":"ok","is_segment":true,...,"cloudflare.workflow.retries.limit":3,"cloudflare.workflow.attempt":2,...}
{"op":"function","name":"step-two","trace_id":"02aaa15f67bb421fbc7a674e1538ff42","status":"error","is_segment":true,...,"cloudflare.workflow.retries.limit":1,"cloudflare.workflow.attempt":2,"sentry.segment.id":"9de510eaf6fb7467",...}
{"type":"event","exception":"step-two boom 02aaa15f-67bb-421f-bc7a-674e1538ff42","mechanism":"auto.faas.cloudflare.workflow","handled":true,"trace_id":"02aaa15f67bb421fbc7a674e1538ff42","span_id":"9de510eaf6fb7467","sdk":"sentry.javascript.cloudflare","event_id":"e9896935655c4d02972e4a6174617b22"}
{"type":"event","message":"sentinel 1",...}
(total exception events for 3 instances: 1)
```

`app.log` confirms the step context the gating depends on, and the local-engine "hung request"
artifact from note 4 of the record (6 occurrences in this run):

```
step-two ctx: {"step":{"name":"step-two","count":1},"attempt":1,"config":{"retries":{"limit":3,"backoff":"constant","delay":"1 second"},"timeout":"10 minutes"}} attempt# 1
step-two ctx: {"step":{"name":"step-two","count":1},"attempt":1,"config":{"retries":{"limit":1,"backoff":"constant","delay":"1 second"},"timeout":"10 minutes"}} attempt# 1
step-two ctx: {"step":{"name":"step-two","count":1},"attempt":2,"config":{"retries":{"limit":3,"backoff":"constant","delay":"1 second"},"timeout":"10 minutes"}} attempt# 2
Uncaught Error: The Workers runtime canceled this request because it detected that your Worker's code had hung and would never generate a response.
```

Only difference from the record: wrangler 4.129.0 instead of 4.128.0, and the instance ids / trace
ids / event ids differ per run by construction. Behavior is identical. `PlainWorkflow` (binding
`PLAIN`, reachable with `/trigger?plain=1`) is the unwrapped control class from note 4; it was not
exercised in this run.
