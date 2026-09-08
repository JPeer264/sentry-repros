import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/users/$id')({
  server: {
    handlers: {
      GET: ({ params }) => {
        if (params.id === 'boom') {
          throw new Error('TanStackCF Route Handler Error');
        }
        return Response.json({ ok: true, id: params.id });
      },
    },
  },
  component: () => <p>user page</p>,
});
