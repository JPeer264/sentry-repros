// Resource route: the server-side sentinel. drive.mjs requests it last and polls the sink for the message and
// the span, so everything the server sent before them is known to have arrived.
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import * as Sentry from "@sentry/remix";

export function loader({ request }: LoaderFunctionArgs) {
  const name = new URL(request.url).searchParams.get("name") ?? "sentinel-server";
  Sentry.captureMessage(name);
  Sentry.startSpan({ name: `${name}-span`, op: "test" }, () => {});
  const client = Sentry.getClient();
  const sdk = client?.getSdkMetadata()?.sdk;
  return json({
    name,
    sdk: sdk ? { name: sdk.name, version: sdk.version, packages: sdk.packages } : null,
    integrations: (client?.getOptions().integrations ?? []).map((i) => i.name),
    node: process.version,
  });
}
