// Same as ../app-no-handler.mjs on fastify@4.
import Fastify from "fastify";
import { registerRoutes } from "../routes.mjs";

const app = Fastify();

registerRoutes(app);

app.listen({ port: Number(process.env.APP_PORT), host: "127.0.0.1" }).then(() => console.log(`app listening ${process.env.APP_PORT}`));
