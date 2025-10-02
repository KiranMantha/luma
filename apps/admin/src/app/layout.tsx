import { Header, Link, ThemeProvider } from '@repo/ui';
import '../styles/globals.scss';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ThemeProvider>
          <div className="app-shell">
            <div className="app-header">
              <Header />
            </div>
            <aside className="app-sidebar">
              <nav>
                <ul>
                  <li>
                    <Link href="/">Dashboard</Link>
                  </li>
                  <li>
                    <Link href="/components">Components</Link>
                  </li>
                  <li>
                    <Link href="/Pages">Pages</Link>
                  </li>
                  <li>
                    <Link href="/Templates">Templates</Link>
                  </li>
                </ul>
              </nav>
            </aside>
            <main className="app-main">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
