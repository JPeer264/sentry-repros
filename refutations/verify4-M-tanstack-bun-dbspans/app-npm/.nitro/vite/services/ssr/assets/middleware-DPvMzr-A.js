import { d4 as createMiddleware } from "../server.js";
const globalRequestMiddleware = createMiddleware().server(async ({ next }) => {
  console.log("Global request middleware executed");
  return next();
});
const globalFunctionMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  console.log("Global function middleware executed");
  return next();
});
const serverFnMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  console.log("Server function middleware executed");
  return next();
});
const serverRouteRequestMiddleware = createMiddleware().server(async ({ next }) => {
  console.log("Server route request middleware executed");
  return next();
});
const earlyReturnMiddleware = createMiddleware({ type: "function" }).server(async () => {
  console.log("Early return middleware executed - not calling next()");
  return { earlyReturn: true, message: "Middleware returned early without calling next()" };
});
const errorMiddleware = createMiddleware({ type: "function" }).server(async () => {
  console.log("Error middleware executed - throwing error");
  throw new Error("Middleware Error Test");
});
export {
  globalRequestMiddleware as a,
  serverFnMiddleware as b,
  errorMiddleware as c,
  earlyReturnMiddleware as e,
  globalFunctionMiddleware as g,
  serverRouteRequestMiddleware as s
};
