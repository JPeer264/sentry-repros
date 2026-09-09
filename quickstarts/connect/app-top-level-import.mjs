// platform-includes/getting-started-add-top-level-import/javascript.connect.mdx:16-29 (ESM tab), verbatim apart
// from the routes call and the listen address. No docs page renders this include.
// Ensure to import this before importing any other modules!
import './instrument.js'

import connect from 'connect';
import * as Sentry from "@sentry/node";
import { registerRoutes } from "./routes.mjs";
const app = connect();

Sentry.setupConnectErrorHandler(app);

// Add your routes, etc.
registerRoutes(app);

app.listen(Number(process.env.APP_PORT), "127.0.0.1", () => console.log(`app listening ${process.env.APP_PORT}`));
