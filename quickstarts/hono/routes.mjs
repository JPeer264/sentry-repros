import * as Sentry from "@sentry/hono/node";
import { HTTPException } from "hono/http-exception";

// The guide's verify routes plus the extra routes this repro needs, registered on any Hono app.
export function registerRoutes(app) {
  app.use(async function auditMiddleware(c, next) {
    await next();
  });

  // platform-includes/getting-started-verify/javascript.hono.mdx:13-15, verbatim
  app.get("/debug-sentry", () => {
    throw new Error("My first Sentry error!");
  });

  // platform-includes/getting-started-verify/javascript.hono.mdx:36-47, verbatim except the path,
  // so both verify snippets can be hit in one server run
  app.get("/debug-sentry-tracing", async () => {
    await Sentry.startSpan(
      {
        op: "test",
        name: "My First Test Transaction",
      },
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for 100ms
        throw new Error("My first Sentry error!");
      }
    );
  });

  app.get("/users/:id", (c) => c.json({ id: c.req.param("id") }));

  app.get("/error-401", () => {
    throw new HTTPException(401, { message: "custom 401" });
  });
  app.get("/error-404", () => {
    throw new HTTPException(404, { message: "custom 404" });
  });
  app.get("/error-503", () => {
    throw new HTTPException(503, { message: "custom 503" });
  });

  // includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13
  app.get("/debug-log", (c) => {
    Sentry.logger.info("User example action completed");
    return c.text("logged\n");
  });

  app.get("/sentinel", (c) => {
    Sentry.captureMessage("sentinel");
    return c.text("sentinel\n");
  });
}
