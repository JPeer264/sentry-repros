/**
 * Paths of files from the `mysql` package present in the CommonJS require cache. Bundled modules never
 * appear there, so an empty list means the bundle owns `mysql` and the require cache cannot see it.
 */
export function mysqlModulesInRequireCache(): string[] {
  try {
    const req: any = typeof require !== 'undefined' ? require : (globalThis as any).require;
    const cache = req?.cache;
    if (!cache) return [];
    return Object.keys(cache).filter(k => k.includes('/node_modules/mysql/'));
  } catch {
    return [];
  }
}
