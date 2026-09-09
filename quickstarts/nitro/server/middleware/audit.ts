// repro-only: one named middleware so middleware spans are visible
import { defineHandler, setResponseHeader } from "nitro/h3";

export default defineHandler((event) => {
  setResponseHeader(event, "x-audit", "1");
});
