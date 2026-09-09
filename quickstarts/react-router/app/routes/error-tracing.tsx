// manual-setup.mdx:584-603 verbatim (the "Tracing" verify snippet).
import * as Sentry from "@sentry/react-router";
import type { Route } from "./+types/example-page";

export async function loader() {
  return Sentry.startSpan(
    {
      op: "test",
      name: "My First Test Transaction",
    },
    () => {
      throw new Error("My first Sentry error!");
    }
  );
}

export default function ExamplePage() {
  return <div>Loading this page will throw an error</div>;
}
