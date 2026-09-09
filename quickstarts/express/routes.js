const Sentry = require("@sentry/node");

// CommonJS copy of routes.mjs for the require("./instrument") variant.
function registerRoutes(app) {
  app.use(function auditMiddleware(req, res, next) {
    next();
  });

  app.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error!");
  });

  app.get("/debug-sentry-tracing", async (req, res) => {
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

  app.get("/users/:id", (req, res) => res.json({ id: req.params.id }));

  app.get("/error-404", (req, res, next) =>
    next(Object.assign(new Error("custom 404"), { status: 404, statusCode: 404 }))
  );
  app.get("/error-503", (req, res, next) =>
    next(Object.assign(new Error("custom 503"), { status: 503, statusCode: 503 }))
  );

  app.get("/debug-log", (req, res) => {
    Sentry.logger.info("User example action completed");
    res.end("logged\n");
  });

  app.get("/sentinel", (req, res) => {
    Sentry.captureMessage("sentinel");
    res.end("sentinel\n");
  });
}

module.exports = { registerRoutes };
