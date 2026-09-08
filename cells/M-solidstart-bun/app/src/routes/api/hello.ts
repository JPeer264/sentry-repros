export function GET() {
  return new Response('{"hello":true}', { headers: { 'content-type': 'application/json' } });
}
