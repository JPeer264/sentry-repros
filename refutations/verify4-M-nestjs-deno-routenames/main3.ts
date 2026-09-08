import "./instrument3.ts";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app2.module.ts";
NestFactory.create(AppModule)
  .then(app => app.listen(Number(Deno.env.get("APP_PORT"))))
  .then(() => console.log("APP_LISTENING", Deno.env.get("APP_PORT")))
  .catch(e => console.log("BOOT_FAIL", e && (e as Error).stack || e));
