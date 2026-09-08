import "./instrument.ts";
import * as Sentry from "@sentry/deno";
import { Application, Router } from "@oak/oak";

const PORT = Number(Deno.env.get("APP_PORT"));
// NAMING: off | after | finally | routeruse | routeruse+finally
const NAMING = Deno.env.get("NAMING") || "after";
const MOUNT = Deno.env.get("MOUNT") || "serve";

function name(ctx: any, where: string) {
  const span = Sentry.getActiveSpan();
  const route = ctx.matched?.at(-1)?.path;
  console.log(`[${where}] ${ctx.request.url.pathname} span=${!!span} matched=${JSON.stringify(ctx.matched?.map((l: any) => l.path))}`);
  if (span && route) {
    Sentry.updateSpanName(span, `${ctx.request.method} ${route}`);
    span.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, "route");
  }
}

const router = new Router();

if (NAMING.startsWith("routeruse")) {
  router.use((ctx: any, next: any) => {
    name(ctx, "router.use");
    return next();
  });
}

router.get("/users/:id", (ctx: any) => { ctx.response.body = { id: ctx.params.id }; });
router.get("/ok", (ctx: any) => { ctx.response.body = "ok"; });
router.get("/error/:id", () => { throw new Error("oak route boom"); });
router.get("/sentinel", (ctx: any) => { Sentry.captureMessage("sentinel"); ctx.response.body = "s"; });

const app = new Application();

// error middleware (needed for app.listen(); harmless with app.fetch)
app.use(async (ctx: any, next: any) => {
  try { await next(); }
  catch (e) { Sentry.captureException(e, { mechanism: { type: "oak", handled: false } }); throw e; }
});

if (NAMING === "after") {
  app.use(async (ctx: any, next: any) => { await next(); name(ctx, "app.after"); });
} else if (NAMING.endsWith("finally")) {
  app.use(async (ctx: any, next: any) => { try { await next(); } finally { name(ctx, "app.finally"); } });
}

app.use(router.routes());
app.use(router.allowedMethods());

if (MOUNT === "listen") {
  console.log(`mount=listen ready ${PORT}`);
  await app.listen({ port: PORT, hostname: "127.0.0.1" });
} else {
  Deno.serve({ port: PORT, hostname: "127.0.0.1", onListen: () => console.log(`mount=serve ready ${PORT}`) }, app.fetch);
}
