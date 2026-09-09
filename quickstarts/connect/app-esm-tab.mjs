// platform-includes/getting-started-use/javascript.connect.mdx:18-33 (ESM tab), verbatim apart from the
// routes call and the listen address. The extensionless `import "./instrument"` is exactly as printed.
// Import this first!
import "./instrument";

// Now import other modules
import connect from "connect";
import * as Sentry from "@sentry/node";
import { registerRoutes } from "./routes.mjs";

const app = connect();

Sentry.setupConnectErrorHandler(app);

// Add your routes, etc.
registerRoutes(app);

app.listen(Number(process.env.APP_PORT), "127.0.0.1", () => console.log(`app listening ${process.env.APP_PORT}`));
