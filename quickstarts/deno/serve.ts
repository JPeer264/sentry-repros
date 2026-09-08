import "@sentry/deno/import";
import "./init.ts";
import { handler } from "./routes.ts";

export default { fetch: handler };
