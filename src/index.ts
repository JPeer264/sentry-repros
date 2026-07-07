import diagnostics_channel from "node:diagnostics_channel";

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const ch = diagnostics_channel.tracingChannel("orchestrion:pg:query");

    if (!ch.hasSubscribers) {
      ch.start.subscribe((message: unknown) => {
        console.log("message", message);
      });
    }

    if (url.pathname === "/ok") {
      const context = {
        arguments: [{ sql: "SELECT * FROM users WHERE id = $1", values: [1] }],
      };

      ch.traceSync(() => ({ rows: [{ id: 1, name: "Ada" }] }), context);

      return Response.json({ path: "/ok" });
    }

    if (url.pathname === "/error") {
      const context = {
        arguments: [
          { sql: "SELECT * FROM users WHERE id = $1", values: [1] },
          (_err: unknown, _res: unknown) => {},
        ],
      };

      ch.traceSync(() => ({ rows: [{ id: 1, name: "Ada" }] }), context);

      return Response.json({ path: "/error" });
    }

    return Response.json({ paths: ["/ok", "/error"] });
  },
};
