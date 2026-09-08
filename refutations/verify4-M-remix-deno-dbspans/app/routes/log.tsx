import * as Sentry from '@sentry/remix';
export async function loader() {
  Sentry.logger.info('probe-log-from-loader', { where: 'remix-deno' });
  return { ok: true };
}
export default function Log() {
  return <div>log</div>;
}
