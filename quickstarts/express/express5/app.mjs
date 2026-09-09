// Same as ../app.mjs; `express` resolves to ./node_modules/express (v5), @sentry/node resolves upward.
import express from "express";
import * as Sentry from "@sentry/node";
import { registerRoutes } from "../routes.mjs";

const app = express();

// Add your routes, etc.
registerRoutes(app);

// Add this after all routes,
// but before any and other error-handling middlewares are defined
Sentry.setupExpressErrorHandler(app);

app.listen(Number(process.env.APP_PORT), "127.0.0.1", () => console.log(`app listening ${process.env.APP_PORT}`));
