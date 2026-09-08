import { fetch as undiciFetch } from 'undici';
globalThis.fetch = undiciFetch;
console.log('[probe] globalThis.fetch replaced with undici fetch');
