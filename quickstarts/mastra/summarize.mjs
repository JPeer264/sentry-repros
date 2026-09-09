// Builds results-<variant>.json from the sink, the app console log and the mock log.
import fs from "node:fs";

const [variant, command, appLog, mockLog, sinkUrl, appExit] = process.argv.slice(2);

const items = await (await fetch(`${sinkUrl}/__items`)).json();
const raw = await (await fetch(`${sinkUrl}/__items?raw=1`)).json();
const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, "utf8") : "");
const lines = read(appLog).split("\n").filter(Boolean);
const mockLines = read(mockLog).split("\n").filter((l) => l.startsWith("mock "));
const ver = (p) => JSON.parse(fs.readFileSync(`node_modules/${p}/package.json`, "utf8")).version;

const events = items.filter((i) => i.type === "event");
const spans = items.filter((i) => i.type === "span");
const transactions = items.filter((i) => i.type === "transaction");
const logs = items.filter((i) => i.type === "log");
const otherTypes = items.filter((i) => !["event", "span", "transaction", "log"].includes(i.type)).map((i) => i.type);
const allSpans = spans.flatMap((s) => s.raw || []);
const byId = new Map(allSpans.map((s) => [s.span_id, s]));
const attrsOf = (s) => Object.fromEntries(Object.entries(s.attrs || {}).filter(([k]) => !/^(sentry\.(op|origin|source|segment\.name)|server\.address|sentry\.sdk)/.test(k)));
const spanView = (s) => ({
  name: s.name,
  op: s.op,
  origin: s.origin,
  status: s.status,
  is_segment: s.is_segment,
  span_id: s.span_id,
  parent_span_id: s.parent_span_id,
  parent_name: s.parent_span_id ? byId.get(s.parent_span_id)?.name ?? "(not in sink)" : null,
  segment_name: s.segment_name,
  attrs: attrsOf(s),
});
const integrations = lines.filter((l) => l.includes("Integration installed:")).map((l) => l.replace(/.*Integration installed:\s*/, "").trim());
const notable = lines.filter((l) => /warn|deprecat|error|Initializing|Runtime hook|registerHooks|Bundler plugin|Mastra|exporter|agent |client present|flushed/i.test(l) && !l.includes("Integration installed"));
const opCounts = allSpans.reduce((acc, s) => { acc[s.op ?? "(none)"] = (acc[s.op ?? "(none)"] || 0) + 1; return acc; }, {});
const firstEvent = events[0];
const sdk = firstEvent
  ? { name: firstEvent.sdk, version: firstEvent.sdk_version, runtime: firstEvent.runtime, runtime_version: firstEvent.runtime_version }
  : { name: spans[0]?.sdk, version: spans[0]?.sdk_version };

const checks = {
  app_exit_code: Number(appExit),
  agent_generate_threw: lines.some((l) => l.startsWith("agent generate threw")),
  agent_text: lines.find((l) => l.startsWith("agent text:")) ?? null,
  agent_usage: lines.find((l) => l.startsWith("agent usage:")) ?? null,
  mock_requests: mockLines.filter((l) => l.includes("POST")),
  span_envelopes: spans.length,
  transaction_envelopes: transactions.length,
  span_count: allSpans.length,
  op_counts: opCounts,
  origins: [...new Set(allSpans.map((s) => s.origin))],
  segments: allSpans.filter((s) => s.is_segment).map((s) => `${s.op ?? ""} ${s.name}`.trim()),
  agent_spans: allSpans.filter((s) => s.op === "gen_ai.invoke_agent").map(spanView),
  chat_spans: allSpans.filter((s) => s.op === "gen_ai.chat").map(spanView),
  tool_spans: allSpans.filter((s) => s.op === "gen_ai.execute_tool").map(spanView),
  other_spans: allSpans.filter((s) => !["gen_ai.invoke_agent", "gen_ai.chat", "gen_ai.execute_tool", "test"].includes(s.op)).map(spanView),
  sentinel_span: allSpans.filter((s) => s.name === "sentinel").map((s) => ({ op: s.op, is_segment: s.is_segment, parent_span_id: s.parent_span_id, origin: s.origin })),
  sentinel_event: events.filter((e) => e.message === "sentinel").map((e) => ({ environment: e.environment, release: e.release, transaction: e.transaction, breadcrumbs: e.breadcrumbs, trace_id: e.trace_id })),
  error_events: events.filter((e) => e.exception).map((e) => ({ exception: e.exception, mechanism: e.mechanism, handled: e.handled, transaction: e.transaction, trace_id: e.trace_id })),
  environment_on_events: [...new Set(events.map((e) => e.environment))],
  release_on_events: [...new Set(events.map((e) => e.release))],
  trace_ids: [...new Set([...spans.map((s) => s.trace_id), ...events.map((e) => e.trace_id)])],
  log_batches: logs.length,
  other_item_types: [...new Set(otherTypes)],
  deprecation_output: lines.filter((l) => /deprecat/i.test(l)),
};
const status = checks.app_exit_code !== 0 || checks.agent_generate_threw
  ? "broken"
  : checks.agent_spans.length > 0 && checks.chat_spans.length > 0 && checks.tool_spans.length > 0 && checks.sentinel_event.length > 0 && checks.sentinel_span.length > 0
    ? "works"
    : "partial";

console.log(JSON.stringify({
  id: "QS-mastra",
  variant,
  command,
  versions: { "@mastra/core": ver("@mastra/core"), "@mastra/sentry": ver("@mastra/sentry"), "@mastra/observability": ver("@mastra/observability"), "@mastra/otel-exporter": ver("@mastra/otel-exporter"), "@sentry/node": ver("@sentry/node"), node: process.version },
  sdk,
  console: { line_count: lines.length, notable, integrations, integration_count: integrations.length, full: lines },
  mock: mockLines,
  envelopes: { counts: { event: events.length, span: spans.length, transaction: transactions.length, log: logs.length }, items },
  spansRaw: raw.filter((x) => x.header.type === "span").map((x) => x.payload),
  verdict: { status, checks },
}, null, 2));
