import "./instrument.ts";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module.ts";

const env = (k: string) => (globalThis as any).Deno?.env.get(k) ?? process.env[k];

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  await app.listen(Number(env("APP_PORT")), "127.0.0.1");
  console.log("APP_LISTENING", env("APP_PORT"));
}
bootstrap().catch(e => { console.log("BOOT_FAIL", e && e.stack || e); });
