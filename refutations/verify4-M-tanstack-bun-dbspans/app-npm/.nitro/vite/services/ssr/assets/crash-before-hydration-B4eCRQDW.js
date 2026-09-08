import { cR as jsxRuntimeExports } from "../server.js";
import "node:async_hooks";
import "node:stream";
import "node:stream/web";
import "util";
import "crypto";
import "async_hooks";
import "stream";
function CrashPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "This page crashes in client.tsx before hydration" }) });
}
export {
  CrashPage as component
};
