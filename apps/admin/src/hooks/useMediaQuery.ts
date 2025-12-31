/**
 * Media Query Hooks
 *
 * React hooks for responsive design using media queries.
 * Provides utilities for detecting mobile, tablet, and desktop screens.
 */

'use client';

import { useEffect, useState } from 'react';

/**
 * Custom hook for media query matching
 *
 * @param query - CSS media query string
 * @returns Whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Create media query list
    const mediaQueryList = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQueryList.matches);

    // Define change handler
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    mediaQueryList.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * Hook to detect mobile screens (< 768px)
 *
 * @returns True if screen is mobile size
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Hook to detect tablet screens (768px - 1023px)
 *
 * @returns True if screen is tablet size
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/**
 * Hook to detect desktop screens (>= 1024px)
 *
 * @returns True if screen is desktop size
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

/**
 * Hook to detect small screens (< 640px)
 *
 * @returns True if screen is small
 */
export function useIsSmall(): boolean {
  return useMediaQuery('(max-width: 639px)');
}

/**
 * Hook to detect large screens (>= 1280px)
 *
 * @returns True if screen is large
 */
export function useIsLarge(): boolean {
  return useMediaQuery('(min-width: 1280px)');
}
