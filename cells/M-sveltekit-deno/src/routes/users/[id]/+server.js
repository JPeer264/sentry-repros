export function GET({ params }) { return new Response(`user ${params.id}`); }
