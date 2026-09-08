export async function GET() {
  await new Promise(r => setTimeout(r, 5));
  throw new Error('probe-api-route-error-async');
}
