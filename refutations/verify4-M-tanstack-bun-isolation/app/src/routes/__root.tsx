import type { ReactNode } from 'react';
import { Outlet, createRootRoute, HeadContent, Scripts } from '@tanstack/react-router';

export const Route = createRootRoute({
  head: () => ({ meta: [{ charSet: 'utf-8' }, { title: 'probe' }] }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html>
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}
