// The guide's verify routes plus the extra routes this repro needs, registered on any Elysia app.
// Guide: docs/platforms/javascript/guides/elysia/index.mdx (verify snippets at :182-184 and :205-216).
import * as Sentry from "@sentry/elysia";
import { status } from "elysia";

export function registerRoutes(app) {
  // A named BeforeHandle hook so a lifecycle phase other than Handle has a named child span.
  app.onBeforeHandle(function auditHook() {});

  // index.mdx:182-184, verbatim
  app.get("/debug-sentry", () => {
    throw new Error("My first Sentry error!");
  });

  // index.mdx:205-216, verbatim except the path, so both verify snippets can be hit in one server run
  app.get("/debug-sentry-tracing", async () => {
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

  // named handler: what-instrumentation-provides/javascript.elysia.mdx:7 says named handlers show their name
  app.get("/users/:id", function getUser({ params }) {
    return { id: params.id };
  });

  // client error with a plain throw: index.mdx:139 says 4xx are not captured by default
  app.get("/error-404", ({ set }) => {
    set.status = 404;
    throw new Error("custom 404");
  });
  // server error with a plain throw
  app.get("/error-503", ({ set }) => {
    set.status = 503;
    throw new Error("custom 503");
  });
  // server error thrown through Elysia's own status() helper
  app.get("/error-status-503", () => {
    throw status(503, "custom status 503");
  });

  // includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13
  app.get("/debug-log", () => {
    Sentry.logger.info("User example action completed");
    return "logged\n";
  });

  app.get("/sentinel", () => {
    Sentry.captureMessage("sentinel");
    return "sentinel\n";
  });

  return app;
}
