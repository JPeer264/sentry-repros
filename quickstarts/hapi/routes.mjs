import Boom from "@hapi/boom";
import * as Sentry from "@sentry/node";

// The guide's verify routes plus the extra routes this repro needs, registered on any Hapi server.
export async function registerRoutes(server) {
  // A named request extension, so ext (middleware) spans are visible.
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

  // platform-includes/getting-started-verify/javascript.hapi.mdx:40-55, verbatim except the path,
  // so both verify snippets can be hit in one server run
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

  // Boom errors with a 4xx, a 500 and a non-500 5xx status, to see which of them Hapi hands to Sentry.
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

  // A route registered by a plugin, to see the `handler` span the migration page describes for Hapi.
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
