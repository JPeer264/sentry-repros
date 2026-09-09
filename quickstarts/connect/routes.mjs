import * as Sentry from "@sentry/node";

// The guide's verify routes plus the extra routes this repro needs, mounted on any Connect app.
// Connect has no router; `app.use(path, fn)` mounts by path prefix, which is what the verify snippet uses.
export function registerRoutes(app) {
  app.use(function auditMiddleware(req, res, next) {
    next();
  });

  // platform-includes/getting-started-verify/javascript.connect.mdx:13-15, verbatim
  app.use("/debug-sentry", (req, res) => {
    throw new Error("My first Sentry error!");
  });

  // platform-includes/getting-started-verify/javascript.connect.mdx:36-47, verbatim except the path,
  // so both verify snippets can be hit in one server run
  app.use("/debug-sentry-tracing", async (req, res) => {
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

  app.use("/users", (req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ id: req.url.slice(1) }));
  });

  app.use("/error-404", (req, res, next) => {
    const err = new Error("custom 404");
    err.status = 404;
    next(err);
  });
  app.use("/error-503", (req, res, next) => {
    const err = new Error("custom 503");
    err.status = 503;
    next(err);
  });

  // includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13
  app.use("/debug-log", (req, res) => {
    Sentry.logger.info("User example action completed");
    res.end("logged\n");
  });

  app.use("/sentinel", (req, res) => {
    Sentry.captureMessage("sentinel");
    res.end("sentinel\n");
  });
}
