import "./instrument";
import * as Sentry from "@sentry/bun";
import { Application, Router } from "@oak/oak";
import mysql from "mysql2";

const PORT = Number(process.env.APP_PORT);
const REC_PORT = Number(process.env.REC_PORT);
const MOUNT = process.env.MOUNT || "serve";

// module scope connection (K11)
const db = mysql.createConnection({ host: "127.0.0.1", port: 3307, user: "root", database: "app" });

const router = new Router();

// name the span from the matched oak route
if (process.env.NAMING !== "off") router.use((ctx, next) => {
  const span = Sentry.getActiveSpan();
  const route = ctx.matched?.at(-1)?.path;
  console.log(`[router-use] ${ctx.request.url.pathname} span=${!!span} matched=${JSON.stringify(ctx.matched?.map((l: any) => l.path))}`);
  if (span && route) {
    Sentry.updateSpanName(span, `${ctx.request.method} ${route}`);
    span.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, "route");
  }
  return next();
});

router.get("/users/:id", ctx => { ctx.response.body = { id: ctx.params.id }; });
router.get("/ok", ctx => { ctx.response.body = "ok"; });
router.get("/error", () => { throw new Error("oak bun boom"); });
router.get("/iso/:tag", async ctx => {
  const tag = ctx.params.tag!;
  Sentry.setTag("who", tag);
  await new Promise(r => setTimeout(r, 60 + Math.random() * 60));
  Sentry.setTag("who2", tag);
  Sentry.captureException(new Error(`iso ${tag}`));
  ctx.response.body = tag;
});
router.get("/downstream", async ctx => {
  const r = await fetch(`http://127.0.0.1:${REC_PORT}/rec/from-oak`);
  ctx.response.body = await r.text();
});
router.get("/db", async ctx => {
  const rows: any = await new Promise((res, rej) =>
    db.query("SELECT id, name FROM users", (e: any, r: any) => (e ? rej(e) : res(r))),
  );
  ctx.response.body = { rows: rows.length };
});
router.get("/log", ctx => {
  Sentry.logger.info("hello from oak", { route: "/log" });
  ctx.response.body = "logged";
});
router.get("/sentinel", ctx => { Sentry.captureMessage("sentinel"); ctx.response.body = "s"; });

const app = new Application();

if (process.env.ERRMW !== "off") app.use(async (ctx, next) => {
  try {
    await next();
  } catch (e) {
    Sentry.captureException(e, { mechanism: { type: "oak", handled: false } });
    throw e;
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

if (MOUNT === "listen") {
  console.log("mount=listen");
  await app.listen({ port: PORT, hostname: "127.0.0.1" });
} else {
  Bun.serve({ port: PORT, hostname: "127.0.0.1", fetch: (req: Request) => app.fetch(req) });
  console.log(`mount=serve ready ${PORT}`);
}
