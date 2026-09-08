import { Elysia } from "elysia";

const app = new Elysia()
  .get("/", () => "hello")
  .get("/users/:id", ({ params }) => ({ id: params.id }));

Deno.serve({ port: 41338, hostname: "127.0.0.1" }, app.fetch);
