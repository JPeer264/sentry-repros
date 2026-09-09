// app.mjs without the deprecated `Sentry.setupHapiErrorHandler(server)` call (migration/v10-to-v11/index.mdx:715-720).
// Started with `node --import ./instrument.mjs app-no-handler.mjs`.
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
