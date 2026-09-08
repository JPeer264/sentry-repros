import "./instrument.ts";
import * as Sentry from "@sentry/deno";
import { Application, Router } from "@oak/oak";

const PORT = Number(Deno.env.get("APP_PORT"));

const api = new Router({ prefix: "/api" });
api.get("/users/:id", (ctx: any) => { ctx.response.body = { id: ctx.params.id }; });
api.get("/error/:id", () => { throw new Error("oak prefixed boom"); });

const root = new Router();
root.get("/sentinel", (ctx: any) => { Sentry.captureMessage("sentinel"); ctx.response.body = "s"; });
root.get("/", (ctx: any) => { ctx.response.body = "root"; });

const app = new Application();

app.use(async (ctx: any, next: any) => {
  try {
    await next();
  } finally {
    const span = Sentry.getActiveSpan();
    const route = ctx.matched?.at(-1)?.path;
    console.log(`[mw] ${ctx.request.url.pathname} span=${!!span} matched=${JSON.stringify(ctx.matched?.map((l: any) => l.path))}`);
    if (span && route) {
      Sentry.updateSpanName(span, `${ctx.request.method} ${route}`);
      span.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, "route");
      span.setAttribute("http.route", route);
    }
  }
});

app.use(api.routes());
app.use(api.allowedMethods());
app.use(root.routes());
app.use(root.allowedMethods());

Deno.serve({ port: PORT, hostname: "127.0.0.1", onListen: () => console.log(`ready ${PORT}`) }, app.fetch);
