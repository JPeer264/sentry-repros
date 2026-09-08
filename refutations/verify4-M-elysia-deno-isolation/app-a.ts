import "./instrument-a.ts";
import * as Sentry from "@sentry/elysia";
import { Elysia } from "elysia";
import { addRoutes } from "./routes.ts";

const app = addRoutes(Sentry.withElysia(new Elysia()), Sentry);
Deno.serve({ port: Number(Deno.env.get("PORT")), hostname: "127.0.0.1" }, app.fetch);
