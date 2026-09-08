import { installGlobals } from '@remix-run/node';
const native = process.env.NATIVE_FETCH === '1';
installGlobals(native ? { nativeFetch: true } : undefined);
console.log('[probe] installGlobals nativeFetch=%s -> fetch.name=%s Request.name=%s', native, globalThis.fetch?.name, globalThis.Request?.name);
