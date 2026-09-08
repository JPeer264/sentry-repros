import { setServerRouteName } from '../../../setServerRouteName';

export function GET(event: { params: Record<string, string> }) {
  setServerRouteName('GET', '/api/users/:id');
  return new Response(JSON.stringify({ id: event.params?.id }), {
    headers: { 'content-type': 'application/json' },
  });
}
