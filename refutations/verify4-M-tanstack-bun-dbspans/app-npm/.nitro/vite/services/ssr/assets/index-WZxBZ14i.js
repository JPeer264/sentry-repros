import { cR as jsxRuntimeExports, d5 as createServerFn } from "../server.js";
import { c as createSsrRpc } from "./createSsrRpc-CbFgjGnT.js";
import "node:async_hooks";
import "node:stream";
import "node:stream/web";
import "util";
import "crypto";
import "async_hooks";
import "stream";
const throwServerError = createServerFn().handler(createSsrRpc("41399900a9fa876e415539e79e0239344988f6b8a15be321b96c32b46279e8df"));
function Home() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => {
      throw new Error("Sentry Client Test Error");
    }, children: "Break the client" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: async () => {
      await throwServerError();
    }, children: "Break server function" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: async () => {
      await fetch("/api/error");
    }, children: "Break API route" })
  ] });
}
export {
  Home as component
};
