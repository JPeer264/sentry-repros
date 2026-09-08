import { sentryGlobalRequestMiddleware, sentryGlobalFunctionMiddleware } from './probe/sentry';
import { createStart } from '@tanstack/react-start';

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [sentryGlobalRequestMiddleware],
    functionMiddleware: [sentryGlobalFunctionMiddleware],
  };
});
