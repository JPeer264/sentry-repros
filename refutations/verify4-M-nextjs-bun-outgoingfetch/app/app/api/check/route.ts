import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const headerList = await headers();
  const headerObj: Record<string, string> = {};
  headerList.forEach((value, key) => {
    headerObj[key] = value;
  });
  return NextResponse.json({ headers: headerObj });
}
