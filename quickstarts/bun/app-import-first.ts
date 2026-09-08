import "./instrument";
import { routes } from "./routes";

const port = Number(process.env.APP_PORT);

Bun.serve({
  port,
  hostname: "127.0.0.1",
  routes,
  fetch: () => new Response("not found\n", { status: 404 }),
});

console.log(`app listening ${port}`);
