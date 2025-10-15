import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@smartgov/auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SmartGov Admin Portal',
  description: 'Administrative portal for SmartGov e-PDS and e-SALN system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
