// The CommonJS tab (getting-started-use/javascript.connect.mdx:1-16) without the
// `Sentry.setupConnectErrorHandler(app)` line, which does not exist in this build.
// Require this first!
require("./instrument");

// Now require other modules
const connect = require("connect");
const Sentry = require("@sentry/node");
const { registerRoutes } = require("./routes.js");

const app = connect();

// Add your routes, etc.
registerRoutes(app);

app.listen(Number(process.env.APP_PORT), "127.0.0.1", () => console.log(`app listening ${process.env.APP_PORT}`));
