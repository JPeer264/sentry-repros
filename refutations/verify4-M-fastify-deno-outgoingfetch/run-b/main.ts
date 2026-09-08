import "./instrument.ts";
import * as Sentry from "@sentry/deno";
import Fastify from "fastify";
import http from "node:http";

const REC = `http://127.0.0.1:${Deno.env.get("REC_PORT")}`;

const app = Fastify();

app.get("/fetch", async () => {
  const r = await fetch(`${REC}/downstream-fetch`, { headers: { "x-via": "global-fetch" } });
  return { via: "fetch", status: r.status };
});

app.get("/nodehttp", () => {
  return new Promise(resolve => {
    const req = http.request(
      `${REC}/downstream-nodehttp`,
      { headers: { "x-via": "node-http" } },
      res => { res.resume(); res.on("end", () => resolve({ via: "node:http", status: res.statusCode })); },
    );
    req.end();
  });
});

app.get("/sentinel", () => {
  Sentry.captureMessage("sentinel");
  return { ok: true };
});

const port = Number(Deno.env.get("APP_PORT"));
await app.listen({ port, host: "127.0.0.1" });
console.log("READY http://127.0.0.1:" + port);
