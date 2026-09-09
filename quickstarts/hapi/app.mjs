// Started with `node --import ./instrument.mjs app.mjs` (platform-includes/getting-started-node/javascript.mdx:95),
// so the instrument file is not imported here. Body: getting-started-use/javascript.hapi.mdx:30-47, verbatim apart
// from the routes call and the listen address (the guide uses port 3030 on localhost).
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
