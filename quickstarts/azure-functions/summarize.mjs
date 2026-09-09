// Builds results-<variant>.json from the sink, the runner's console log and the runner's step log.
import fs from "node:fs";

const [variant, command, appLog, stepsFile, sinkUrl] = process.argv.slice(2);

const items = await (await fetch(`${sinkUrl}/__items`)).json();
const raw = await (await fetch(`${sinkUrl}/__items?raw=1`)).json();
const log = fs.existsSync(appLog) ? fs.readFileSync(appLog, "utf8") : "";
const lines = log.split("\n").filter(Boolean);
const steps = fs.existsSync(stepsFile) ? JSON.parse(fs.readFileSync(stepsFile, "utf8")) : [];
const azureFunctionsVersion = JSON.parse(fs.readFileSync("node_modules/@azure/functions/package.json", "utf8")).version;

const events = items.filter((i) => i.type === "event");
const spans = items.filter((i) => i.type === "span");
const transactions = items.filter((i) => i.type === "transaction");
const logs = items.filter((i) => i.type === "log");
const otherTypes = items.filter((i) => !["event", "span", "transaction", "log"].includes(i.type)).map((i) => i.type);
const segments = spans.flatMap((s) => (s.raw || []).filter((r) => r.is_segment));
const children = spans.flatMap((s) => (s.raw || []).filter((r) => !r.is_segment));

const integrations = lines
  .filter((l) => l.includes("Integration installed:"))
  .map((l) => l.replace(/.*Integration installed:\s*/, "").trim());
const notable = lines.filter(
  (l) => /warn|deprecat|no longer supported|error|initialized from|Runtime hook|registerHooks|Bundler plugin|Initializing Sentry|test mode/i.test(l) && !l.includes("Integration installed"),
);

const rawEvents = raw
  .filter((x) => x.header.type === "event")
  .map(({ payload: p }) => {
    const ex = p.exception?.values?.[0];
    return {
      message: p.message,
      exception: ex ? `${ex.type}: ${ex.value}` : undefined,
      mechanism: ex?.mechanism,
      transaction: p.transaction,
      request: p.request,
      user: p.user,
      tags: p.tags,
      server_name: p.server_name,
      release: p.release,
      environment: p.environment,
      contexts: { runtime: p.contexts?.runtime, cloud_resource: p.contexts?.cloud_resource, trace: p.contexts?.trace },
      sdk: p.sdk?.name,
      sdk_version: p.sdk?.version,
    };
  });
const spansRaw = raw.filter((x) => x.header.type === "span").map((x) => x.payload);
const attrsOf = (s) => Object.fromEntries(Object.entries(s.attributes || {}).map(([k, v]) => [k, v?.value ?? v]));
const faasCloud = {};
for (const p of spansRaw) {
  for (const s of p.items || []) {
    for (const [k, v] of Object.entries(attrsOf(s))) if (/^(faas|cloud)\./.test(k)) faasCloud[k] = v;
  }
}
for (const e of rawEvents) {
  if (e.contexts.cloud_resource) faasCloud["contexts.cloud_resource"] = e.contexts.cloud_resource;
  for (const [k, v] of Object.entries(e.tags || {})) if (/^(faas|cloud)\./.test(k)) faasCloud[`tags.${k}`] = v;
}

const firstEvent = events[0];
const sdk = firstEvent
  ? { name: firstEvent.sdk, version: firstEvent.sdk_version, runtime: firstEvent.runtime, runtime_version: firstEvent.runtime_version }
  : { name: spans[0]?.sdk, version: spans[0]?.sdk_version };

const byStep = (n) => steps.find((s) => s.step === n) || {};
const errorEvents = rawEvents.filter((e) => e.exception && e.message !== "sentinel");
const afterFn = byStep("sink-after-function").counts || {};
const customSpan = spansRaw.flatMap((p) => p.items || []).filter((s) => s.name === "My Custom Span").map((s) => ({ name: s.name, op: attrsOf(s)["sentry.op"], is_segment: s.is_segment, parent_span_id: s.parent_span_id, status: s.status, segment_name: attrsOf(s)["sentry.segment.name"], attributes: attrsOf(s) }));

const checks = {
  load_ok: byStep("load").ok === true,
  invoke_ok: byStep("invoke").ok === true,
  load_error: byStep("load").error,
  invoke_error: byStep("invoke").error,
  response: byStep("invoke").response,
  context_log: byStep("invoke").contextLog,
  sink_after_function: afterFn,
  sentinel_flushed: byStep("sentinel-flush").flushed,
  sentinel_arrived: byStep("sentinel-arrived").arrived === true,
  error_events: errorEvents.map((e) => ({ exception: e.exception, mechanism: e.mechanism?.type, handled: e.mechanism?.handled, transaction: e.transaction, request: e.request, user: e.user, trace_id: e.contexts.trace?.trace_id })),
  request_data_on_error_event: errorEvents.some((e) => e.request && Object.keys(e.request).length > 0),
  user_on_error_event: errorEvents.some((e) => e.user && Object.keys(e.user).length > 0),
  sentinel_event: events.filter((e) => e.message === "sentinel").map((e) => ({ mechanism: e.mechanism, handled: e.handled, transaction: e.transaction })),
  transaction_envelopes: transactions.length,
  span_envelopes: spans.length,
  segments: segments.map((s) => ({ name: s.name, op: s.op, source: s.source, status: s.status, origin: s.origin })),
  child_spans: children.map((c) => `${c.op ?? ""} ${c.name}`.trim()),
  custom_span: customSpan,
  log_batches: logs.length,
  log_bodies: logs.flatMap((l) => l.items),
  other_item_types: [...new Set(otherTypes)],
  faas_cloud_attributes: faasCloud,
  deprecation_output: lines.filter((l) => /deprecat/i.test(l)),
  release_warning: lines.filter((l) => /missing or non-string release/.test(l)),
  azure_test_mode_warning: lines.filter((l) => /test mode/.test(l)),
};

const expectedAfterFunction = {
  verify: (c) => (c.event || 0) >= 1,
  "errors-only": (c) => (c.event || 0) >= 1,
  "normalized-request": (c) => (c.event || 0) >= 1,
  "v4-model": (c) => (c.event || 0) >= 1,
  tracing: (c) => (c.span || 0) >= 1,
  logs: (c) => (c.log || 0) >= 1,
  "capture-errors": () => true,
}[variant] || (() => true);
const claimsHold = {
  verify: () => checks.request_data_on_error_event,
  "errors-only": () => checks.request_data_on_error_event,
  "v4-model": () => checks.request_data_on_error_event,
  "capture-errors": () => Object.keys(afterFn).length === 0,
}[variant] || (() => true);

const status = !checks.load_ok || !checks.invoke_ok
  ? "broken"
  : expectedAfterFunction(afterFn) && checks.sentinel_arrived && claimsHold()
    ? "works"
    : "partial";

const result = {
  id: "QS-azure-functions",
  variant,
  command,
  azure_functions_version: azureFunctionsVersion,
  sdk,
  steps,
  console: { line_count: lines.length, notable, integrations, integration_count: integrations.length, full: lines },
  envelopes: { counts: { event: events.length, span: spans.length, transaction: transactions.length, log: logs.length }, items },
  rawEvents,
  spansRaw,
  verdict: { status, checks },
};
console.log(JSON.stringify(result, null, 2));
