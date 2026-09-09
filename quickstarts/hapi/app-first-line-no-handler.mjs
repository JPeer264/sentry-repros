// app-first-line.mjs without the deprecated `Sentry.setupHapiErrorHandler(server)` call: a first-line
// `import "./instrument.mjs"`, no --import flag, error capture left to the integration's auto-registration.
// Import this first!
import "./instrument.mjs";

// Now import other modules
import Hapi from "@hapi/hapi";
import { registerRoutes } from "./routes.mjs";

const init = async () => {
  const server = Hapi.server({
    port: Number(process.env.APP_PORT),
    host: "127.0.0.1",
  });

  // All your routes etc.
  await registerRoutes(server);

  await server.start();
};

init();
