import { Application, Router } from "@oak/oak";

const PORT = Number(process.env.APP_PORT);
const router = new Router();
router.get("/users/:id", ctx => { ctx.response.body = { id: ctx.params.id }; });
const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

const MOUNT = process.env.MOUNT || "serve";
if (MOUNT === "listen") {
  console.log("listening via app.listen");
  await app.listen({ port: PORT, hostname: "127.0.0.1" });
} else {
  Bun.serve({ port: PORT, hostname: "127.0.0.1", fetch: (req: Request) => app.fetch(req) });
  console.log(`bun.serve ready on ${PORT}`);
}
