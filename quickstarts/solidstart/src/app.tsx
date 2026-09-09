// index.mdx:250-264 verbatim, plus the `root` with a Suspense boundary that the SolidStart 2
// template ships (without it createAsync data has no boundary to suspend on).
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { withSentryRouterRouting } from "@sentry/solidstart/solidrouter";
import { Suspense } from "solid-js";

const SentryRouter = withSentryRouterRouting(Router);

export default function App() {
  return (
    <SentryRouter root={(props) => <Suspense>{props.children}</Suspense>}>
      <FileRoutes />
    </SentryRouter>
  );
}
