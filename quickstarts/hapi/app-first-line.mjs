// The ESM tab (getting-started-use/javascript.hapi.mdx:26-48) with the import extension fixed:
// a first-line `import "./instrument.mjs"` and no --import flag (install/esm-without-import.mdx:50-60).
// Import this first!
import "./instrument.mjs";

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
