import { snapshot } from './scopeid';

export function GET() {
  return new Response(JSON.stringify(snapshot('whoami')), { headers: { 'content-type': 'application/json' } });
}
