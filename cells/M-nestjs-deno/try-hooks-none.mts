import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
try {
  const statuses = require("statuses");
  console.log("STATUSES_OK", typeof statuses);
} catch (e) {
  console.log("STATUSES_FAIL", (e as Error).message);
}
