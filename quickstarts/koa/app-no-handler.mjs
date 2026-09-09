// app.mjs without the deprecated `Sentry.setupKoaErrorHandler(app)` call (migration/v10-to-v11/index.mdx:715-719).
import Koa from "koa";
import { registerRoutes } from "./routes.mjs";

const app = new Koa();

// Add your routes, etc.
registerRoutes(app);

app.listen(Number(process.env.APP_PORT), "127.0.0.1", () => console.log(`app listening ${process.env.APP_PORT}`));
