import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { I18nProvider } from '@/providers/I18nProvider';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-poppins', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'MPE Admin', template: '%s | MPE Admin' },
  description: 'Administration for MPE Web app',
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
