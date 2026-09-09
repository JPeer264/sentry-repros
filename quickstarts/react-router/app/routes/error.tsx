// manual-setup.mdx:554-563 verbatim (the "Issues" verify snippet).
import type { Route } from "./+types/example-page";

export async function loader() {
  throw new Error("My first Sentry error!");
}

export default function ExamplePage() {
  return <div>Loading this page will throw an error</div>;
}
