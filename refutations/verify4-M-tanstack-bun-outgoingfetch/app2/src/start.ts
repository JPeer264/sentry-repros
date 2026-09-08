import { sentryGlobalFunctionMiddleware, sentryGlobalRequestMiddleware } from './probe/sentry';
import { createStart } from '@tanstack/react-start';
import { globalFunctionMiddleware, globalRequestMiddleware } from './middleware';

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [sentryGlobalRequestMiddleware, globalRequestMiddleware],
    functionMiddleware: [sentryGlobalFunctionMiddleware, globalFunctionMiddleware],
  };
});
