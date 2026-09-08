import { fetch as uFetch, Request as URequest, Response as UResponse, Headers as UHeaders, FormData as UFormData } from 'undici';
const set = (process.env.UNDICI_GLOBALS || 'fetch').split(',');
if (set.includes('fetch')) globalThis.fetch = uFetch;
if (set.includes('request')) globalThis.Request = URequest;
if (set.includes('response')) globalThis.Response = UResponse;
if (set.includes('headers')) globalThis.Headers = UHeaders;
if (set.includes('formdata')) { globalThis.FormData = UFormData; }
console.log('[probe] undici globals installed:', set.join('+'));
