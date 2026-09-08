import "./instrument";
import * as Sentry from "@sentry/bun";
import { Application, Router } from "@oak/oak";
import mysql from "mysql2";

const PORT = Number(process.env.APP_PORT);
const MODE = process.env.MODE || "fetch";

const db = mysql.createConnection({ host: "127.0.0.1", port: 3307, user: "root", database: "app" });

const router = new Router();

if (process.env.NAMING === "on") router.use((ctx, next) => {
  const span = Sentry.getActiveSpan();
  const route = ctx.matched?.at(-1)?.path;
  console.log(`[naming] ${ctx.request.url.pathname} span=${!!span} route=${route}`);
  if (span && route) {
    Sentry.updateSpanName(span, `${ctx.request.method} ${route}`);
    span.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, "route");
  }
  return next();
});

router.get("/users/:id", ctx => { ctx.response.body = { id: ctx.params.id }; });
router.get("/ok", ctx => { ctx.response.body = "ok"; });
router.get("/error", () => { throw new Error("oak bun boom"); });
router.get("/db", async ctx => {
  const rows: any = await new Promise((res, rej) =>
    db.query("SELECT id, name FROM users", (e: any, r: any) => (e ? rej(e) : res(r))),
  );
  ctx.response.body = { rows: rows.length };
});
router.get("/sentinel", ctx => { Sentry.captureMessage("sentinel"); ctx.response.body = "s"; });

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

const handler = (req: Request) => app.fetch(req);

if (MODE === "fetch") {
  Bun.serve({ port: PORT, hostname: "127.0.0.1", fetch: handler });
} else if (MODE === "routes") {
  Bun.serve({
    port: PORT,
    hostname: "127.0.0.1",
    routes: {
      "/users/:id": handler,
      "/ok": handler,
      "/error": handler,
      "/db": handler,
      "/sentinel": handler,
    },
    fetch: handler,
  });
} else if (MODE === "derived") {
  const routes: Record<string, typeof handler> = {};
  for (const r of router) routes[r.path] = handler;
  console.log("derived routes:", Object.keys(routes).join(" "));
  Bun.serve({ port: PORT, hostname: "127.0.0.1", routes, fetch: handler });
} else if (MODE === "listen") {
  app.addEventListener("listen", () => console.log(`mode=listen ready ${PORT}`));
  app.listen({ port: PORT, hostname: "127.0.0.1" });
} else if (MODE === "wildcard") {
  Bun.serve({ port: PORT, hostname: "127.0.0.1", routes: { "/*": handler }, fetch: handler });
}
console.log(`mode=${MODE} ready ${PORT}`);
