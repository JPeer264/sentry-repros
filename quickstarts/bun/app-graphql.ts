import { routes } from "./routes";
import { graphql, buildSchema } from "graphql";

const schema = buildSchema(`type Query { hello: String }`);
const rootValue = { hello: () => "world" };
const port = Number(process.env.APP_PORT);

Bun.serve({
  port,
  hostname: "127.0.0.1",
  routes: {
    ...routes,
    "/graphql": async () => {
      const result = await graphql({ schema, source: "{ hello }", rootValue });
      return Response.json(result);
    },
  },
  fetch: () => new Response("not found\n", { status: 404 }),
});

console.log(`app listening ${port}`);
