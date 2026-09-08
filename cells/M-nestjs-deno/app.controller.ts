import { Controller, Get, Param, Query } from "@nestjs/common";
import * as Sentry from "@sentry/nestjs";
import mysql from "mysql2/promise";
import { get as httpGet } from "node:http";

const REC = `http://127.0.0.1:${Deno.env.get("REC_PORT") ?? "44823"}`;

let pool: mysql.Pool | undefined;
try {
  pool = mysql.createPool({ host: "127.0.0.1", port: 3307, user: "root", database: "app", connectionLimit: 4 });
} catch (e) {
  console.error("DB_INIT_ERROR", e);
}

@Controller()
export class AppController {
  @Get("users/:id")
  user(@Param("id") id: string) {
    return { id };
  }

  @Get("error")
  error() {
    throw new Error("nest route boom");
  }

  @Get("iso")
  async iso(@Query("tag") tag: string) {
    Sentry.setTag("probe_tag", tag);
    await new Promise(resolve => setTimeout(resolve, 60 + Math.round(Math.random() * 80)));
    const traceId = Sentry.getActiveSpan()
      ? Sentry.spanToJSON(Sentry.getRootSpan(Sentry.getActiveSpan()!)).trace_id
      : null;
    Sentry.captureException(new Error(`iso ${tag}`));
    return { tag, traceId };
  }

  @Get("db")
  async db() {
    const [rows] = await pool!.query("SELECT id, name FROM users");
    return { rows };
  }

  @Get("downstream")
  async downstream() {
    const res = await fetch(`${REC}/recorded-fetch`);
    await new Promise<void>(resolve => {
      httpGet(`${REC}/recorded-nodehttp`, r => {
        r.resume();
        r.on("end", () => resolve());
      });
    });
    return { status: res.status };
  }

  @Get("log")
  log() {
    Sentry.logger.info("hello from nestjs on deno", { route: "/log" });
    return { ok: true };
  }

  @Get("sentinel")
  sentinel() {
    Sentry.captureMessage("sentinel");
    return { ok: true };
  }
}
