// platform-includes/getting-started-use/javascript.hapi.mdx:1-24 (CommonJS tab), verbatim apart from the
// routes call and the listen address (the guide uses port 3030 on localhost).
// Require this first!
require("./instrument");

// Now require other modules
const Sentry = require("@sentry/node");
const Hapi = require('@hapi/hapi');
const { registerRoutes } = require("./routes.js");

const init = async () => {
  const server = Hapi.server({
    port: Number(process.env.APP_PORT),
    host: '127.0.0.1',
  });

  // All your routes etc.
  await registerRoutes(server);

  await Sentry.setupHapiErrorHandler(server);

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

init();
