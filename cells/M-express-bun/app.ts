import "./instrument";
import * as Sentry from "@sentry/bun";
import express from "express";
import mysql from "mysql";

const connection = mysql.createConnection({ host: "127.0.0.1", port: 3307, user: "root", database: "app" });

const app = express();

app.get("/users/:id", (req, res) => {
  res.json({ id: req.params.id });
});

app.get("/boom", () => {
  throw new Error("express boom");
});

app.get("/db", (_req, res) => {
  connection.query("SELECT id, name FROM users LIMIT 2", (err, rows) => {
    if (err) {
      res.status(500).json({ error: String(err) });
      return;
    }
    res.json({ rows });
  });
});

app.get("/fetchout", async (_req, res) => {
  const r = await fetch(`http://127.0.0.1:${process.env.SINK_PORT}/__record?from=express`);
  res.json({ ok: r.ok });
});

app.get("/iso/:tag", async (req, res) => {
  const tag = req.params.tag;
  Sentry.setTag("who", tag);
  await new Promise(r => setTimeout(r, 60 + Math.random() * 60));
  Sentry.captureException(new Error(`iso ${tag}`));
  res.json({ tag });
});

app.get("/log", (_req, res) => {
  Sentry.logger.info("hello from express on bun", { route: "/log" });
  res.json({ logged: true });
});

app.get("/sentinel", (_req, res) => {
  Sentry.captureMessage("sentinel");
  res.json({ sentinel: true });
});

if (process.env.ERROR_HANDLER) {
  Sentry.setupExpressErrorHandler(app);
}

const server = app.listen(Number(process.env.PORT || 0), "127.0.0.1", () => {
  const port = (server.address() as any).port;
  console.log(`PORT=${port} injected=${JSON.stringify((globalThis as any).__SENTRY_ORCHESTRION__?.bundler)}`);
});
