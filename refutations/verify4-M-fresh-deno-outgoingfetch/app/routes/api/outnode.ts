import { define } from "../../utils.ts";
import * as http from "node:http";

export const handler = define.handlers({
  GET(_ctx) {
    const rec = new URL(Deno.env.get("REC_URL")!);
    return new Promise<Response>((resolve, reject) => {
      const req = http.request(
        {
          hostname: rec.hostname,
          port: rec.port,
          path: "/__rec?via=nodehttp",
          method: "GET",
        },
        (res) => {
          res.resume();
          res.on("end", () => resolve(new Response(`nodehttp ${res.statusCode}`)));
        },
      );
      req.on("error", reject);
      req.end();
    });
  },
});
