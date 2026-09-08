export const dynamic = 'force-dynamic';

export async function GET() {
  throw new Error('M-nextjs-bun route handler boom');
}
