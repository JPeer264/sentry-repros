import "./instrument.ts";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import * as Sentry from "@sentry/nestjs";
import { AppModule } from "./app.module.ts";

const PORT = Number(Deno.env.get("APP_PORT"));

const app = await NestFactory.create(AppModule);
await app.listen(PORT);
console.log("LISTENING", PORT);

Deno.addSignalListener("SIGTERM", async () => {
  await Sentry.flush(2000);
  Deno.exit(0);
});
