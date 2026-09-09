import Router from "@koa/router";
import * as Sentry from "@sentry/node";

// The guide's verify routes plus the extra routes this repro needs, registered on any Koa app.
// The guide never creates a router; `@koa/router` is what its verify snippet's `router.get` implies.
export function registerRoutes(app) {
  app.use(async function auditMiddleware(ctx, next) {
    await next();
  });

  const router = new Router();

  // platform-includes/getting-started-verify/javascript.koa.mdx:13-15, verbatim
  router.get("/debug-sentry", function () {
    throw new Error("My first Sentry error!");
  });

  // platform-includes/getting-started-verify/javascript.koa.mdx:35-46, verbatim except the path,
  // so both verify snippets can be hit in one server run
  router.get("/debug-sentry-tracing", async (ctx) => {
    await Sentry.startSpan(
      {
        op: "test",
        name: "My First Test Transaction",
      },
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        throw new Error("My first Sentry error!");
      }
    );
  });

  router.get("/users/:id", (ctx) => {
    ctx.body = { id: ctx.params.id };
  });

  router.get("/error-404", (ctx) => {
    ctx.throw(404, "custom 404");
  });
  router.get("/error-503", (ctx) => {
    ctx.throw(503, "custom 503");
  });

  // includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13
  router.get("/debug-log", (ctx) => {
    Sentry.logger.info("User example action completed");
    ctx.body = "logged\n";
  });

  router.get("/sentinel", (ctx) => {
    Sentry.captureMessage("sentinel");
    ctx.body = "sentinel\n";
  });

  app.use(router.routes());
  app.use(router.allowedMethods());
}
