// oxlint-disable
const S: any = (globalThis as any).__PROBE_SENTRY__;

export const setTag = (...a: any[]) => S.setTag(...a);
export const captureException = (...a: any[]) => S.captureException(...a);
export const captureMessage = (...a: any[]) => S.captureMessage(...a);
export const getTraceData = (...a: any[]) => S.getTraceData(...a);
export const flush = (...a: any[]) => S.flush(...a);
export const wrapFetchWithSentry = (...a: any[]) => S.wrapFetchWithSentry(...a);
export const sentryGlobalRequestMiddleware: any = new Proxy({}, { get: (_t, p) => S.sentryGlobalRequestMiddleware[p] });
export const sentryGlobalFunctionMiddleware: any = new Proxy({}, { get: (_t, p) => S.sentryGlobalFunctionMiddleware[p] });
