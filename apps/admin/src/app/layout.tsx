import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { RealAuthProvider } from '@/context/RealAuthContext';
import { MockDataProvider } from '@tupsafe/mock-data/providers';
import { QueryProvider, ToastProvider, RealtimeProvider } from '@/providers';
import { ThemeProvider, ThemeScript } from '@/context/ThemeContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TUPSAFE Admin Portal',
  description: 'Administrative portal for TUPSAFE e-PDS and e-SALN system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <RealAuthProvider>
            <QueryProvider>
              <RealtimeProvider>
                <MockDataProvider>
                  {children}
                  <ToastProvider />
                </MockDataProvider>
              </RealtimeProvider>
            </QueryProvider>
          </RealAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
