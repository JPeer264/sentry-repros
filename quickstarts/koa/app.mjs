// Started with `node --import ./instrument.mjs app.mjs` (platform-includes/getting-started-node/javascript.mdx:95),
// so the instrument file is not imported here. Body: getting-started-use/javascript.koa.mdx:22-32.
import Koa from "koa";
import * as Sentry from "@sentry/node";
import { registerRoutes } from "./routes.mjs";

const app = new Koa();

Sentry.setupKoaErrorHandler(app);

// Add your routes, etc.
registerRoutes(app);

app.listen(Number(process.env.APP_PORT), "127.0.0.1", () => console.log(`app listening ${process.env.APP_PORT}`));
