import { createFileRoute } from '@tanstack/react-router';
import { createMiddleware, createServerFn } from '@tanstack/react-start';

const logMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  console.log('logMiddleware executed');
  return next();
});

const getGreeting = createServerFn()
  .middleware([logMiddleware])
  .handler(async () => 'Hello from the server function');

export const Route = createFileRoute('/')({
  loader: () => getGreeting(),
  component: Home,
});

function Home() {
  return <p>{Route.useLoaderData()}</p>;
}
