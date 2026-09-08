const S: any = (globalThis as any).__PROBE_SENTRY__ ?? {};
export const wrapFetchWithSentry: any = (e: any) => (S.wrapFetchWithSentry ? S.wrapFetchWithSentry(e) : e);
export const sentryGlobalRequestMiddleware: any = S.sentryGlobalRequestMiddleware;
export const sentryGlobalFunctionMiddleware: any = S.sentryGlobalFunctionMiddleware;
export const captureMessage: any = (...a: any[]) => S.captureMessage?.(...a);
export const captureException: any = (...a: any[]) => S.captureException?.(...a);
export const flush: any = (...a: any[]) => S.flush?.(...a) ?? Promise.resolve(true);
