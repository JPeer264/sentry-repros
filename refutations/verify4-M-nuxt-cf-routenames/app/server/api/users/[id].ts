export default defineEventHandler(event => {
  return { ok: true, route: 'users', id: getRouterParam(event, 'id'), matchedRoute: (event.context as any).matchedRoute ?? null, path: event.path };
});
