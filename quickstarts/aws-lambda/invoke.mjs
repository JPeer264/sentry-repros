// Local stand-in for the AWS Lambda Node runtime (aws-lambda-ric): reads LAMBDA_TASK_ROOT and _HANDLER after the
// NODE_OPTIONS preloads ran, loads the handler module the way the RIC does, invokes it once with a fake API Gateway
// v1 event and a fake context, then captures a sentinel message and a sentinel span and flushes.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const require = createRequire(import.meta.url);
const taskRoot = process.env.LAMBDA_TASK_ROOT || process.cwd();
const handlerString = process.env._HANDLER || process.env.HANDLER_FILE || "handler-cjs.handler";
console.log(`[invoke] LAMBDA_TASK_ROOT=${process.env.LAMBDA_TASK_ROOT ?? "(unset)"} _HANDLER=${process.env._HANDLER ?? "(unset)"} SENTRY_ORIGINAL_HANDLER=${process.env.SENTRY_ORIGINAL_HANDLER ?? "(unset)"}`);

// aws-lambda-ric UserFunction.js resolution order: extensionless require, .js (require unless type=module), .js import, .mjs import, .cjs require
function hasTypeModule(file) {
  let dir = path.dirname(file);
  while (true) {
    const pj = path.join(dir, "package.json");
    if (fs.existsSync(pj)) { try { return JSON.parse(fs.readFileSync(pj, "utf8")).type === "module"; } catch { return false; } }
    const parent = path.dirname(dir);
    if (parent === dir) return false;
    dir = parent;
  }
}
async function loadModule(handler) {
  const base = path.basename(handler);
  const moduleRoot = handler.slice(0, handler.length - base.length);
  const m = base.match(/^([^.]*)\.(.*)$/);
  if (!m) throw new Error(`bad handler string ${handler}`);
  const file = path.resolve(taskRoot, moduleRoot, m[1]);
  const tryRequire = (ext) => (fs.existsSync(file + ext) ? { mod: require(file + ext), file: file + ext, loader: "require" } : undefined);
  const tryImport = async (ext) => (fs.existsSync(file + ext) ? { mod: await import(pathToFileURL(file + ext).href), file: file + ext, loader: "import" } : undefined);
  const loaded = tryRequire("") || (!hasTypeModule(file) && tryRequire(".js")) || (hasTypeModule(file) && (await tryImport(".js"))) || (await tryImport(".mjs")) || tryRequire(".cjs");
  if (!loaded) throw new Error(`module not found for ${handler}`);
  const fn = m[2].split(".").reduce((o, k) => o?.[k], loaded.mod);
  if (typeof fn !== "function") throw new Error(`${m[2]} is not a function in ${loaded.file}`);
  return { fn, file: loaded.file, loader: loaded.loader };
}

const { fn: handler, file: handlerFile, loader } = await loadModule(handlerString);
console.log(`[invoke] loaded ${handlerFile} via ${loader}`);

const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME || "qs-aws-lambda";
const event = {
  resource: "/hello",
  path: "/hello",
  httpMethod: "POST",
  headers: {
    Host: "abc123.execute-api.us-east-1.amazonaws.com",
    "X-Forwarded-Proto": "https",
    "X-Forwarded-Port": "443",
    "User-Agent": "qs-aws-lambda-invoke",
    "Content-Type": "application/json",
    Cookie: "session=secret",
  },
  queryStringParameters: { q: "1" },
  pathParameters: null,
  requestContext: {
    accountId: "123456789012",
    apiId: "abc123",
    stage: "prod",
    requestId: randomUUID(),
    httpMethod: "POST",
    path: "/prod/hello",
    identity: { sourceIp: "203.0.113.7", userAgent: "qs-aws-lambda-invoke" },
  },
  body: JSON.stringify({ hello: "world" }),
  isBase64Encoded: false,
};
const deadline = Date.now() + Number(process.env.LAMBDA_REMAINING_MS || 3000);
const context = {
  callbackWaitsForEmptyEventLoop: true,
  functionName,
  functionVersion: "$LATEST",
  invokedFunctionArn: `arn:aws:lambda:us-east-1:123456789012:function:${functionName}`,
  memoryLimitInMB: "128",
  awsRequestId: randomUUID(),
  logGroupName: `/aws/lambda/${functionName}`,
  logStreamName: "2026/09/09/[$LATEST]0123456789abcdef",
  identity: undefined,
  clientContext: undefined,
  getRemainingTimeInMillis: () => Math.max(0, deadline - Date.now()),
};

// The RIC always passes a callback and, when the handler returns a promise, settles on it.
function invoke(fn, ev, ctx) {
  return new Promise((resolve, reject) => {
    let rv;
    try {
      rv = fn(ev, ctx, (err, res) => (err ? reject(err) : resolve(res)));
    } catch (e) {
      reject(e);
      return;
    }
    if (rv && typeof rv.then === "function") rv.then(resolve, reject);
  });
}

let outcome;
try {
  const result = await invoke(handler, event, context);
  outcome = { ok: true, result };
} catch (e) {
  outcome = { ok: false, error: `${e?.name}: ${e?.message}` };
}
console.log(`[invoke] outcome ${JSON.stringify(outcome)}`);

const Sentry = await import("@sentry/aws-serverless");
const client = Sentry.getClient();
const meta = client?.getSdkMetadata?.()?.sdk;
console.log(`[invoke] sdk ${meta ? `${meta.name} ${meta.version}` : "(no client)"}`);
console.log(`[invoke] integrations ${client ? Object.keys(client._integrations ?? {}).join(" ") : "(no client)"}`);
console.log(`[invoke] options tracesSampleRate=${client?.getOptions?.().tracesSampleRate} traceLifecycle=${client?.getOptions?.().traceLifecycle} enableLogs=${client?.getOptions?.().enableLogs}`);
Sentry.captureMessage("sentinel");
Sentry.startSpan({ name: "sentinel", op: "sentinel" }, () => {});
await Sentry.flush(5000);
console.log("[invoke] sentinel sent");
