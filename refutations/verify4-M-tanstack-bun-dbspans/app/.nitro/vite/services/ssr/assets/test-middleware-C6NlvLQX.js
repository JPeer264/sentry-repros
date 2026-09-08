import { cR as jsxRuntimeExports, d5 as createServerFn } from "../server.js";
import { c as createSsrRpc } from "./createSsrRpc-CbFgjGnT.js";
import { b as serverFnMiddleware, e as earlyReturnMiddleware, c as errorMiddleware } from "./middleware-DPvMzr-A.js";
import "node:async_hooks";
import "node:stream";
import "node:stream/web";
import "util";
import "crypto";
import "async_hooks";
import "stream";
const serverFnWithMiddleware = createServerFn().middleware([serverFnMiddleware]).handler(createSsrRpc("42e6d6882d88c00a77d72cf2cca6c8d21f83261791d4de84ca75175410abed98"));
const serverFnWithoutMiddleware = createServerFn().handler(createSsrRpc("b4335b6f85930e6253fc1633f58be8021f4702741b923704df0d41b27b8e47f0"));
const serverFnWithEarlyReturnMiddleware = createServerFn().middleware([earlyReturnMiddleware]).handler(createSsrRpc("bd7d59e6672841b784c6c5779031ff0df820c5b4449d2e7b50be44077073dbff"));
const serverFnWithErrorMiddleware = createServerFn().middleware([errorMiddleware]).handler(createSsrRpc("46fddf8f31564c8ecd6715c4ddac444befaabc2f7a2f953fb0097f0363db8d42"));
function TestMiddleware() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: "Test Middleware Page" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { id: "server-fn-middleware-btn", type: "button", onClick: async () => {
      await serverFnWithMiddleware();
    }, children: "Call server function with middleware" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { id: "server-fn-global-only-btn", type: "button", onClick: async () => {
      await serverFnWithoutMiddleware();
    }, children: "Call server function (global middleware only)" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { id: "server-fn-early-return-btn", type: "button", onClick: async () => {
      const result = await serverFnWithEarlyReturnMiddleware();
      console.log("Early return result:", result);
    }, children: "Call server function with early return middleware" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { id: "server-fn-error-btn", type: "button", onClick: async () => {
      try {
        await serverFnWithErrorMiddleware();
      } catch (error) {
        console.log("Caught error from middleware:", error);
      }
    }, children: "Call server function with error middleware" })
  ] });
}
export {
  TestMiddleware as component
};
