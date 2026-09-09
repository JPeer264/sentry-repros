const Boom = require("@hapi/boom");
const Sentry = require("@sentry/node");

// CommonJS mirror of routes.mjs, for the CommonJS tab app (app.js).
async function registerRoutes(server) {
  server.ext("onRequest", function auditExt(request, h) {
    return h.continue;
  });

  // platform-includes/getting-started-verify/javascript.hapi.mdx:13-19, verbatim
  server.route({
    method: "GET",
    path: "/debug-sentry",
    handler: (request, h) => {
      throw new Error("My first Sentry error!");
    },
  });

  // platform-includes/getting-started-verify/javascript.hapi.mdx:40-55, verbatim except the path
  server.route({
    method: "GET",
    path: "/debug-sentry-tracing",
    handler: async (request, h) => {
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
    },
  });

  server.route({
    method: "GET",
    path: "/users/{id}",
    handler: (request) => ({ id: request.params.id }),
  });

  server.route({
    method: "GET",
    path: "/error-404",
    handler: () => {
      throw Boom.notFound("custom 404");
    },
  });
  server.route({
    method: "GET",
    path: "/error-500",
    handler: () => {
      throw Boom.badImplementation("custom 500");
    },
  });
  server.route({
    method: "GET",
    path: "/error-503",
    handler: () => {
      throw Boom.serverUnavailable("custom 503");
    },
  });

  // includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13
  server.route({
    method: "GET",
    path: "/debug-log",
    handler: () => {
      Sentry.logger.info("User example action completed");
      return "logged\n";
    },
  });

  server.route({
    method: "GET",
    path: "/sentinel",
    handler: () => {
      Sentry.captureMessage("sentinel");
      return "sentinel\n";
    },
  });

  await server.register({
    name: "audit-plugin",
    register(srv) {
      srv.route({
        method: "GET",
        path: "/plugin/{id}",
        handler: (request) => ({ plugin: request.params.id }),
      });
    },
  });
}

module.exports = { registerRoutes };
