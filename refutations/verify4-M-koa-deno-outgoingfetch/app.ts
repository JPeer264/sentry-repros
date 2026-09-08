import Koa from "koa";
import Router from "@koa/router";
import * as Sentry from "@sentry/deno";
import * as http from "node:http";

const RECORDER = Deno.env.get("RECORDER")!;
const app = new Koa();
const router = new Router();

router.get("/downstream", async (ctx) => {
  const r = await fetch(`${RECORDER}/api/fetch`);
  ctx.body = await r.text();
});

router.get("/downstream-http", (ctx) => {
  return new Promise<void>((resolve) => {
    const u = new URL(`${RECORDER}/api/node-http`);
    const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: "GET" }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => { ctx.body = d; resolve(); });
    });
    req.end();
  });
});

router.get("/sentinel", (ctx) => {
  Sentry.captureMessage("sentinel");
  ctx.body = "ok";
});

app.use(router.routes()).use(router.allowedMethods());

if (Deno.env.get("ERR_HANDLER") === "1") {
  app.on("error", (err) => Sentry.captureException(err));
}

const port = Number(Deno.env.get("PORT"));
app.listen(port, () => console.log("PORT=" + port));
