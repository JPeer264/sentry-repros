import * as Sentry from '@sentry/react-router';
import type { Route } from './+types/iso.$tag';

export async function loader({ params }: Route.LoaderArgs) {
  const tag = params.tag as string;
  Sentry.setTag('iso_tag', tag);
  await new Promise(r => setTimeout(r, 120));
  Sentry.captureException(new Error(`iso-error-${tag}`));
  return { tag };
}

export default function Iso({ loaderData }: Route.ComponentProps) {
  return <pre>{JSON.stringify(loaderData)}</pre>;
}
