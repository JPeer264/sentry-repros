import "./instrument.ts";

(globalThis as unknown as { __WIRING?: string }).__WIRING = process.env.WIRING ?? "baseline";

const server = (await import("./app/_fresh/server.js")).default;

const port = Number(process.env.PORT);
Bun.serve({ port, fetch: (req: Request) => server.fetch(req) });
console.log("fresh-on-bun listening on", port, "wiring", process.env.WIRING);
