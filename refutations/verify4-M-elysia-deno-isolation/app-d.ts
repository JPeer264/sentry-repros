import "./instrument-a.ts";
import * as Sentry from "@sentry/elysia";
import { Elysia } from "elysia";
import { node } from "@elysiajs/node";
import { addRoutes } from "./routes.ts";

const app = addRoutes(Sentry.withElysia(new Elysia({ adapter: node() })), Sentry);
app.listen(Number(Deno.env.get("PORT")));
