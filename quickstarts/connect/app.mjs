// Started with `node --import ./instrument.mjs app.mjs` (platform-includes/getting-started-node/javascript.mdx:95),
// so the instrument file is not imported here. Body: getting-started-use/javascript.connect.mdx:22-32.
import connect from "connect";
import * as Sentry from "@sentry/node";
import { registerRoutes } from "./routes.mjs";

const app = connect();

Sentry.setupConnectErrorHandler(app);

// Add your routes, etc.
registerRoutes(app);

app.listen(Number(process.env.APP_PORT), "127.0.0.1", () => console.log(`app listening ${process.env.APP_PORT}`));
