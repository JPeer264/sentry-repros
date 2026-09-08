import "./instrument.ts";
import Fastify from "fastify";
import * as Sentry from "@sentry/deno";
import http from "node:http";

const RECORDER_PORT = Number(Deno.env.get("RECORDER_PORT") || 41339);

const app = Fastify();

app.get("/nodehttp", () =>
  new Promise((resolve, reject) => {
    const req = http.get(
      { host: "127.0.0.1", port: RECORDER_PORT, path: "/from-nodehttp" },
      (res) => {
        res.resume();
        res.on("end", () => resolve({ via: "node:http", status: res.statusCode }));
      },
    );
    req.on("error", reject);
  }));

app.get("/fetch2", async () => {
  const res = await fetch(`http://127.0.0.1:${RECORDER_PORT}/from-fetch2`);
  return { via: "fetch", body: await res.text() };
});

app.get("/sentinel", () => {
  Sentry.captureMessage("sentinel");
  return { ok: true };
});

const port = Number(Deno.env.get("APP_PORT") || 47025);
await app.listen({ port, host: "127.0.0.1" });
console.log(`READY http://127.0.0.1:${port}`);
