// Builds results-<variant>.json from the sink, the program console log and the exit code.
import fs from "node:fs";

const [variant, command, appLog, sinkUrl, appExit, pkgDir, expectSentinel] = process.argv.slice(2);

const items = await (await fetch(`${sinkUrl}/__items`)).json();
const raw = await (await fetch(`${sinkUrl}/__items?raw=1`)).json();
const log = fs.existsSync(appLog) ? fs.readFileSync(appLog, "utf8") : "";
const lines = log.split("\n").filter(Boolean);
const ver = (p) => { try { return JSON.parse(fs.readFileSync(`${pkgDir}/node_modules/${p}/package.json`, "utf8")).version; } catch { return null; } };

const events = items.filter((i) => i.type === "event");
const spans = items.filter((i) => i.type === "span");
const transactions = items.filter((i) => i.type === "transaction");
const logs = items.filter((i) => i.type === "log");
const otherTypes = [...new Set(items.filter((i) => !["event", "span", "transaction", "log"].includes(i.type)).map((i) => i.type))];
const attr = (a, k) => (a && a[k] && typeof a[k] === "object" ? a[k].value : a?.[k]);
const spanItems = raw.filter((x) => x.header.type === "span").flatMap((x) => (x.payload.items || []).map((s) => ({
  name: s.name, op: attr(s.attributes, "sentry.op"), origin: attr(s.attributes, "sentry.origin"), status: s.status,
  is_segment: s.is_segment, span_id: s.span_id, parent_span_id: s.parent_span_id, trace_id: s.trace_id,
  segment_name: attr(s.attributes, "sentry.segment.name"), source: attr(s.attributes, "sentry.source"),
  custom_op_attribute: attr(s.attributes, "op"), attribute_keys: Object.keys(s.attributes || {}),
  start: s.start_timestamp, end: s.end_timestamp,
})));
const logItems = raw.filter((x) => x.header.type === "log").flatMap((x) => (x.payload.items || []).map((l) => ({
  level: l.level, body: l.body, attributes: Object.fromEntries(Object.entries(l.attributes || {}).map(([k, v]) => [k, v?.value ?? v])),
})));
const metricItems = raw.filter((x) => x.header.type === "trace_metric").flatMap((x) => (x.payload.items || []).map((m) => ({ name: m.name, type: m.type, value: m.value })));
const envHeaders = raw.map((x) => x.envHeader);
const sdk = events[0]
  ? { name: events[0].sdk, version: events[0].sdk_version, runtime: events[0].runtime, runtime_version: events[0].runtime_version }
  : { name: envHeaders[0]?.sdk?.name, version: envHeaders[0]?.sdk?.version };
const sdkPackages = [...new Set(envHeaders.flatMap((h) => (h?.sdk?.packages || []).map((p) => `${p.name}@${p.version}`)))];

const integrations = lines.filter((l) => l.includes("Integration installed:")).map((l) => l.replace(/.*Integration installed:\s*/, "").trim());
const notable = lines.filter((l) => /warn|deprecat|error|initialized from|Runtime hook|registerHooks|Initializing Sentry|Experimental|Type Stripping|Unhandled|exit/i.test(l) && !l.includes("Integration installed"));

const summarizeEvent = (e) => ({ exception: e.exception, mechanism: e.mechanism, handled: e.handled, level: e.level, trace_id: e.trace_id, message: e.message });
const checks = {
  app_exit_code: Number(appExit),
  error_event_sentry_test_error: events.filter((e) => (e.exception || "").includes("Sentry Test Error")).map(summarizeEvent),
  any_error_event: events.filter((e) => e.exception && !e.message).map(summarizeEvent),
  message_events: events.filter((e) => !e.exception).map(summarizeEvent),
  sentinel_event: events.filter((e) => e.message === "sentinel").map(summarizeEvent),
  sentinel_span: spanItems.filter((s) => s.name === "sentinel").map((s) => ({ op: s.op, origin: s.origin, is_segment: s.is_segment, status: s.status })),
  test_transaction_span: spanItems.filter((s) => s.name === "My First Test Transaction"),
  all_spans: spanItems.map((s) => ({ name: s.name, op: s.op, origin: s.origin, status: s.status, is_segment: s.is_segment, parent_span_id: s.parent_span_id, segment_name: s.segment_name, source: s.source })),
  transaction_envelopes: transactions.length,
  span_envelopes: spans.length,
  log_batches: logs.length,
  log_items: logItems,
  metric_items: metricItems,
  other_item_types: otherTypes,
  deprecation_output: lines.filter((l) => /deprecat/i.test(l)),
  cause_printed_to_console: lines.filter((l) => /Sentry Test Error/.test(l) && !/Sentry Logger/.test(l)).length,
};

let status;
if (variant === "runpromise") {
  status = checks.app_exit_code === 0 ? "works" : events.length + spans.length + logs.length === 0 ? "broken" : "partial";
} else if (variant === "logs") {
  const n = logItems.filter((l) => /User example action completed|Slow operation detected|Validation failed/.test(l.body)).length;
  status = n === 3 ? "works" : n > 0 ? "partial" : "broken";
} else if (["tracing", "launch", "v4"].includes(variant)) {
  const span = checks.test_transaction_span[0];
  status = span && span.op === "test" && checks.error_event_sentry_test_error.length ? "works" : span ? "partial" : "broken";
} else {
  status = checks.error_event_sentry_test_error.length ? "works" : checks.sentinel_event.length ? "partial" : "broken";
}

const result = {
  id: "QS-effect",
  variant,
  command,
  effect_version: ver("effect"),
  effect_platform_node_version: ver("@effect/platform-node"),
  sdk,
  sdk_packages: sdkPackages,
  console: { line_count: lines.length, notable, integrations, integration_count: integrations.length, full: lines },
  envelopes: { counts: { event: events.length, span: spans.length, transaction: transactions.length, log: logs.length, trace_metric: metricItems.length }, items },
  spansRaw: raw.filter((x) => x.header.type === "span").map((x) => x.payload),
  verdict: { status, checks },
};
console.log(JSON.stringify(result, null, 2));
