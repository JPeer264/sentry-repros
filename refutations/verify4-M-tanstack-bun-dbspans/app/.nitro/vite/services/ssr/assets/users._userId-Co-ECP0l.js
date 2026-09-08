import { cR as jsxRuntimeExports } from "../server.js";
import { a as Route } from "./router-CkZFiwOD.js";
import "node:async_hooks";
import "node:stream";
import "node:stream/web";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "node:diagnostics_channel";
import "node:events";
import "node:net";
import "diagnostics_channel";
import "events";
import "net";
import "tls";
import "url";
import "buffer";
import "timers";
import "fs";
import "node:util";
import "node:string_decoder";
import "./middleware-DPvMzr-A.js";
function UserPage() {
  const {
    userId
  } = Route.useParams();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { id: "user-id", children: [
    "User: ",
    userId
  ] }) });
}
export {
  UserPage as component
};
