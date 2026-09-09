// platform-includes/getting-started-use/javascript.hono.mdx:1-10 verbatim (rendered by
// docs/platforms/javascript/common/install/commonjs.mdx:29 for javascript.hono), then index.mdx:264-276 in CommonJS.
// Require this first!
require("./instrument");

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
