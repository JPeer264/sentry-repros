import * as Sentry from '@sentry/react-router';

export function loader() {
  const span = Sentry.getActiveSpan();
  const trace = span ? Sentry.spanToJSON(Sentry.getRootSpan(span)).trace_id : 'none';
  Sentry.logger.info(`rr-deno log from loader trace=${trace}`, { where: 'loader' });
  return { logged: true, trace };
}

export default function Logs({ loaderData }: { loaderData: unknown }) {
  return <pre>{JSON.stringify(loaderData)}</pre>;
}
