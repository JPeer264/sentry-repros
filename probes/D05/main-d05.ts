import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";
import http from "node:http";

const sinkPort = Deno.env.get("SINK_PORT") ?? "9999";
const servePort = Number(Deno.env.get("SERVE_PORT") ?? "52848");
const httpPort = Number(Deno.env.get("HTTP_PORT") ?? "52849");
// "catch" -> node:http /error handler captures and answers 500
// "throw" -> node:http /error handler throws synchronously
const errorMode = Deno.env.get("ERROR_MODE") ?? "catch";

Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: `http://127.0.0.1:${sinkPort}/`,
  release: "1.0.0",
  environment: "production",
  tracesSampleRate: 1.0,
  debug: true,
  integrations: [Sentry.denoHttpIntegration({ sessionFlushingDelayMS: 2000 })],
});

Deno.serve({ port: servePort, onListen: () => console.log(`serve listening ${servePort}`) }, (req) => {
  const path = new URL(req.url).pathname;
  if (path === "/error") {
    throw new Error("serve boom");
  }
  if (path === "/sentinel") {
    Sentry.captureMessage("sentinel");
    return new Response("sentinel\n");
  }
  return new Response("ok\n");
});

http
  .createServer((req, res) => {
    const path = (req.url ?? "/").split("?")[0];
    if (path === "/error-throw") {
      throw new Error("http boom thrown");
    }
    if (path === "/error-catch") {
      Sentry.captureException(new Error("http boom caught"));
      res.statusCode = 500;
      res.end("error\n");
      return;
    }
    res.statusCode = 200;
    res.end("ok\n");
  })
  .listen(httpPort, "127.0.0.1", () => console.log(`http listening ${httpPort} mode=${errorMode}`));
