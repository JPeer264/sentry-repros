// docs/platforms/javascript/guides/nitro/index.mdx:208-214, verbatim
import { defineHandler } from "nitro/h3";

export default defineHandler(() => {
  throw new Error("My first Sentry error!");
});
