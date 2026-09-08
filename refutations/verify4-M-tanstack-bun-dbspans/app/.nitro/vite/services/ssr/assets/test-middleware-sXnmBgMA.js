import { c as createServerRpc } from "./createServerRpc-CkyzfB7Q.js";
import { d5 as createServerFn } from "../server.js";
import { b as serverFnMiddleware, e as earlyReturnMiddleware, c as errorMiddleware } from "./middleware-DPvMzr-A.js";
import "node:async_hooks";
import "node:stream";
import "node:stream/web";
import "util";
import "crypto";
import "async_hooks";
import "stream";
const serverFnWithMiddleware_createServerFn_handler = createServerRpc({
  id: "42e6d6882d88c00a77d72cf2cca6c8d21f83261791d4de84ca75175410abed98",
  name: "serverFnWithMiddleware",
  filename: "src/routes/test-middleware.tsx"
}, (opts) => serverFnWithMiddleware.__executeServer(opts));
const serverFnWithMiddleware = createServerFn().middleware([serverFnMiddleware]).handler(serverFnWithMiddleware_createServerFn_handler, async () => {
  console.log("Server function with specific middleware executed");
  return {
    message: "Server function middleware test"
  };
});
const serverFnWithoutMiddleware_createServerFn_handler = createServerRpc({
  id: "b4335b6f85930e6253fc1633f58be8021f4702741b923704df0d41b27b8e47f0",
  name: "serverFnWithoutMiddleware",
  filename: "src/routes/test-middleware.tsx"
}, (opts) => serverFnWithoutMiddleware.__executeServer(opts));
const serverFnWithoutMiddleware = createServerFn().handler(serverFnWithoutMiddleware_createServerFn_handler, async () => {
  console.log("Server function without specific middleware executed");
  return {
    message: "Global middleware only test"
  };
});
const serverFnWithEarlyReturnMiddleware_createServerFn_handler = createServerRpc({
  id: "bd7d59e6672841b784c6c5779031ff0df820c5b4449d2e7b50be44077073dbff",
  name: "serverFnWithEarlyReturnMiddleware",
  filename: "src/routes/test-middleware.tsx"
}, (opts) => serverFnWithEarlyReturnMiddleware.__executeServer(opts));
const serverFnWithEarlyReturnMiddleware = createServerFn().middleware([earlyReturnMiddleware]).handler(serverFnWithEarlyReturnMiddleware_createServerFn_handler, async () => {
  console.log("This should not be executed - middleware returned early");
  return {
    message: "This should not be returned"
  };
});
const serverFnWithErrorMiddleware_createServerFn_handler = createServerRpc({
  id: "46fddf8f31564c8ecd6715c4ddac444befaabc2f7a2f953fb0097f0363db8d42",
  name: "serverFnWithErrorMiddleware",
  filename: "src/routes/test-middleware.tsx"
}, (opts) => serverFnWithErrorMiddleware.__executeServer(opts));
const serverFnWithErrorMiddleware = createServerFn().middleware([errorMiddleware]).handler(serverFnWithErrorMiddleware_createServerFn_handler, async () => {
  console.log("This should not be executed - middleware threw error");
  return {
    message: "This should not be returned"
  };
});
export {
  serverFnWithEarlyReturnMiddleware_createServerFn_handler,
  serverFnWithErrorMiddleware_createServerFn_handler,
  serverFnWithMiddleware_createServerFn_handler,
  serverFnWithoutMiddleware_createServerFn_handler
};
