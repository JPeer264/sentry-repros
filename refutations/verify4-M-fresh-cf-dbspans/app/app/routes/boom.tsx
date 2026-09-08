import { define } from "../utils.ts";

export const handler = define.handlers({
  GET() {
    throw new Error("fresh-cf-route-error");
  },
});
