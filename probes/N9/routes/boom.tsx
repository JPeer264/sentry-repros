import { define } from "../utils.ts";

export const handler = define.handlers({
  GET(_ctx) {
    throw new Error("fresh route boom");
  },
});
