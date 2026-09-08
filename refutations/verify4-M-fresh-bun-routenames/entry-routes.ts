import "./instrument.ts";
import server from "./app/_fresh/server.js";

const port = Number(process.env.PORT);
// Register Fresh's route patterns on Bun.serve itself, so the Bun.serve
// integration parameterizes the span without any Sentry code in the app.
Bun.serve({
  port,
  routes: {
    "/users/:id": (req: Request) => server.fetch(req),
  },
  fetch: (req: Request) => server.fetch(req),
});
console.log("fresh-on-bun listening on", port);
