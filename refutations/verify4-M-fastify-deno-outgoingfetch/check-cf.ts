import { fetchIntegration } from "npm:@sentry/cloudflare";
console.log("CF fetchIntegration name:", fetchIntegration().name);
