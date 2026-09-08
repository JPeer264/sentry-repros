// features/react-router/v7.mdx:239-255 exactly as printed, only used for a build probe.
// error boundary
import { useRouteError } from "react-router-dom";
import * as Sentry from "@sentry/react";

export function YourCustomRootErrorBoundary() {
  const error = useRouteError() as Error;

  React.useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div>
      <h1>Ouch!</h1>
    </div>
  );
}
