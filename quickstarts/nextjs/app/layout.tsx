import Link from "next/link";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav>
          <Link href="/" id="nav-home">home</Link>{" "}
          <Link href="/users/42" id="nav-user">user 42</Link>{" "}
          <Link href="/server-throw" id="nav-server-throw">server throw</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
