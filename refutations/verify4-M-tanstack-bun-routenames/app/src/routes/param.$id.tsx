import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/param/$id')({
  component: () => <div>param page</div>,
});
