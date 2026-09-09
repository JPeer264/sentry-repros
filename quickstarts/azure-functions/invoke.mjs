// Repro-only runner, stands in for the Azure Functions host: loads one function file the way the host does
// (require), invokes the handler once with a fake HttpRequest and context (v3 shape, or @azure/functions v4
// classes), snapshots the sink right after the handler's own flush, then captures a sentinel message and span
// through the same client, flushes and polls the sink for them (hard deadline 60 s, no fixed sleeps).
import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const [variant, file, model = "v3", fnName = "verify"] = process.argv.slice(2);
const sink = (process.env.SENTRY_TUNNEL || "").replace(/\/$/, "");
const expectSpans = process.env.EXPECT_SPANS !== "0";
const steps = [];
const step = (name, data) => {
  steps.push({ step: name, at: new Date().toISOString(), ...data });
  console.log(`[repro] ${name} ${JSON.stringify(data)}`);
};

// Loading the SDK module here does not initialize it; init happens in the function file, as the guide shows.
const Sentry = require("@sentry/node");
const get = (url) => Sentry.suppressTracing(() => fetch(url));
const itemsAt = async () => {
  const items = await (await get(`${sink}/__items`)).json();
  const counts = {};
  for (const i of items) counts[i.type] = (counts[i.type] || 0) + 1;
  return counts;
};

const registered = {};
if (model === "v4") {
  const af = require("@azure/functions");
  const capture = (name, options) => {
    registered[name] = typeof options === "function" ? options : options.handler;
  };
  for (const m of ["http", "get", "post", "generic"]) af.app[m] = capture;
}

let handler;
try {
  const mod = require(`./${file}`);
  handler = model === "v4" ? registered[fnName] : typeof mod === "function" ? mod : (mod.default ?? mod[fnName]);
  step("load", { file, ok: typeof handler === "function", exportType: typeof handler, registered: Object.keys(registered) });
} catch (e) {
  step("load", { file, ok: false, error: `${e.name}: ${e.message}` });
}

const invocationId = "8f0c2e4a-0000-4000-8000-000000000001";
const url = `http://localhost:7071/api/${fnName}?name=sentry`;
const headers = { host: "localhost:7071", "user-agent": "curl/8.7.1", accept: "*/*", "x-forwarded-for": "203.0.113.7" };
const contextLog = [];

if (typeof handler === "function") {
  try {
    let response;
    if (model === "v4") {
      const { HttpRequest, InvocationContext } = require("@azure/functions");
      const request = new HttpRequest({ method: "GET", url, headers });
      const context = new InvocationContext({
        functionName: fnName,
        invocationId,
        logHandler: (level, ...args) => contextLog.push(`${level}: ${args.join(" ")}`),
      });
      response = await handler(request, context);
    } else {
      const req = { method: "GET", url, originalUrl: url, headers, query: { name: "sentry" }, params: {}, body: undefined, rawBody: undefined, user: null };
      const log = (...a) => contextLog.push(`info: ${a.join(" ")}`);
      for (const l of ["error", "warn", "info", "verbose"]) log[l] = (...a) => contextLog.push(`${l}: ${a.join(" ")}`);
      const context = {
        invocationId,
        functionName: fnName,
        executionContext: { invocationId, functionName: fnName, functionDirectory: process.cwd(), retryContext: null },
        bindingData: { invocationId, query: req.query, headers: req.headers, sys: {} },
        bindings: { req },
        bindingDefinitions: [],
        traceContext: { traceparent: null, tracestate: null, attributes: {} },
        log,
        done: () => {},
        res: undefined,
      };
      await handler(context, req);
      response = context.res;
    }
    step("invoke", { ok: true, response, contextLog });
  } catch (e) {
    step("invoke", { ok: false, error: `${e.name}: ${e.message}`, contextLog });
  }
}
step("sink-after-function", { counts: await itemsAt() });

Sentry.captureMessage("sentinel");
await Sentry.startSpan({ name: "sentinel", op: "sentinel" }, async () => {});
const flushed = await Sentry.flush(2000);
step("sentinel-flush", { flushed });

const deadline = Date.now() + 60_000;
let arrived = false;
while (Date.now() < deadline) {
  const items = await (await get(`${sink}/__items`)).json();
  const ev = items.some((i) => i.type === "event" && i.message === "sentinel");
  const sp = !expectSpans || items.some((i) => i.type === "span" && (i.raw || []).some((r) => r.name === "sentinel"));
  if (ev && sp) {
    arrived = true;
    break;
  }
  await new Promise((r) => setTimeout(r, 200));
}
step("sentinel-arrived", { arrived, counts: await itemsAt() });
fs.writeFileSync(`.steps-${variant}.json`, JSON.stringify(steps));
process.exit(0);
