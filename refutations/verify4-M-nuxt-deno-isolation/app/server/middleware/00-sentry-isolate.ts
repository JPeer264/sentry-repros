// Attempted workaround for the inherited-scope leak on Deno: clearing the isolation scope at the
// start of every request. `Scope.clear()` does not exist on develop (10.67.0 / v11), so this is a
// no-op. Re-enabling the call makes every route return 500 with
// "TypeError: getIsolationScope$1(...).clear is not a function".
export default defineEventHandler(() => {});
