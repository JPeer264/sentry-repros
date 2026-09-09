const Sentry = require("@sentry/node");

// CommonJS copy of routes.mjs for the CommonJS tab.
function registerRoutes(app) {
  app.addHook("onRequest", function auditHook(request, reply, done) {
    done();
  });

  // platform-includes/getting-started-verify/javascript.fastify.mdx:13-15, verbatim
  app.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error!");
  });

  // platform-includes/getting-started-verify/javascript.fastify.mdx:36-47, verbatim except the path
  app.get("/debug-sentry-tracing", async (request, reply) => {
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

  app.get("/users/:id", async (request) => ({ id: request.params.id }));

  app.get("/error-404", async () => {
    throw Object.assign(new Error("custom 404"), { statusCode: 404 });
  });
  app.get("/error-503", async () => {
    throw Object.assign(new Error("custom 503"), { statusCode: 503 });
  });

  // includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13
  app.get("/debug-log", async () => {
    Sentry.logger.info("User example action completed");
    return "logged\n";
  });

  app.get("/sentinel", async () => {
    Sentry.captureMessage("sentinel");
    return "sentinel\n";
  });
}

module.exports = { registerRoutes };
