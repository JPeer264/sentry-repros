import { c as createServerRpc } from "./createServerRpc-CkyzfB7Q.js";
import { d5 as createServerFn } from "../server.js";
import "node:async_hooks";
import "node:stream";
import "node:stream/web";
import "util";
import "crypto";
import "async_hooks";
import "stream";
const throwServerError_createServerFn_handler = createServerRpc({
  id: "41399900a9fa876e415539e79e0239344988f6b8a15be321b96c32b46279e8df",
  name: "throwServerError",
  filename: "src/routes/index.tsx"
}, (opts) => throwServerError.__executeServer(opts));
const throwServerError = createServerFn().handler(throwServerError_createServerFn_handler, async () => {
  throw new Error("Sentry Server Function Test Error");
});
export {
  throwServerError_createServerFn_handler
};
