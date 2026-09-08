import { Elysia } from "elysia";

export function addRoutes(app: any, Sentry: any) {
  return app
    .get("/users/:id", ({ params }: any) => ({ id: params.id }))
    .get("/boom", () => { throw new Error("v4-boom"); })
    .get("/sentinel", () => { Sentry.captureMessage("sentinel"); return "ok"; });
}
export { Elysia };
