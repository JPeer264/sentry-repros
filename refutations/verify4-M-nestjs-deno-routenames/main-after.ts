import "./instrument-after.ts";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.ts";
const env = (k: string) => (globalThis as any).Deno?.env.get(k) ?? process.env[k];
NestFactory.create(AppModule).then(app => app.listen(Number(env("APP_PORT")))).then(() => console.log("APP_LISTENING", env("APP_PORT"))).catch(e => console.log("BOOT_FAIL", e && e.stack || e));
