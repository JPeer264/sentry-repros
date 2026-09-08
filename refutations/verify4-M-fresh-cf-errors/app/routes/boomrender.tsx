import { define } from "../utils.ts";

export default define.page(function BoomRender(props) {
  const n = new URL(props.url).searchParams.get("n") ?? "0";
  throw new Error(`fresh-cf-render-error-${n}`);
});
