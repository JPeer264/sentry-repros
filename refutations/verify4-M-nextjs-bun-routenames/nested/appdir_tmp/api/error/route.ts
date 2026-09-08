export const dynamic = 'force-dynamic';
export async function GET() {
  throw new Error('verify4 route handler boom');
}
