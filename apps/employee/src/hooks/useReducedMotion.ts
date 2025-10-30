'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user prefers reduced motion
 * Returns true if the user has enabled "prefers-reduced-motion" in their system settings
 *
 * @returns {boolean} Whether reduced motion is preferred
 *
 * @example
 * ```tsx
 * const reducedMotion = useReducedMotion();
 *
 * return (
 *   <motion.div
 *     animate={reducedMotion ? {} : { scale: 1.1 }}
 *   >
 *     Content
 *   </motion.div>
 * );
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Create media query to detect prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Create listener for changes to the media query
    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Add event listener (supports both modern and legacy browsers)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(listener);
    }

    // Cleanup listener on unmount
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', listener);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(listener);
      }
    };
  }, []);

  return prefersReducedMotion;
}
