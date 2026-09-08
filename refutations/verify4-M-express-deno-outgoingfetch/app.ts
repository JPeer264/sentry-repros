import "./instrument.ts";
import * as Sentry from "@sentry/deno";
import express from "express";
import * as http from "node:http";

const REC = `http://127.0.0.1:${Deno.env.get("REC_PORT")}`;
const app = express();

app.get("/downstream", async (_req, res) => {
  const r = await fetch(`${REC}/hit-fetch`);
  res.json(await r.json());
});

app.get("/downstream-http", (_req, res) => {
  http.get(`${REC}/hit-nodehttp`, r => {
    r.resume();
    r.on("end", () => res.json({ ok: true }));
  });
});

app.get("/sentinel", (_req, res) => {
  Sentry.captureMessage("sentinel");
  res.json({ ok: true });
});

const port = Number(Deno.env.get("APP_PORT"));
app.listen(port, "127.0.0.1", () => console.log("PORT=" + port));
