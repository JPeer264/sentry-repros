import "./instrument.ts";
import * as Sentry from "@sentry/deno";
import Fastify from "fastify";
import http from "node:http";

const RECORDER = Number(Deno.env.get("RECORDER_PORT"));
const app = Fastify();

app.get("/fetch", async () => {
  const res = await fetch(`http://127.0.0.1:${RECORDER}/downstream-fetch`);
  return { via: "fetch", status: res.status };
});

app.get("/fetch-in-span", async () => {
  return await Sentry.startSpan({ name: "manual-wrap" }, async () => {
    const res = await fetch(`http://127.0.0.1:${RECORDER}/downstream-fetch-in-span`);
    return { via: "fetch-in-span", status: res.status };
  });
});

app.get("/nodehttp", async () => {
  const status: number = await new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port: RECORDER, path: "/downstream-nodehttp", method: "GET" },
      (res) => { res.resume(); res.on("end", () => resolve(res.statusCode ?? 0)); },
    );
    req.on("error", reject);
    req.end();
  });
  return { via: "nodehttp", status };
});

app.get("/sentinel", async () => { Sentry.captureMessage("sentinel"); await Sentry.flush(2000); return { ok: true }; });

await app.listen({ port: Number(Deno.env.get("APP_PORT")), host: "127.0.0.1" });
console.log("READY", Deno.env.get("APP_PORT"));
