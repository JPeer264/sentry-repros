import { define } from "../../utils.ts";

const sinkPort = Deno.env.get("SINK_PORT") ?? "41317";

export const handler = define.handlers({
  async GET() {
    const res = await fetch(`http://127.0.0.1:${sinkPort}/__rec?from=fresh`);
    return Response.json({ downstream: res.status });
  },
});
