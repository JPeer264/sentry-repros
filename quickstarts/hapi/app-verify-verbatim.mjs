// The ESM tab (getting-started-use/javascript.hapi.mdx:26-48) with the import extension fixed, and the verify
// snippet (getting-started-verify/javascript.hapi.mdx:13-19) pasted verbatim where "All your routes etc." sits.
// This is what a user who follows only the guide ends up with (the tracing variant of the snippet replaces the
// same route, so only the Issues one is pasted here; routes.mjs carries the tracing one).
// Import this first!
import "./instrument.mjs";

// Now import other modules
import * as Sentry from "@sentry/node";
import Hapi from "@hapi/hapi";

const init = async () => {
  const server = Hapi.server({
    port: Number(process.env.APP_PORT),
    host: "127.0.0.1",
  });

  // All your routes etc.
  server.route({
    method: "GET",
    path: "/debug-sentry",
    handler: (request, h) => {
      throw new Error("My first Sentry error!");
    },
  });

  await Sentry.setupHapiErrorHandler(server);

  await server.start();
};

init();
