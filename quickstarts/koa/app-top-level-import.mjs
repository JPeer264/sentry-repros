// platform-includes/getting-started-add-top-level-import/javascript.koa.mdx:19-35 (ESM tab), verbatim apart
// from the routes call and the listen address. No docs page renders this include; it is the only Koa
// snippet that imports `@koa/router` and creates a `router`.
// Ensure to import this before importing any other modules!
import './instrument.js'

import Koa from 'koa';
import Router from '@koa/router';
import * as Sentry from "@sentry/node";
import { registerRoutes } from "./routes.mjs";

const router = new Router();
const app = new Koa();

Sentry.setupKoaErrorHandler(app);

// Add your routes, etc.
registerRoutes(app);

app.listen(Number(process.env.APP_PORT), "127.0.0.1", () => console.log(`app listening ${process.env.APP_PORT}`));
