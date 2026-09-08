import type { ReactNode } from 'react';
import { Outlet, createRootRoute, HeadContent, Scripts } from '@tanstack/react-router';

export const Route = createRootRoute({
  head: () => ({ meta: [{ charSet: 'utf-8' }, { title: 'probe' }] }),
  component: () => (
    <html>
      <head><HeadContent /></head>
      <body><Outlet /><Scripts /></body>
    </html>
  ),
});
