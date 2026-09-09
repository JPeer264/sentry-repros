// app.js with the instrument file pointed at `@sentry/hono/node` (index.mdx:168) instead of `@sentry/node`.
// docs/platforms/javascript/common/install/commonjs.mdx:29 for javascript.hono), then index.mdx:264-276 in CommonJS.
// Require this first!
require("./instrument-hono-node");

// Now require other modules
const { serve } = require("@hono/node-server");
const { Hono } = require("hono");

// Your application code goes here
const { sentry } = require("@sentry/hono/node");
const { registerRoutes } = require("./routes.js");

const app = new Hono();

app.use(sentry(app));

registerRoutes(app);

serve({ fetch: app.fetch, port: Number(process.env.APP_PORT), hostname: "127.0.0.1" }, (info) => console.log(`app listening ${info.port}`));
