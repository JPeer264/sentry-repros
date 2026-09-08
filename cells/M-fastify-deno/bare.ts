import Fastify from "fastify";

const app = Fastify();
app.get("/users/:id", (req) => ({ id: (req.params as { id: string }).id }));

const port = Number(Deno.env.get("APP_PORT") || 53370);
await app.listen({ port, host: "127.0.0.1" });
console.log(`READY http://127.0.0.1:${port}`);
