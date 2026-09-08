import { installGlobals } from '@remix-run/node';
installGlobals({ nativeFetch: true });
console.log('[probe] installGlobals(nativeFetch) done, fetch is', globalThis.fetch.name);
