import { define } from "../utils.ts";

export default define.page(function ThrowPage() {
  throw new Error("fresh-render-boom");
});
