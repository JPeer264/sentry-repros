import * as Sentry from "@sentry/deno";
import { createServer, get as httpGet } from "node:http";

const SINK_PORT = Deno.env.get("SINK_PORT") ?? "9999";
const APP_PORT = Number(Deno.env.get("APP_PORT") ?? "8081");
const HTTP_PORT = Number(Deno.env.get("HTTP_PORT") ?? "8082");
const REC_PORT = Number(Deno.env.get("REC_PORT") ?? "8083");
const LIFECYCLE = Deno.env.get("LIFECYCLE") ?? "stream";

Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: `http://127.0.0.1:${SINK_PORT}/`,
  tracesSampleRate: 1.0,
  environment: "localenv",
  traceLifecycle: LIFECYCLE,
} as Parameters<typeof Sentry.init>[0]);

console.log("init done, sdk", Sentry.SDK_VERSION, "lifecycle", LIFECYCLE);

function activeSpanInfo() {
  const span = Sentry.getActiveSpan();
  if (!span) return null;
  const ctx = Sentry.spanToJSON(span);
  return { trace_id: ctx.trace_id, span_id: ctx.span_id, parent_span_id: ctx.parent_span_id };
}

function viaNodeHttp(path: string): Promise<void> {
  return new Promise(resolve => {
    const req = httpGet(`http://127.0.0.1:${REC_PORT}${path}`, res => {
      res.resume();
      res.on("end", () => resolve());
    });
    req.on("error", () => resolve());
  });
}

async function handle(tag: string, pathname: string): Promise<Response> {
  if (pathname === "/probe") {
    await fetch(`http://127.0.0.1:${REC_PORT}/${tag}/via-fetch`).then(r => r.text());
    await viaNodeHttp(`/${tag}/via-http`);
    const info = { tag, active: activeSpanInfo() };
    console.log("ACTIVE " + JSON.stringify(info));
    return new Response(JSON.stringify(info) + "\n", { headers: { "content-type": "application/json" } });
  }
  if (pathname === "/sentinel") {
    Sentry.captureMessage(`sentinel-${tag}`);
    return new Response("sentinel\n");
  }
  return new Response("ok\n");
}

Deno.serve({ port: APP_PORT, hostname: "127.0.0.1" }, req => handle("denoserve", new URL(req.url).pathname));

createServer(async (req, res) => {
  const pathname = new URL(req.url ?? "/", "http://127.0.0.1").pathname;
  const response = await handle("nodehttp", pathname);
  const body = await response.text();
  res.setHeader("content-type", response.headers.get("content-type") ?? "text/plain");
  res.end(body);
}).listen(HTTP_PORT, "127.0.0.1", () => console.log("node:http listening", HTTP_PORT));
