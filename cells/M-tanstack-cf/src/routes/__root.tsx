import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';

export const Route = createRootRoute({
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { title: 'M-tanstack-cf' }],
  }),
  shellComponent: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
