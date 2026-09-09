// Builds results-<variant>.json from the sink and the runner console log.
import fs from "node:fs";

const [variant, command, appLog, sinkUrl, exitCode, sentinelState] = process.argv.slice(2);
const items = await (await fetch(`${sinkUrl}/__items`)).json();
const raw = await (await fetch(`${sinkUrl}/__items?raw=1`)).json();
const log = fs.existsSync(appLog) ? fs.readFileSync(appLog, "utf8") : "";
const lines = log.split("\n").filter(Boolean);

const pick = (prefix) => lines.filter((l) => l.startsWith(prefix)).map((l) => l.slice(prefix.length).trim());
const integrationsFromDebug = lines.filter((l) => l.includes("Integration installed:")).map((l) => l.replace(/.*Integration installed:\s*/, "").trim());
const integrationsFromRunner = pick("[invoke] integrations")[0]?.split(" ").filter(Boolean) ?? [];
const integrations = integrationsFromDebug.length ? integrationsFromDebug : integrationsFromRunner;
const outcomeLine = pick("[invoke] outcome")[0];
const outcome = outcomeLine ? JSON.parse(outcomeLine) : undefined;
const notable = lines.filter((l) => /warn|deprecat|no longer supported|error|Redirected|Skipping|Runtime hook|registerHooks|Bundler plugin|Initializing Sentry|Sentry Logger \[log\]: (Using|Proxying|Disabling)/i.test(l) && !l.includes("Integration installed"));

const envHeader = raw[0]?.envHeader;
const events = raw.filter((r) => r.header.type === "event");
const spanEnvelopes = raw.filter((r) => r.header.type === "span");
const transactions = raw.filter((r) => r.header.type === "transaction");
const logs = raw.filter((r) => r.header.type === "log");
const itemTypes = raw.reduce((acc, r) => { acc[r.header.type] = (acc[r.header.type] || 0) + 1; return acc; }, {});

const attr = (s, k) => s.attributes?.[k]?.value;
const spans = spanEnvelopes.flatMap((r) => (r.payload.items || []).map((s) => ({
  name: s.name,
  op: attr(s, "sentry.op"),
  origin: attr(s, "sentry.origin"),
  is_segment: s.is_segment,
  segment_name: attr(s, "sentry.segment.name"),
  segment_name_source: attr(s, "sentry.segment.name.source") ?? attr(s, "sentry.source"),
  status: s.status,
  status_message: attr(s, "sentry.status.message") ?? attr(s, "sentry.status_message"),
  kind: attr(s, "sentry.kind"),
  parent_span_id: s.parent_span_id ?? null,
  trace_id: s.trace_id,
  attributes: Object.fromEntries(Object.entries(s.attributes || {}).filter(([k]) => /^(faas\.|cloud\.|aws\.|url\.|http\.|server\.)/.test(k)).map(([k, v]) => [k, v.value])),
  all_attribute_keys: Object.keys(s.attributes || {}),
})));

const summarizeEvent = (r) => {
  const p = r.payload;
  const ex = p.exception?.values?.[0];
  return {
    event_id: p.event_id,
    level: p.level,
    message: p.message,
    exception: ex ? `${ex.type}: ${ex.value}` : undefined,
    mechanism: ex?.mechanism,
    has_stacktrace: !!ex?.stacktrace?.frames?.length,
    transaction: p.transaction,
    trace: p.contexts?.trace,
    request: p.request,
    user: p.user,
    tags: p.tags,
    contexts_keys: Object.keys(p.contexts || {}),
    aws_lambda_context: p.contexts?.["aws.lambda"],
    aws_cloudwatch_context: p.contexts?.["aws.cloudwatch.logs"],
    cloud_resource_context: p.contexts?.cloud_resource,
    release: p.release,
    environment: p.environment,
    sdk: p.sdk ? { name: p.sdk.name, version: p.sdk.version, integrations: p.sdk.integrations } : undefined,
    runtime: p.contexts?.runtime,
  };
};

const errorEvents = events.filter((r) => r.payload.exception?.values?.some((v) => v.type && v.value && v.value !== "sentinel"));
const sentinelEvents = events.filter((r) => r.payload.message === "sentinel");
const lambdaSegments = spans.filter((s) => s.is_segment && (s.op === "function.aws" || s.op === "function.aws.lambda"));
const checks = {
  runner_exit_code: Number(exitCode),
  handler_loaded: pick("[invoke] loaded").length > 0,
  handler_redirected_to_shim: pick("[invoke] loaded")[0]?.includes("run-lambda-handler") ?? false,
  invocation_outcome: outcome,
  error_events: errorEvents.length,
  error_event_mechanisms: errorEvents.map((r) => r.payload.exception.values[0].mechanism),
  duplicate_error_events: errorEvents.length > 1,
  error_event_has_request: errorEvents.map((r) => r.payload.request != null),
  error_event_has_aws_lambda_context: errorEvents.map((r) => r.payload.contexts?.["aws.lambda"] != null),
  sentinel_event: sentinelEvents.length,
  sentinel_state: sentinelState,
  transaction_envelopes: transactions.length,
  span_envelopes: spanEnvelopes.length,
  lambda_segments: lambdaSegments.map((s) => ({ name: s.name, op: s.op, status: s.status, faas: Object.fromEntries(Object.entries(s.attributes).filter(([k]) => k.startsWith("faas."))), cloud: Object.fromEntries(Object.entries(s.attributes).filter(([k]) => k.startsWith("cloud."))), url: s.attributes["url.full"] })),
  log_envelopes: logs.length,
  log_bodies: logs.flatMap((r) => (r.payload.items || []).map((l) => `${l.level}: ${l.body}`)),
  other_item_types: Object.keys(itemTypes).filter((t) => !["event", "span", "transaction", "log"].includes(t)),
  require_banner: lines.filter((l) => l.includes("no longer supported")),
  deprecation_output: lines.filter((l) => /deprecat/i.test(l)),
};

const status = !checks.handler_loaded && checks.runner_exit_code !== 0
  ? "broken"
  : checks.error_events >= 1 && checks.lambda_segments.length === 1 && checks.error_events === 1 && sentinelState === "arrived"
    ? "works"
    : "partial";

const result = {
  id: "QS-aws-lambda",
  variant,
  status,
  command,
  sdk: envHeader?.sdk ? { name: envHeader.sdk.name, version: envHeader.sdk.version } : pick("[invoke] sdk")[0],
  integrations,
  integration_source: integrationsFromDebug.length ? "debug output" : "runner introspection of client._integrations",
  runner_options_line: pick("[invoke] options")[0],
  steps: [
    { step: "preload", note: pick("[invoke] LAMBDA_TASK_ROOT")[0] },
    { step: "load handler", note: pick("[invoke] loaded")[0] ?? "(handler never loaded)" },
    { step: "invoke", note: outcomeLine ?? "(no invocation)" },
    { step: "sentinel", note: sentinelState },
  ],
  console: { notable, all: lines },
  envelopes: {
    item_types: itemTypes,
    envelope_header: envHeader ? { sdk: envHeader.sdk, has_trace_dsc: !!envHeader.trace, dsn: envHeader.dsn } : undefined,
    events: events.map(summarizeEvent),
    spans,
    transactions: transactions.map((r) => ({ name: r.payload.transaction, op: r.payload.contexts?.trace?.op })),
    logs: logs.map((r) => (r.payload.items || []).map((l) => ({ level: l.level, body: l.body, attributes: Object.keys(l.attributes || {}) }))),
  },
  verdict: checks,
};
console.log(JSON.stringify(result, null, 2));
