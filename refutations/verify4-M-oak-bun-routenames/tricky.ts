import "./instrument";
import { Application, Router } from "@oak/oak";
const PORT = Number(process.env.APP_PORT);
const api = new Router({ prefix: "/api" });
api.get("/num/:id(\\d+)", ctx => { ctx.response.body = ctx.params.id; });
api.get("/opt/:a?", ctx => { ctx.response.body = String(ctx.params.a); });
api.get("/star/(.*)", ctx => { ctx.response.body = "star"; });
api.get("/plain", ctx => { ctx.response.body = "plain"; });
const app = new Application();
app.use(api.routes());
app.use(api.allowedMethods());
const handler = (req: Request) => app.fetch(req);
const routes: Record<string, typeof handler> = {};
for (const r of api) { console.log("oak route path:", JSON.stringify(r.path), r.methods); routes[r.path] = handler; }
try {
  Bun.serve({ port: PORT, hostname: "127.0.0.1", routes, fetch: handler });
  console.log(`ready ${PORT}`);
} catch (e) { console.log("SERVE FAILED:", (e as Error).message); }
