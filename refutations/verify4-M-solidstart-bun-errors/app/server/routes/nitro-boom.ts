import { defineHandler } from 'h3';

export default defineHandler(() => {
  throw new Error('probe-nitro-route-error');
});
