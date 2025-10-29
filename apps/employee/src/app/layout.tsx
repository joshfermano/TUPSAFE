import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeWrapper, ThemeScript } from '@/components/theme';
import { MockDataProvider } from '@tupsafe/mock-data/providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TUPSAFE - TUP Manila e-PDS and e-SALN Compliance System',
  description:
    'TUPSAFE (Technological University of the Philippines System for Automated Filing and e-Compliance) is a thesis research project providing a secure web-based platform for TUP Manila faculty, staff, and administrators to submit and manage Personal Data Sheets (e-PDS) and Statements of Assets, Liabilities, and Net Worth (e-SALN) in compliance with Civil Service Commission (CSC) standards.',
  applicationName: 'TUPSAFE',
  keywords: [
    'TUPSAFE',
    'TUP Manila',
    'Technological University of the Philippines',
    'e-PDS',
    'e-SALN',
    'Personal Data Sheet',
    'Statement of Assets Liabilities and Net Worth',
    'CSC compliance',
    'Civil Service Commission',
    'thesis project',
    'academic research',
    'university compliance system',
    'faculty portal',
    'staff management',
    'government employee forms',
    'digital compliance',
  ],
  authors: [{ name: 'TUP Manila Research Team' }],
  openGraph: {
    title: 'TUPSAFE - TUP Manila e-PDS and e-SALN Compliance System',
    description:
      'Thesis research project: Secure digital platform for TUP Manila employees to submit and manage e-PDS and e-SALN forms in compliance with CSC standards.',
    type: 'website',
    locale: 'en_PH',
    siteName: 'TUPSAFE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TUPSAFE - TUP Manila e-PDS and e-SALN Compliance System',
    description:
      'Secure digital compliance system for TUP Manila faculty, staff, and administrators.',
  },
  robots: {
    index: false,
    follow: false,
  },
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
        <MockDataProvider>
          <ThemeWrapper>
            {children}
          </ThemeWrapper>
        </MockDataProvider>
      </body>
    </html>
  );
}
