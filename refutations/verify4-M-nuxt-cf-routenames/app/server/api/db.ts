export default defineEventHandler(event => {
  return { ok: true, route: 'db', matchedRoute: (event.context as any).matchedRoute ?? null, path: event.path };
});
