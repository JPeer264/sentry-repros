export function addRoutes(app: any, Sentry: any) {
  return app
    .get("/users/:id", ({ params }: any) => ({ id: params.id }))
    .get("/boom", () => { throw new Error("elysia-deno-boom"); })
    .get("/tag/:t", async ({ params }: any) => {
      Sentry.setTag("reqtag", params.t);
      await new Promise(r => setTimeout(r, 150));
      Sentry.captureException(new Error(`tagged-${params.t}`));
      return { ok: params.t };
    })
    .get("/sentinel", () => { Sentry.captureMessage("sentinel"); return "ok"; });
}
