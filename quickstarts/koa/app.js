// platform-includes/getting-started-use/javascript.koa.mdx:1-16 (CommonJS tab), verbatim apart from the
// routes call and the listen address.
// Require this first!
require("./instrument");

// Now require other modules
const Koa = require("koa");
const Sentry = require("@sentry/node");
const { registerRoutes } = require("./routes.js");

const app = new Koa();

Sentry.setupKoaErrorHandler(app);

// Add your routes, etc.
registerRoutes(app);

app.listen(Number(process.env.APP_PORT), "127.0.0.1", () => console.log(`app listening ${process.env.APP_PORT}`));
