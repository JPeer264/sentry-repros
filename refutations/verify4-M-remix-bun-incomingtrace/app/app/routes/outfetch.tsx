import { json } from '@remix-run/node';
import * as Sentry from '@sentry/remix';

export async function loader() {
  const res = await fetch(`${process.env.RECORDER_URL}/rec`);
  return json({ ok: res.ok });
}
export default function O() { return <div>outfetch</div>; }
