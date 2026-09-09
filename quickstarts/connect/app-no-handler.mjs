// The guide's ESM app body (getting-started-use/javascript.connect.mdx:22-32) without the
// `Sentry.setupConnectErrorHandler(app)` line, which does not exist in this build. Started with
// `node --import ./instrument.mjs` or `NODE_OPTIONS`, so the instrument file is not imported here.
import connect from "connect";
import * as Sentry from "@sentry/node";
import { registerRoutes } from "./routes.mjs";

const app = connect();

// Add your routes, etc.
registerRoutes(app);

app.listen(Number(process.env.APP_PORT), "127.0.0.1", () => console.log(`app listening ${process.env.APP_PORT}`));
