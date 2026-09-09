// repro-only: an HTTPError with a 4xx status, which the guide says is skipped (index.mdx:273,291)
import { defineHandler, HTTPError } from "nitro/h3";

export default defineHandler(() => {
  throw new HTTPError({ status: 404, message: "custom 404" });
});
