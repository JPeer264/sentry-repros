import * as Sentry from '@sentry/remix';

export async function loader() {
  Sentry.logger.info('probe-log-from-remix-loader', { where: 'loader' });
  return { ok: true };
}
export default function Log() {
  return <div>log</div>;
}
