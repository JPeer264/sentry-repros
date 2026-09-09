// Builds results-<variant>.json from the sink, the app console log and the curl step log.
import fs from "node:fs";

const [variant, command, appLog, stepsFile, sinkUrl, alive, expectSpans, buildLog] = process.argv.slice(2);

const items = await (await fetch(`${sinkUrl}/__items`)).json();
const raw = await (await fetch(`${sinkUrl}/__items?raw=1`)).json();
const outgoing = await (await fetch(`${sinkUrl}/__headers`)).json();
const log = fs.existsSync(appLog) ? fs.readFileSync(appLog, "utf8") : "";
const lines = log.split("\n").filter(Boolean);
const build = buildLog && fs.existsSync(buildLog) ? fs.readFileSync(buildLog, "utf8").split("\n").filter(Boolean) : [];
const steps = fs.existsSync(stepsFile)
  ? fs.readFileSync(stepsFile, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l))
  : [];
const ver = (p) => JSON.parse(fs.readFileSync(`node_modules/${p}/package.json`, "utf8")).version;

const events = items.filter((i) => i.type === "event");
const spans = items.filter((i) => i.type === "span");
const transactions = items.filter((i) => i.type === "transaction");
const logs = items.filter((i) => i.type === "log");
const otherTypes = items.filter((i) => !["event", "span", "transaction", "log"].includes(i.type)).map((i) => i.type);
const segments = spans.flatMap((s) => (s.raw || []).filter((r) => r.is_segment));
const children = spans.flatMap((s) => (s.raw || []).filter((r) => !r.is_segment));
const rawSpanItems = raw.filter((x) => x.header.type === "span").flatMap((x) => x.payload.items || []);
const attrs = (s) => Object.fromEntries(Object.entries(s.attributes || {}).map(([k, v]) => [k, v?.value]));

const integrations = lines
  .filter((l) => l.includes("Integration installed:"))
  .map((l) => l.replace(/.*Integration installed:\s*/, "").trim());
const notable = lines.filter(
  (l) => /warn|deprecat|no longer supported|error|initialized from|Runtime hook|registerHooks|Bundler plugin|Initializing Sentry|\[@sentry\/nitro\]|Sentry Logger \[warn\]/i.test(l) && !l.includes("Integration installed"),
);

const firstEvent = events[0];
const sdk = firstEvent
  ? { name: firstEvent.sdk, version: firstEvent.sdk_version, runtime: firstEvent.runtime, runtime_version: firstEvent.runtime_version }
  : { name: spans[0]?.sdk, version: spans[0]?.sdk_version };

const summarizeEvent = (e) => ({ exception: e.exception, mechanism: e.mechanism, handled: e.handled, transaction: e.transaction, request: e.request?.url, hasRequestData: e.request?.hasData, trace_id: e.trace_id });
const usersSegment = rawSpanItems.find((s) => s.is_segment && attrs(s)["http.route"] === "/api/users/:id");
const usersTrace = usersSegment ? rawSpanItems.filter((s) => s.trace_id === usersSegment.trace_id) : [];
const eventsRaw = raw
  .filter((x) => x.header.type === "event")
  .map((x) => ({
    transaction: x.payload.transaction,
    message: x.payload.message,
    level: x.payload.level,
    exception_values: (x.payload.exception?.values || []).map((v) => ({ type: v.type, value: v.value, mechanism: v.mechanism, frames: v.stacktrace?.frames?.length })),
    contexts_nitro: x.payload.contexts?.nitro,
    tags: x.payload.tags,
    request: x.payload.request ? { url: x.payload.request.url, method: x.payload.request.method, headers: Object.keys(x.payload.request.headers || {}) } : undefined,
  }));

