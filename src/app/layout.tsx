import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { I18nProvider } from '@/providers/I18nProvider';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#178279' },
    { media: '(prefers-color-scheme: dark)', color: '#091a24' },
  ],
};

export const metadata: Metadata = {
  title: { default: 'DB Digital Agency', template: '%s | DB Digital Agency' },
  description: 'Administration portal for DB Digital Agency',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'DB Digital Agency Admin',
    description: 'Administration portal for DB Digital Agency',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`}>
        <QueryProvider>
          <ThemeProvider>
            <I18nProvider>
              <AuthProvider>
                {children}
                <Toaster richColors position="top-center" />
              </AuthProvider>
            </I18nProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
