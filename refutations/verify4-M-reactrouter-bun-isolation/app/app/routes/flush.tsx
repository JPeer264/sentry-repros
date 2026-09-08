import * as Sentry from "@sentry/react-router";

export async function loader() {
  Sentry.captureMessage("sentinel");
  await Sentry.flush(4000);
  return { ok: true };
}

export default function Flush() {
  return <p>flushed</p>;
}
