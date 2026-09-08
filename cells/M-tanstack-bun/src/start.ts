import { createStart } from '@tanstack/react-start';
import { sentryGlobalFunctionMiddleware, sentryGlobalRequestMiddleware } from './probe/sentry';

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [sentryGlobalRequestMiddleware],
    functionMiddleware: [sentryGlobalFunctionMiddleware],
  };
});
