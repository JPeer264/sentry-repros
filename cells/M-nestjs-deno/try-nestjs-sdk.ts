import "./instrument.ts";
import * as Sentry from "@sentry/nestjs";

console.log("SDK_OK", !!Sentry.getClient(), Sentry.getClient()?.getOptions().environment);
