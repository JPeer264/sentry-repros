import Koa from "koa";
import Router from "@koa/router";
import * as Sentry from "@sentry/deno";

const app = new Koa();
const router = new Router();

router.get("/users/:id", ctx => { ctx.body = { id: ctx.params.id }; });
router.get("/boom", () => { throw new Error("koa boom"); });
router.get("/sentinel", ctx => { Sentry.captureMessage("sentinel"); ctx.body = "ok"; });

app.use(router.routes()).use(router.allowedMethods());

if (Deno.env.get("ERR_HANDLER") === "1") {
  app.on("error", err => Sentry.captureException(err, { mechanism: { type: "manual.koa.onerror", handled: false } }));
}

const port = Number(Deno.env.get("APP_PORT") ?? 0);
const server = app.listen(port, () => {
  const addr = server.address();
  console.log("PORT=" + (typeof addr === "object" && addr ? addr.port : addr));
});

console.log("ORCH=", JSON.stringify((globalThis as any).__SENTRY_ORCHESTRION__));
