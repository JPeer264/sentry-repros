// Started with `node --import ./instrument.mjs app.mjs` (platform-includes/getting-started-node/javascript.mdx:95),
// so the instrument file is not imported here. Body: getting-started-use/javascript.express.mdx:24-36.
import express from "express";
import * as Sentry from "@sentry/node";
import { registerRoutes } from "./routes.mjs";

const app = express();

// Add your routes, etc.
registerRoutes(app);

// Add this after all routes,
// but before any and other error-handling middlewares are defined
Sentry.setupExpressErrorHandler(app);

app.listen(Number(process.env.APP_PORT), "127.0.0.1", () => console.log(`app listening ${process.env.APP_PORT}`));
