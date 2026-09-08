export default (event: any) => {
  return { id: event.context?.params?.id, kind: 'nitro-server-route' };
};
