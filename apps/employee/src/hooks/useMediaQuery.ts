/**
 * useMediaQuery Hook
 *
 * SSR-safe hook for responsive breakpoint detection.
 * Provides utilities for detecting screen sizes in Next.js components.
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Generic media query hook
 * Returns true if the media query matches, false otherwise
 *
 * @param query - CSS media query string (e.g., "(min-width: 768px)")
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  // Default to false for SSR
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event handler
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * Hook to detect mobile screens (< 768px)
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Hook to detect tablet screens (768px - 1023px)
 */
export function useIsTablet(): boolean {
  const isMinTablet = useMediaQuery('(min-width: 768px)');
  const isMaxTablet = useMediaQuery('(max-width: 1023px)');
  return isMinTablet && isMaxTablet;
}

/**
 * Hook to detect desktop screens (>= 1024px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

/**
 * Hook to detect large desktop screens (>= 1280px)
 */
export function useIsLargeDesktop(): boolean {
  return useMediaQuery('(min-width: 1280px)');
}

/**
 * Hook to detect ultra-wide screens (>= 1536px)
 */
export function useIsUltraWide(): boolean {
  return useMediaQuery('(min-width: 1536px)');
}

/**
 * Breakpoint values for reference
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Hook that returns current breakpoint name
 */
export function useBreakpoint(): 'mobile' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
  const isSm = useMediaQuery('(min-width: 640px)');
  const isMd = useMediaQuery('(min-width: 768px)');
  const isLg = useMediaQuery('(min-width: 1024px)');
  const isXl = useMediaQuery('(min-width: 1280px)');
  const is2xl = useMediaQuery('(min-width: 1536px)');

  if (is2xl) return '2xl';
  if (isXl) return 'xl';
  if (isLg) return 'lg';
  if (isMd) return 'md';
  if (isSm) return 'sm';
  return 'mobile';
}
