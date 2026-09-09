// platform-includes/getting-started-use/javascript.fastify.mdx:1-16 (CommonJS tab), verbatim apart from the
// routes call and the listen address.
// Require this first!
require("./instrument");

// Now require other modules
const Fastify = require("fastify");
const Sentry = require("@sentry/node");
const { registerRoutes } = require("./routes.js");

const app = Fastify();

Sentry.setupFastifyErrorHandler(app);

// Add your routes, etc.
registerRoutes(app);

app.listen({ port: Number(process.env.APP_PORT), host: "127.0.0.1" }).then(() => console.log(`app listening ${process.env.APP_PORT}`));
