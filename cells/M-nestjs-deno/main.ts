import "./instrument.ts";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.ts";

const app = await NestFactory.create(AppModule);
await app.listen(Number(Deno.env.get("APP_PORT") ?? "44821"), "127.0.0.1");
console.log("APP_LISTENING", Deno.env.get("APP_PORT") ?? "44821");
