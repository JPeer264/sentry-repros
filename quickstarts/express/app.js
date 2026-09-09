// platform-includes/getting-started-use/javascript.express.mdx:1-18 (CommonJS tab), verbatim.
// Require this first!
require("./instrument");

// Now require other modules
const express = require("express");
const Sentry = require("@sentry/node");
const { registerRoutes } = require("./routes.js");

const app = express();

// Add your routes, etc.
registerRoutes(app);

// Add this after all routes,
// but before any and other error-handling middlewares are defined
Sentry.setupExpressErrorHandler(app);

app.listen(Number(process.env.APP_PORT), "127.0.0.1", () => console.log(`app listening ${process.env.APP_PORT}`));
