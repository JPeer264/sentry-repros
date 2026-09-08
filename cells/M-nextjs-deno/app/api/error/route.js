export const dynamic = 'force-dynamic';

export async function GET() {
  throw new Error('boom-route-handler');
}
