const S: any = (globalThis as any).__PROBE_SENTRY__;

export const wrapFetchWithSentry: any = S.wrapFetchWithSentry;
export const sentryGlobalRequestMiddleware: any = S.sentryGlobalRequestMiddleware;
export const sentryGlobalFunctionMiddleware: any = S.sentryGlobalFunctionMiddleware;
export const captureException: any = S.captureException;
export const captureMessage: any = S.captureMessage;
export const flush: any = S.flush;
