export async function GET() {
  await new Promise(r => setTimeout(r, 10));
  throw new Error('solidstart-deno route error async');
}
