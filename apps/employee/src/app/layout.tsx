import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeWrapper, ThemeScript } from '@/components/theme';
import { AuthProvider } from '@smartgov/auth';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title:
    'SmartGov - Streamlined e-PDS and e-SALN Compliance System for Philippine Government',
  description:
    'SmartGov is a streamlined e-PDS and e-SALN compliance system for the Philippine government. It is a platform that allows government agencies to manage their PDS and SALN compliance requirements in a centralized and efficient manner.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <ThemeWrapper>
            {children}
          </ThemeWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
