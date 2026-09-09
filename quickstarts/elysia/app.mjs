// Started with `node --import ./instrument.mjs app.mjs`; the app half of index.mdx:105-127.
import * as Sentry from "@sentry/elysia";
import { Elysia } from "elysia";
import { node } from "@elysiajs/node";
import { registerRoutes } from "./routes.ts";

const app = registerRoutes(Sentry.withElysia(new Elysia({ adapter: node() }))
  .get("/", () => "Hello World"))
  .listen({ port: Number(process.env.APP_PORT), hostname: "127.0.0.1" }, () => console.log(`app listening ${process.env.APP_PORT}`));
