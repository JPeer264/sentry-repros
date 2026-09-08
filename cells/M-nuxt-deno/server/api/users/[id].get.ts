export default defineEventHandler(event => {
  const id = getRouterParam(event, 'id');
  if (id === 'boom') {
    throw new Error('users-route-boom');
  }
  return { id };
});
