import "./instrument.ts";
import server from "./app/_fresh/server.js";

const port = Number(process.env.PORT);
Bun.serve({ port, fetch: (req: Request) => server.fetch(req) });
console.log("fresh-on-bun listening on", port);
