import "./instrument-cf.ts";
import * as Sentry from "@sentry/deno";
import express from "express";

const REC = `http://127.0.0.1:${Deno.env.get("REC_PORT")}`;
const app = express();
app.get("/downstream", async (_req, res) => {
  const r = await fetch(`${REC}/hit-fetch-cf`);
  res.json(await r.json());
});
app.get("/sentinel", (_req, res) => { Sentry.captureMessage("sentinel"); res.json({ ok: true }); });
app.listen(Number(Deno.env.get("APP_PORT")), "127.0.0.1", () => console.log("PORT=" + Deno.env.get("APP_PORT")));
