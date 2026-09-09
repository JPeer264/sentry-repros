// platform-includes/getting-started-use/javascript.hapi.mdx:26-48 (ESM tab), verbatim apart from the
// routes call and the listen address. The extensionless `import "./instrument"` is exactly as printed.
// Import this first!
import "./instrument";

// Now import other modules
import * as Sentry from "@sentry/node";
import Hapi from "@hapi/hapi";
import { registerRoutes } from "./routes.mjs";

const init = async () => {
  const server = Hapi.server({
    port: Number(process.env.APP_PORT),
    host: "127.0.0.1",
  });

  // All your routes etc.
  await registerRoutes(server);

  await Sentry.setupHapiErrorHandler(server);

  await server.start();
};

init();
