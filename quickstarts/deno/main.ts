import "@sentry/deno/import";
import "./init.ts";
import { handler } from "./routes.ts";
import { APP_PORT } from "./config.ts";

Deno.serve({ port: APP_PORT, hostname: "127.0.0.1" }, handler);
