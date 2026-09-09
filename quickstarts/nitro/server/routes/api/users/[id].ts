// repro-only: parameterized route for segment naming
import { defineHandler } from "nitro/h3";

export default defineHandler((event) => {
  return { id: event.context.params?.id };
});
