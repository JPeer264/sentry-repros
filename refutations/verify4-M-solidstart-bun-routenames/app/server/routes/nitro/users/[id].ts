import { defineHandler } from 'nitro';

export default defineHandler(event => {
  return { id: event.context.params?.id };
});
