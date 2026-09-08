import * as Sentry from '@sentry/react-router';

export async function loader() {
  Sentry.captureMessage('sentinel');
  await Sentry.flush(2000);
  return { sentinel: true };
}

export default function Sentinel({ loaderData }: { loaderData: unknown }) {
  return <pre>{JSON.stringify(loaderData)}</pre>;
}
