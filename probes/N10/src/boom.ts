export function deepBoom(marker: string): never {
  throw new Error(`nested boom ${marker}`);
}
