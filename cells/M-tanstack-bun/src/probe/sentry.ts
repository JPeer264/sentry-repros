/* eslint-disable @typescript-eslint/no-explicit-any */
// Sentry is reached through globalThis instead of a package import so that no
// `@sentry/*` specifier enters the rollup graph. Importing the package directly
// anywhere in the server module graph makes `vite build` fail in the nitro
// environment with `Cannot read properties of null (reading 'getVariableForExportName')`.
const S: any = (globalThis as any).__PROBE_SENTRY__ ?? {};

export const wrapFetchWithSentry: (entry: any) => any = S.wrapFetchWithSentry ?? ((entry: any) => entry);
export const sentryGlobalRequestMiddleware: any = S.sentryGlobalRequestMiddleware ?? { options: {} };
export const sentryGlobalFunctionMiddleware: any = S.sentryGlobalFunctionMiddleware ?? { options: {} };

export const setTag = (key: string, value: unknown): void => S.setTag?.(key, value);
export const captureException = (e: unknown): string | undefined => S.captureException?.(e);
export const captureMessage = (m: string): string | undefined => S.captureMessage?.(m);
export const logger: any = S.logger ?? { info: () => undefined };
export const getClient = (): unknown => S.getClient?.();
