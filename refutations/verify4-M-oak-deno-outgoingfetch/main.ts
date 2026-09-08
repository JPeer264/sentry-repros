import "./instrument.ts";
import * as Sentry from "@sentry/deno";
import { Application, Router } from "@oak/oak";
import { request as httpRequest } from "node:http";

const REC = Deno.env.get("REC_PORT");
const APP_PORT = Number(Deno.env.get("APP_PORT"));

const router = new Router();
router.get("/users/:id", ctx => {
  ctx.response.body = { id: ctx.params.id };
});
router.get("/downstream", async ctx => {
  const r = await fetch(`http://127.0.0.1:${REC}/rec/from-oak`);
  ctx.response.body = await r.json();
});
router.get("/downstream-node", async ctx => {
  const body = await new Promise<string>((resolve, reject) => {
    const req = httpRequest({ hostname: "127.0.0.1", port: Number(REC), path: "/rec/from-oak-node", method: "GET" }, res => {
      let d = ""; res.on("data", c => (d += c)); res.on("end", () => resolve(d));
    });
    req.on("error", reject);
    req.end();
  });
  ctx.response.body = body;
});
router.get("/sentinel", ctx => {
  Sentry.captureMessage("sentinel");
  ctx.response.body = "ok";
});

const app = new Application();

app.use(async (ctx, next) => {
  await next();
  const span = Sentry.getActiveSpan();
  const route = ctx.matched?.at(-1)?.path;
  if (span && route) {
    Sentry.updateSpanName(span, `${ctx.request.method} ${route}`);
    span.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, "route");
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

Deno.serve({ port: APP_PORT, hostname: "127.0.0.1" }, app.fetch);
