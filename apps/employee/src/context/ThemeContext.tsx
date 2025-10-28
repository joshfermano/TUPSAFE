'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

// Theme types
export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

// Theme configuration interface
export interface ThemeConfig {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  systemTheme: ResolvedTheme;
}

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  storageKey?: string;
}

// Create the theme context
const ThemeContext = createContext<ThemeConfig | undefined>(undefined);

// Storage key constant
const STORAGE_KEY = 'tupsafe-theme';

// Helper function to get system theme
const getSystemTheme = (): ResolvedTheme => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return 'light';
};

// Helper function to resolve theme
const resolveTheme = (
  theme: Theme,
  systemTheme: ResolvedTheme
): ResolvedTheme => {
  return theme === 'system' ? systemTheme : theme;
};

// Helper function to apply theme to DOM
const applyTheme = (
  resolvedTheme: ResolvedTheme,
  disableTransitionOnChange = false
) => {
  const root = document.documentElement;

  // Disable transitions temporarily if specified
  if (disableTransitionOnChange) {
    const css = document.createElement('style');
    css.appendChild(
      document.createTextNode(
        `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`
      )
    );
    document.head.appendChild(css);

    // Force reflow
    (() => window.getComputedStyle(document.body))();

    // Re-enable transitions after a short delay
    setTimeout(() => {
      document.head.removeChild(css);
    }, 1);
  }

  // Apply theme class
  root.classList.remove('light', 'dark');
  root.classList.add(resolvedTheme);

  // Set data attribute for additional styling hooks
  root.setAttribute('data-theme', resolvedTheme);

  // Set color scheme for native elements
  root.style.colorScheme = resolvedTheme;
};

// Theme Provider Component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
  enableSystem = true,
  disableTransitionOnChange = false,
  storageKey = STORAGE_KEY,
}) => {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from storage
  useEffect(() => {
    const storedTheme = localStorage.getItem(storageKey) as Theme | null;
    const initialSystemTheme = getSystemTheme();

    setSystemTheme(initialSystemTheme);

    if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      setThemeState(storedTheme);
    } else {
      setThemeState(defaultTheme);
    }

    setMounted(true);
  }, [defaultTheme, storageKey]);

  // Listen for system theme changes
  useEffect(() => {
    if (!enableSystem) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      setSystemTheme(newSystemTheme);
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [enableSystem]);

  // Apply theme to DOM when theme or systemTheme changes
  useEffect(() => {
    if (!mounted) return;

    const resolvedTheme = resolveTheme(theme, systemTheme);
    applyTheme(resolvedTheme, disableTransitionOnChange);
  }, [theme, systemTheme, mounted, disableTransitionOnChange]);

  // Set theme function
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(storageKey, newTheme);
  };

  // Toggle theme function
  const toggleTheme = () => {
    const currentResolvedTheme = resolveTheme(theme, systemTheme);
    const newTheme: Theme = currentResolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Resolve current theme
  const resolvedTheme = resolveTheme(theme, systemTheme);

  const value: ThemeConfig = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    systemTheme,
  };

  // Always provide context, but with loading state when not mounted
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = (): ThemeConfig => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

// Theme initialization script for preventing flash
export const ThemeScript = () => {
  const script = `
    (function() {
      try {
        const storageKey = '${STORAGE_KEY}';
        const theme = localStorage.getItem(storageKey) || 'system';
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const resolvedTheme = theme === 'system' ? systemTheme : theme;
        
        document.documentElement.classList.add(resolvedTheme);
        document.documentElement.setAttribute('data-theme', resolvedTheme);
        document.documentElement.style.colorScheme = resolvedTheme;
      } catch (e) {
        console.error('Theme initialization error:', e);
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
};

// Export types for external use
export type { ThemeProviderProps };
export { ThemeContext };
