// Builds results-<variant>.json from the sink, the app console log and the curl step log.
import fs from "node:fs";

const [variant, command, appLog, stepsFile, sinkUrl, alive, expectSpans] = process.argv.slice(2);

const items = await (await fetch(`${sinkUrl}/__items`)).json();
const raw = await (await fetch(`${sinkUrl}/__items?raw=1`)).json();
const log = fs.existsSync(appLog) ? fs.readFileSync(appLog, "utf8") : "";
const lines = log.split("\n").filter(Boolean);
const steps = fs.existsSync(stepsFile)
  ? fs.readFileSync(stepsFile, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l))
  : [];
const connectVersion = JSON.parse(fs.readFileSync("node_modules/connect/package.json", "utf8")).version;

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
  (l) => /warn|deprecat|no longer supported|error|initialized from|Runtime hook|registerHooks|Bundler plugin|Initializing Sentry|TypeError|ERR_/i.test(l) && !l.includes("Integration installed"),
);

const firstEvent = events[0];
const sdk = firstEvent
  ? { name: firstEvent.sdk, version: firstEvent.sdk_version, runtime: firstEvent.runtime, runtime_version: firstEvent.runtime_version }
  : { name: spans[0]?.sdk, version: spans[0]?.sdk_version };

const summarizeEvent = (e) => ({ exception: e.exception, mechanism: e.mechanism, handled: e.handled, transaction: e.transaction, request: e.request?.url, hasRequestData: e.request?.hasData, trace_id: e.trace_id });

const checks = {
  app_started: alive === "1" || steps.length > 0,
  app_alive_at_end: alive === "1",
  startup_crash: lines.filter((l) => /TypeError|ERR_MODULE_NOT_FOUND|ERR_PACKAGE_PATH_NOT_EXPORTED|ReferenceError/.test(l)),
  error_event_debug_sentry: events
    .filter((e) => e.exception === "Error: My first Sentry error!" && (e.transaction === "GET /debug-sentry" || (e.request?.url || "").endsWith("/debug-sentry")))
    .map(summarizeEvent),
  error_event_tracing_route: events
    .filter((e) => e.exception === "Error: My first Sentry error!" && !(e.transaction === "GET /debug-sentry" || (e.request?.url || "").endsWith("/debug-sentry")))
    .map(summarizeEvent),
  error_404_captured: events.filter((e) => (e.exception || "").includes("custom 404")).map(summarizeEvent),
  error_503_captured: events.filter((e) => (e.exception || "").includes("custom 503")).map(summarizeEvent),
  duplicate_error_events: Object.entries(
    events.reduce((acc, e) => { const k = `${e.exception}|${e.transaction}`; acc[k] = (acc[k] || 0) + 1; return acc; }, {}),
  ).filter(([, n]) => n > 1).map(([k, n]) => ({ key: k, count: n })),
  sentinel_event: events.filter((e) => e.message === "sentinel").map((e) => ({ mechanism: e.mechanism, handled: e.handled, transaction: e.transaction, request: e.request?.url })),
  transaction_envelopes: transactions.length,
  span_envelopes: spans.length,
  segments: segments.map((s) => ({ name: s.name, op: s.op, source: s.source, route: s.route, status: s.status, status_code: s.status_code, url: s.url, origin: s.origin })),
  any_segment_with_route: segments.some((s) => s.route != null),
  sentinel_segment: segments.filter((s) => String(s.url || "").endsWith("/sentinel")).map((s) => ({ name: s.name, source: s.source })),
  child_spans: [...new Set(children.map((c) => `${c.op ?? ""} ${c.name}`.trim()))],
  child_ops: [...new Set(children.map((c) => c.op))],
  child_origins: [...new Set(children.map((c) => c.origin))],
  connect_spans: [...new Set(children.filter((c) => /connect/.test(String(c.origin)) || /^(handler|middleware|request_handler)/.test(String(c.op))).map((c) => `${c.op} ${c.name}`))],
  manual_test_span: children.filter((c) => c.op === "test").map((c) => ({ name: c.name, status: c.status, segment_name: c.segment_name })),
  log_batches: logs.length,
  log_bodies: logs.flatMap((l) => l.items),
  other_item_types: [...new Set(otherTypes)],
  require_banner: lines.filter((l) => l.includes("no longer supported")),
  deprecation_output: lines.filter((l) => /deprecat/i.test(l)),
  unhandled_rejection_output: lines.filter((l) => /unhandled/i.test(l)),
  connect_default_error_log: lines.filter((l) => /^Error: My first Sentry error!|^Error: custom 503|^Error: custom 404/.test(l)).length,
};

const spansOk = expectSpans === "0" ? checks.span_envelopes === 0 : checks.sentinel_segment.length > 0;
const status = !checks.app_started
  ? "broken"
  : checks.error_event_debug_sentry.length > 0 && spansOk && checks.sentinel_event.length > 0
    ? "works"
    : "partial";

const result = {
  id: "QS-connect",
  variant,
  command,
  connect_version: connectVersion,
  sdk,
  steps,
  console: { line_count: lines.length, notable, integrations, integration_count: integrations.length, full: lines },
  envelopes: { counts: { event: events.length, span: spans.length, transaction: transactions.length, log: logs.length }, items },
  spansRaw: raw.filter((x) => x.header.type === "span").map((x) => x.payload),
  verdict: { status, checks },
};
console.log(JSON.stringify(result, null, 2));
