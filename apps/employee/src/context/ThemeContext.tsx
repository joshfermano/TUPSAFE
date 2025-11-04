'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
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

// Optimized theme application with RAF batching to prevent forced reflows
const applyTheme = (
  resolvedTheme: ResolvedTheme,
  disableTransitionOnChange = false
) => {
  // Use requestAnimationFrame to batch all DOM mutations together
  requestAnimationFrame(() => {
    const root = document.documentElement;

    // Add transitioning class to disable transitions during theme change
    if (disableTransitionOnChange) {
      root.classList.add('theme-transitioning');
    }

    // Batch all DOM operations together to minimize reflows
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    root.setAttribute('data-theme', resolvedTheme);
    root.style.colorScheme = resolvedTheme;

    // Remove transitioning class after theme is applied
    // Use RAF again to ensure this happens after paint
    if (disableTransitionOnChange) {
      requestAnimationFrame(() => {
        root.classList.remove('theme-transitioning');
      });
    }
  });
};

// Theme Provider Component - Optimized with memoization
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

    const resolved = resolveTheme(theme, systemTheme);
    applyTheme(resolved, disableTransitionOnChange);
  }, [theme, systemTheme, mounted, disableTransitionOnChange]);

  // Memoize setTheme function to prevent recreation on every render
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      localStorage.setItem(storageKey, newTheme);
    },
    [storageKey]
  );

  // Memoize toggleTheme function to prevent recreation on every render
  const toggleTheme = useCallback(() => {
    const currentResolvedTheme = resolveTheme(theme, systemTheme);
    const newTheme: Theme = currentResolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme, systemTheme, setTheme]);

  // Memoize resolved theme to prevent recalculation on every render
  const resolvedTheme = useMemo(
    () => resolveTheme(theme, systemTheme),
    [theme, systemTheme]
  );

  // Memoize context value to prevent unnecessary re-renders of consumers
  const value: ThemeConfig = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      systemTheme,
    }),
    [theme, resolvedTheme, setTheme, toggleTheme, systemTheme]
  );

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
