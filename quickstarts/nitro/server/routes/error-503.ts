// repro-only: an HTTPError with a 5xx status
import { defineHandler, HTTPError } from "nitro/h3";

export default defineHandler(() => {
  throw new HTTPError({ status: 503, message: "custom 503" });
});
