import * as Sentry from "@sentry/deno";
import express from "express";
import mysql from "mysql";

const conn = mysql.createConnection({
  host: "127.0.0.1",
  port: 3307,
  user: "root",
  database: "app",
});

export function createApp() {
  const app = express();

  app.get("/users/:id", (req, res) => {
    res.json({ id: req.params.id });
  });

  app.get("/error", () => {
    throw new Error("express boom");
  });

  app.get("/downstream", async (_req, res) => {
    const port = Deno.env.get("REC_PORT") ?? "41735";
    const r = await fetch(`http://127.0.0.1:${port}/rec`);
    res.json({ downstream: r.status });
  });

  app.get("/db", (_req, res) => {
    conn.query("SELECT id, name FROM users", (err: unknown, rows: unknown) => {
      if (err) {
        res.status(500).json({ err: String(err) });
        return;
      }
      res.json({ rows });
    });
  });

  app.get("/log", (_req, res) => {
    Sentry.logger.info("hello from express on deno", { route: "/log" });
    res.json({ logged: true });
  });

  app.get("/iso/:tag", async (req, res) => {
    const tag = req.params.tag;
    Sentry.setTag("who", tag);
    await new Promise(r => setTimeout(r, 60 + Math.floor(Math.random() * 60)));
    Sentry.captureException(new Error(`iso-${tag}`));
    res.json({ tag });
  });

  app.get("/sentinel", (_req, res) => {
    Sentry.captureMessage("sentinel");
    res.json({ sentinel: true });
  });

  return app;
}

export function listen(app: ReturnType<typeof createApp>) {
  const port = Number(Deno.env.get("APP_PORT") ?? "41733");
  app.listen(port, "127.0.0.1", () => console.log("PORT=" + port));
}
