import { Header, ThemeProvider } from '@repo/ui';
import { Navigation } from '../components/Navigation';
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
            <aside className="app-sidebar">
              <Header />
              <Navigation />
            </aside>
            <main className="app-main">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
