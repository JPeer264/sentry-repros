// Builds results-<variant>.json from the sink, the app console log and the curl step log.
import fs from "node:fs";

const [variant, command, expressDir, appLog, stepsFile, sinkUrl, alive] = process.argv.slice(2);

const items = await (await fetch(`${sinkUrl}/__items`)).json();
const raw = await (await fetch(`${sinkUrl}/__items?raw=1`)).json();
const log = fs.existsSync(appLog) ? fs.readFileSync(appLog, "utf8") : "";
const lines = log.split("\n").filter(Boolean);
const steps = fs.existsSync(stepsFile)
  ? fs.readFileSync(stepsFile, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l))
  : [];
const expressVersion = JSON.parse(fs.readFileSync(`${expressDir}/node_modules/express/package.json`, "utf8")).version;

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
  (l) => /warn|deprecat|no longer supported|error|initialized from|Runtime hook|registerHooks|Bundler plugin|Initializing Sentry/i.test(l) && !l.includes("Integration installed"),
);

const firstEvent = events[0];
const sdk = firstEvent
  ? { name: firstEvent.sdk, version: firstEvent.sdk_version, runtime: firstEvent.runtime, runtime_version: firstEvent.runtime_version }
  : { name: spans[0]?.sdk, version: spans[0]?.sdk_version };

const checks = {
  app_started: alive === "1" || steps.length > 0,
  app_alive_at_end: alive === "1",
  error_event_debug_sentry: events
    .filter((e) => e.exception === "Error: My first Sentry error!" && e.transaction === "GET /debug-sentry")
    .map((e) => ({ mechanism: e.mechanism, handled: e.handled, transaction: e.transaction, request: e.request?.url, trace_id: e.trace_id })),
  error_event_tracing_route: events
    .filter((e) => e.exception === "Error: My first Sentry error!" && e.transaction !== "GET /debug-sentry")
    .map((e) => ({ mechanism: e.mechanism, handled: e.handled, transaction: e.transaction, request: e.request?.url, trace_id: e.trace_id })),
  error_404_captured: events.some((e) => (e.exception || "").includes("custom 404")),
  error_503_captured: events.some((e) => (e.exception || "").includes("custom 503")),
  sentinel_event: events.some((e) => e.message === "sentinel"),
  transaction_envelopes: transactions.length,
  span_envelopes: spans.length,
  segments: segments.map((s) => ({ name: s.name, op: s.op, source: s.source, route: s.route, status: s.status, status_code: s.status_code, url: s.url })),
  route_named_segment_for_users: segments.some((s) => s.name === "GET /users/:id"),
  child_spans: [...new Set(children.map((c) => `${c.op ?? ""} ${c.name}`.trim()))],
  child_ops: [...new Set(children.map((c) => c.op))],
  manual_test_span: children.filter((c) => c.op === "test").map((c) => ({ name: c.name, status: c.status, segment_name: c.segment_name })),
  log_batches: logs.length,
  log_bodies: logs.flatMap((l) => l.items),
  other_item_types: [...new Set(otherTypes)],
  require_banner: lines.filter((l) => l.includes("no longer supported")),
  deprecation_output: lines.filter((l) => /deprecat/i.test(l)),
};

const status = !checks.app_started
  ? "broken"
  : checks.error_event_debug_sentry.length > 0 && checks.route_named_segment_for_users && checks.sentinel_event
    ? "works"
    : "partial";

const result = {
  id: "QS-express",
  variant,
  command,
  express_version: expressVersion,
  sdk,
  steps,
  console: { line_count: lines.length, notable, integrations, integration_count: integrations.length, full: lines },
  envelopes: { counts: { event: events.length, span: spans.length, transaction: transactions.length, log: logs.length }, items },
  spansRaw: raw.filter((x) => x.header.type === "span").map((x) => x.payload),
  verdict: { status, checks },
};
console.log(JSON.stringify(result, null, 2));
