import * as SD from "@sentry/deno";
import * as SU from "@sentry/server-utils";
console.log("deno.attachHapiErrorHandler:", typeof (SD as any).attachHapiErrorHandler);
console.log("deno.setupHapiErrorHandler:", typeof (SD as any).setupHapiErrorHandler);
console.log("deno.hapiIntegration:", typeof (SD as any).hapiIntegration);
console.log("server-utils.attachHapiErrorHandler:", typeof (SU as any).attachHapiErrorHandler);
