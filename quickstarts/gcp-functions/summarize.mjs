// Builds results-<variant>.json from the sink, the function console log and the request step log.
import fs from "node:fs";

const [variant, command, appLog, stepsFile, sinkUrl, alive, expectSpans, expectKind, snippet] = process.argv.slice(2);

const items = await (await fetch(`${sinkUrl}/__items`)).json();
const raw = await (await fetch(`${sinkUrl}/__items?raw=1`)).json();
const log = fs.existsSync(appLog) ? fs.readFileSync(appLog, "utf8") : "";
const lines = log.split("\n").filter(Boolean);
const steps = fs.existsSync(stepsFile)
  ? fs.readFileSync(stepsFile, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l))
  : [];
const ffVersion = JSON.parse(fs.readFileSync("node_modules/@google-cloud/functions-framework/package.json", "utf8")).version;
const sdkPkgVersion = JSON.parse(fs.readFileSync("node_modules/@sentry/google-cloud-serverless/package.json", "utf8")).version;

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
  (l) => /warn|deprecat|no longer supported|error|initialized from|Runtime hook|registerHooks|Bundler plugin|Initializing Sentry|is not a function|Cannot find|TypeError|ReferenceError|Serving function|Function:|Signature type|URL:/i.test(l) && !l.includes("Integration installed"),
);
const loadErrors = lines.filter((l) => /is not a function|Cannot find module|ReferenceError|SyntaxError|Provided code is not a loadable module|Function '.*' is not defined/i.test(l));

const firstEvent = events[0];
const sdk = firstEvent
  ? { name: firstEvent.sdk, version: firstEvent.sdk_version, runtime: firstEvent.runtime, runtime_version: firstEvent.runtime_version }
  : { name: spans[0]?.sdk, version: spans[0]?.sdk_version };

const pick = (attrs, prefixes) => Object.fromEntries(Object.entries(attrs || {}).filter(([k]) => prefixes.some((p) => k.startsWith(p))));
const summarizeEvent = (e) => ({ exception: e.exception, message: e.message, mechanism: e.mechanism, handled: e.handled, level: e.level, transaction: e.transaction, request: e.request, user: e.user, context_keys: e.context_keys, gcp_context: e.gcp_context, cloud_resource: e.cloud_resource, trace_id: e.trace_id });
const summarizeSegment = (s) => ({
  name: s.name, op: s.op, origin: s.origin, status: s.status, status_code: s.status_code,
  segment_name_source: s.attrs?.["sentry.segment.name.source"], trace_lifecycle: s.attrs?.["sentry.trace_lifecycle"],
  faas: pick(s.attrs, ["faas."]), cloud: pick(s.attrs, ["cloud."]), gcp: pick(s.attrs, ["gcp."]),
  http: pick(s.attrs, ["http.", "url.", "server."]),
});

const errorEvents = events.filter((e) => e.exception && e.message !== "sentinel");
const sentinelEvents = events.filter((e) => e.message === "sentinel");
const checks = {
  function_loaded: alive === "1" || steps.length > 0,
  function_alive_at_end: alive === "1",
  load_errors: loadErrors,
  error_events: errorEvents.map(summarizeEvent),
  duplicate_error_events: Object.entries(
    errorEvents.reduce((acc, e) => { const k = `${e.exception}|${e.transaction}`; acc[k] = (acc[k] || 0) + 1; return acc; }, {}),
  ).filter(([, n]) => n > 1).map(([k, n]) => ({ key: k, count: n })),
  sentinel_event: sentinelEvents.map(summarizeEvent),
  transaction_envelopes: transactions.length,
  span_envelopes: spans.length,
  segments: segments.map(summarizeSegment),
  function_segments: segments.filter((s) => s.op === "function.gcp").map(summarizeSegment),
  sentinel_segment: segments.filter((s) => s.name === "sentinel").length,
  child_spans: children.map((c) => ({ name: c.name, op: c.op, origin: c.origin, status: c.status, segment_name: c.segment_name })),
  manual_test_span: children.filter((c) => c.name === "My First Test Transaction").map((c) => ({ name: c.name, op: c.op, status: c.status, segment_name: c.segment_name })),
  log_batches: logs.length,
  log_bodies: logs.flatMap((l) => l.items),
  other_item_types: [...new Set(otherTypes)],
  deprecation_output: lines.filter((l) => /deprecat/i.test(l)),
  domain_warning: lines.filter((l) => /domain/i.test(l) && /deprecat|warn/i.test(l)),
};

const requestSteps = steps.filter((s) => !s.route.startsWith("sentinel"));
const expectedError = expectKind === "error";
const requestOk = expectedError
  ? checks.error_events.length > 0 && requestSteps.every((s) => s.http_code === "500")
  : requestSteps.length > 0 && requestSteps.every((s) => s.http_code === "200") && (expectSpans === "0" || checks.manual_test_span.length > 0);
const spansOk = expectSpans === "0" ? checks.span_envelopes === 0 : checks.function_segments.length >= requestSteps.length;
const status = !checks.function_loaded
  ? "broken"
  : requestOk && spansOk && checks.sentinel_event.length > 0
    ? "works"
    : "partial";

const result = {
  id: "QS-gcp-functions",
  variant,
  snippet,
  command,
  functions_framework_version: ffVersion,
  sdk_package_version: sdkPkgVersion,
  sdk,
  steps,
  console: { line_count: lines.length, notable, integrations, integration_count: integrations.length, full: lines },
  envelopes: { counts: { event: events.length, span: spans.length, transaction: transactions.length, log: logs.length }, items },
  spansRaw: raw.filter((x) => x.header.type === "span").map((x) => x.payload),
  verdict: { status, expected: { kind: expectKind, spans: expectSpans === "1" }, checks },
};
console.log(JSON.stringify(result, null, 2));