const checks = {
  app_started: alive === "1" || steps.length > 0,
  app_alive_at_end: alive === "1",
  error_event_debug_sentry: events
    .filter((e) => e.exception === "Error: My first Sentry error!" && e.transaction === "GET /debug-sentry")
    .map(summarizeEvent),
  error_event_tracing_route: events
    .filter((e) => e.exception === "Error: My first Sentry error!" && e.transaction !== "GET /debug-sentry")
    .map(summarizeEvent),
  error_404_captured: events.filter((e) => (e.exception || "").includes("custom 404")).map(summarizeEvent),
  error_503_captured: events.filter((e) => (e.exception || "").includes("custom 503")).map(summarizeEvent),
  other_error_events: events.filter((e) => e.exception && !/My first Sentry error!|custom 404|custom 503/.test(e.exception)).map(summarizeEvent),
  duplicate_error_events: Object.entries(
    events.reduce((acc, e) => { const k = `${e.exception}|${e.transaction}`; acc[k] = (acc[k] || 0) + 1; return acc; }, {}),
  ).filter(([, n]) => n > 1).map(([k, n]) => ({ key: k, count: n })),
  sentinel_event: events.filter((e) => e.message === "sentinel").map((e) => ({ mechanism: e.mechanism, handled: e.handled, transaction: e.transaction, request: e.request?.url })),
  transaction_envelopes: transactions.length,
  span_envelopes: spans.length,
  segments: segments.map((s) => ({ name: s.name, op: s.op, source: s.source, route: s.route, status: s.status, status_code: s.status_code, url: s.url, origin: s.origin })),
  route_named_segment_for_users: segments.some((s) => s.name === "GET /api/users/:id"),
  users_request_span_tree: usersTrace.map((s) => ({ name: s.name, op: attrs(s)["sentry.op"], origin: attrs(s)["sentry.origin"], is_segment: s.is_segment, span_id: s.span_id, parent_span_id: s.parent_span_id, status: s.status })),
  outgoing_body: steps.find((s) => s.body)?.body,
  users_segment_attributes: usersSegment
    ? Object.fromEntries(Object.entries(attrs(usersSegment)).filter(([k]) => /^(url\.path\.parameter\.|params\.|http\.route|sentry\.segment\.name|server\.port|http\.request\.method|url\.)/.test(k)))
    : null,
  child_spans: [...new Set(children.map((c) => `${c.op ?? ""} ${c.name}`.trim()))],
  child_ops: [...new Set(children.map((c) => c.op))],
  child_origins: [...new Set(children.map((c) => c.origin))],
  middleware_spans: [...new Set(children.filter((c) => c.op === "middleware").map((c) => c.name))],
  middleware_nitro_spans: [...new Set(children.filter((c) => c.op === "middleware.nitro").map((c) => c.name))],
  http_client_spans: [...new Set(children.filter((c) => c.op === "http.client").map((c) => c.name))],
  manual_test_span: children.filter((c) => c.op === "test").map((c) => ({ name: c.name, status: c.status, segment_name: c.segment_name })),
  process_payment_span: rawSpanItems.filter((s) => s.name === "process-payment").map((s) => ({ op: attrs(s)["sentry.op"], is_segment: s.is_segment, segment_name: attrs(s)["sentry.segment.name"] })),
  server_timing_header: steps.find((s) => s.server_timing)?.server_timing ?? [],
  outgoing_request_headers: outgoing,
  log_batches: logs.length,
  log_bodies: logs.flatMap((l) => l.items),
  other_item_types: [...new Set(otherTypes)],
  require_banner: lines.filter((l) => l.includes("no longer supported")),
  deprecation_output: lines.filter((l) => /deprecat/i.test(l)),
  nitro_default_error_log: lines.filter((l) => /My first Sentry error!|custom 503|custom 404/.test(l) && !/Sentry Logger/.test(l)).length,
  build_notable: build.filter((l) => /sentry|warn|error|source ?map/i.test(l)),
};

const spansOk = expectSpans === "0" ? checks.span_envelopes === 0 : checks.route_named_segment_for_users;
const status = !checks.app_started
  ? "broken"
  : checks.error_event_debug_sentry.length > 0 && spansOk && checks.sentinel_event.length > 0
    ? "works"
    : "partial";

const result = {
  id: "QS-nitro",
  variant,
  command,
  nitro_version: ver("nitro"),
  h3_version: ver("h3"),
  srvx_version: ver("srvx"),
  sdk,
  steps,
  console: { line_count: lines.length, notable, integrations, integration_count: integrations.length, full: lines },
  build: { line_count: build.length, full: build },
  eventsRaw,
  envelopes: { counts: { event: events.length, span: spans.length, transaction: transactions.length, log: logs.length }, items },
  spansRaw: raw.filter((x) => x.header.type === "span").map((x) => x.payload),
  verdict: { status, checks },
};
console.log(JSON.stringify(result, null, 2));
