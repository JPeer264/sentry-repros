import Koa from "koa";
import Router from "@koa/router";
import * as Sentry from "@sentry/deno";

const app = new Koa();
const router = new Router();

router.get("/users/:id", ctx => {
  ctx.body = { id: ctx.params.id };
});
router.get("/boom", () => {
  throw new Error("koa boom");
});
router.get("/sentinel", ctx => {
  Sentry.captureMessage("sentinel");
  ctx.body = "ok";
});

app.use(router.routes()).use(router.allowedMethods());

if (Deno.env.get("ERR_HANDLER") === "manual") {
  app.on("error", err =>
    Sentry.captureException(err, { mechanism: { type: "manual.koa.onerror", handled: false } }),
  );
}

if (Deno.env.get("ERR_HANDLER") === "attach") {
  const { attachKoaErrorHandler } = await import("@sentry/server-utils");
  attachKoaErrorHandler(app as unknown as { on: (e: "error", l: (err: unknown, ctx?: unknown) => void) => unknown });
}

const port = Number(Deno.env.get("APP_PORT"));
app.listen(port, () => console.log("PORT=" + port));
