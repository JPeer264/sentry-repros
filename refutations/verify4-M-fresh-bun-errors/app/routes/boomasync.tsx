import { define } from "../utils.ts";

export const handler = define.handlers({
  async GET() {
    await new Promise((r) => setTimeout(r, 5));
    throw new Error("fresh-bun-route-boom-async");
  },
});
