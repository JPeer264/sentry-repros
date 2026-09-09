// The ESM tab (getting-started-use/javascript.koa.mdx:18-33) with the import extension fixed, and the verify
// snippet (getting-started-verify/javascript.koa.mdx:13-15) pasted verbatim where "Add your routes, etc." sits.
// The guide creates no `router`, so this is what a user who follows only the guide ends up with.
// Import this first!
import "./instrument.mjs";

// Now import other modules
import Koa from "koa";
import * as Sentry from "@sentry/node";

const app = new Koa();

Sentry.setupKoaErrorHandler(app);

// Add your routes, etc.
router.get("/debug-sentry", function () {
  throw new Error("My first Sentry error!");
});

app.listen(Number(process.env.APP_PORT), "127.0.0.1", () => console.log(`app listening ${process.env.APP_PORT}`));
