'use client';

import React from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { Header } from '@/components/navigation';

interface ThemeWrapperProps {
  children: React.ReactNode;
}

/**
 * ThemeWrapper component that provides theme context to the entire application
 *
 * Features:
 * - Wraps the entire app with ThemeProvider
 * - Configured for SmartGov government system preferences
 * - Enables system theme detection
 * - Uses 'smartgov-theme' localStorage key for persistence
 * - Clean separation of concerns - only handles theming
 */
export const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ children }) => {
  return (
    <ThemeProvider
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange={false}
      storageKey="smartgov-theme">
      <Header />
      {children}
    </ThemeProvider>
  );
};

export default ThemeWrapper;
