import "./instrument2.ts";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app2.module.ts";

const PORT = Number(Deno.env.get("APP_PORT"));
NestFactory.create(AppModule)
  .then(app => app.listen(PORT))
  .then(() => console.log("APP_LISTENING", PORT))
  .catch(e => console.log("BOOT_FAIL", e && (e as Error).stack || e));
