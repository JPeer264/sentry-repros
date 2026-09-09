// app.mjs without the deprecated Sentry.setupExpressErrorHandler(app) call:
// v10-to-v11/index.mdx:715 says the integration captures errors on its own now.
import express from "express";
import { registerRoutes } from "./routes.mjs";

const app = express();

registerRoutes(app);

app.listen(Number(process.env.APP_PORT), "127.0.0.1", () => console.log(`app listening ${process.env.APP_PORT}`));
