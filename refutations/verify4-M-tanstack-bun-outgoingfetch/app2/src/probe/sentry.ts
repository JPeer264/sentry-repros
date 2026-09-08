// Re-export the SDK off globalThis so no `@sentry/*` specifier enters the nitro rollup graph.
// Needed because any static import of `@sentry/tanstackstart-react` in the server module graph
// makes `vite build` fail with "Cannot read properties of null (reading 'getVariableForExportName')".
const S = (globalThis as any).__PROBE_SENTRY__;

export const wrapFetchWithSentry = (...args: any[]) => S.wrapFetchWithSentry(...args);
export const sentryGlobalRequestMiddleware = S?.sentryGlobalRequestMiddleware;
export const sentryGlobalFunctionMiddleware = S?.sentryGlobalFunctionMiddleware;
export const captureMessage = (...args: any[]) => S.captureMessage(...args);
export const captureException = (...args: any[]) => S.captureException(...args);
export const flush = (...args: any[]) => S.flush(...args);
export const getClient = () => S?.getClient?.();
