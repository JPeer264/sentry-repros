import { define } from "../../../utils.ts";

export const handler = define.handlers({
  GET(ctx) {
    return Response.json({ id: ctx.params.id });
  },
});
