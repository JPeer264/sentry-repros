export const dynamic = 'force-dynamic';

export async function GET() {
  throw new Error('m-nextjs-cf route handler boom');
}
