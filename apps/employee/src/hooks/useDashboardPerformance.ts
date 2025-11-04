'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useResolvedTheme } from './useOptimizedTheme';

/**
 * Performance monitoring metrics for theme toggling
 */
interface PerformanceMetrics {
  /** Total time taken for theme switch (ms) */
  themeSwitchDuration: number;
  /** Number of component re-renders triggered */
  renderCount: number;
  /** Timestamp of the theme switch */
  timestamp: number;
  /** Theme that was switched to */
  theme: 'light' | 'dark';
}

/**
 * Performance monitoring configuration
 */
interface PerformanceConfig {
  /** Enable console logging of performance metrics */
  enableLogging?: boolean;
  /** Enable render count tracking */
  enableRenderTracking?: boolean;
  /** Log threshold in milliseconds (only log if duration exceeds this) */
  logThreshold?: number;
  /** Callback function for custom metric handling */
  onMetrics?: (metrics: PerformanceMetrics) => void;
}

/**
 * Default configuration for performance monitoring
 */
const DEFAULT_CONFIG: Required<PerformanceConfig> = {
  enableLogging: process.env.NODE_ENV === 'development',
  enableRenderTracking: process.env.NODE_ENV === 'development',
  logThreshold: 50, // Log if theme switch takes more than 50ms
  onMetrics: () => {},
};

/**
 * Performance monitoring hook for dashboard and theme operations
 *
 * This hook tracks theme toggle performance and component re-render counts
 * in development mode. It helps identify performance bottlenecks and verify
 * optimization effectiveness.
 *
 * Features:
 * - Measures theme switch duration
 * - Tracks component re-render counts
 * - Console logging of performance metrics (dev only)
 * - Custom metric callbacks for analytics
 * - Configurable logging thresholds
 *
 * @param config - Performance monitoring configuration
 * @returns Performance metrics and tracking functions
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { renderCount, trackThemeSwitch } = useDashboardPerformance({
 *     enableLogging: true,
 *     logThreshold: 50,
 *   });
 *
 *   return (
 *     <div>
 *       <p>Renders: {renderCount}</p>
 *       <button onClick={trackThemeSwitch}>Toggle Theme</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useDashboardPerformance(config: PerformanceConfig = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const theme = useResolvedTheme();

  // Track render count
  const renderCountRef = useRef(0);
  const previousThemeRef = useRef(theme);
  const themeSwitchStartRef = useRef<number | null>(null);
  const metricsHistoryRef = useRef<PerformanceMetrics[]>([]);

  // Increment render count on every render
  useEffect(() => {
    if (mergedConfig.enableRenderTracking) {
      renderCountRef.current += 1;
    }
  });

  // Track theme switch performance
  useEffect(() => {
    // Detect theme change
    if (previousThemeRef.current !== theme) {
      const switchEndTime = performance.now();

      // If we have a start time, calculate duration
      if (themeSwitchStartRef.current !== null) {
        const duration = switchEndTime - themeSwitchStartRef.current;

        const metrics: PerformanceMetrics = {
          themeSwitchDuration: duration,
          renderCount: renderCountRef.current,
          timestamp: Date.now(),
          theme,
        };

        // Store metrics in history
        metricsHistoryRef.current.push(metrics);

        // Keep only last 10 metrics
        if (metricsHistoryRef.current.length > 10) {
          metricsHistoryRef.current.shift();
        }

        // Log if enabled and exceeds threshold
        if (mergedConfig.enableLogging && duration >= mergedConfig.logThreshold) {
          console.group(
            `%c⚡ Theme Switch Performance`,
            'color: #DC143C; font-weight: bold; font-size: 14px;'
          );
          console.log(`Theme: ${previousThemeRef.current} → ${theme}`);
          console.log(`Duration: ${duration.toFixed(2)}ms`);
          console.log(`Render Count: ${renderCountRef.current}`);
          console.log(
            `Status: ${duration < 50 ? '✅ Excellent' : duration < 100 ? '⚠️ Good' : '❌ Needs Optimization'}`
          );
          console.groupEnd();
        }

        // Call custom metrics handler
        mergedConfig.onMetrics(metrics);

        // Reset start time
        themeSwitchStartRef.current = null;
      }

      previousThemeRef.current = theme;
    }
  }, [theme, mergedConfig]);

  /**
   * Manually track theme switch start
   * Call this before triggering a theme change
   */
  const startThemeSwitch = useCallback(() => {
    themeSwitchStartRef.current = performance.now();
  }, []);

  /**
   * Get average theme switch duration from history
   */
  const getAverageDuration = useCallback((): number => {
    if (metricsHistoryRef.current.length === 0) return 0;

    const total = metricsHistoryRef.current.reduce(
      (sum, m) => sum + m.themeSwitchDuration,
      0
    );
    return total / metricsHistoryRef.current.length;
  }, []);

  /**
   * Get performance summary
   */
  const getPerformanceSummary = useCallback(() => {
    const history = metricsHistoryRef.current;

    if (history.length === 0) {
      return {
        totalSwitches: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        currentRenderCount: renderCountRef.current,
      };
    }

    const durations = history.map((m) => m.themeSwitchDuration);

    return {
      totalSwitches: history.length,
      averageDuration: getAverageDuration(),
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      currentRenderCount: renderCountRef.current,
      recentMetrics: history.slice(-3), // Last 3 theme switches
    };
  }, [getAverageDuration]);

  /**
   * Log performance summary to console
   */
  const logPerformanceSummary = useCallback(() => {
    if (!mergedConfig.enableLogging) return;

    const summary = getPerformanceSummary();

    console.group(
      '%c📊 Dashboard Performance Summary',
      'color: #DC143C; font-weight: bold; font-size: 16px;'
    );
    console.log(`Total Theme Switches: ${summary.totalSwitches}`);
    console.log(`Average Duration: ${summary.averageDuration.toFixed(2)}ms`);
    console.log(`Min Duration: ${summary.minDuration.toFixed(2)}ms`);
    console.log(`Max Duration: ${summary.maxDuration.toFixed(2)}ms`);
    console.log(`Total Renders: ${summary.currentRenderCount}`);

    if (summary.recentMetrics && summary.recentMetrics.length > 0) {
      console.group('Recent Theme Switches');
      summary.recentMetrics.forEach((metric, index) => {
        console.log(
          `${index + 1}. ${metric.theme} - ${metric.themeSwitchDuration.toFixed(2)}ms`
        );
      });
      console.groupEnd();
    }

    console.groupEnd();
  }, [mergedConfig.enableLogging, getPerformanceSummary]);

  /**
   * Reset performance tracking
   */
  const resetTracking = useCallback(() => {
    renderCountRef.current = 0;
    metricsHistoryRef.current = [];
    themeSwitchStartRef.current = null;

    if (mergedConfig.enableLogging) {
      console.log('🔄 Performance tracking reset');
    }
  }, [mergedConfig.enableLogging]);

  return {
    /** Current component render count */
    renderCount: renderCountRef.current,
    /** Start tracking a theme switch */
    startThemeSwitch,
    /** Get average theme switch duration */
    getAverageDuration,
    /** Get full performance summary */
    getPerformanceSummary,
    /** Log performance summary to console */
    logPerformanceSummary,
    /** Reset all performance tracking */
    resetTracking,
    /** History of performance metrics */
    metricsHistory: metricsHistoryRef.current,
  };
}

/**
 * Hook to monitor render performance of a specific component
 *
 * @param componentName - Name of the component to track
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useRenderPerformance('MyComponent');
 *   // Component logic...
 * }
 * ```
 */
export function useRenderPerformance(componentName: string) {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;
    renderCountRef.current += 1;

    if (process.env.NODE_ENV === 'development') {
      // Only log if re-render is suspiciously fast (possible unnecessary re-render)
      if (timeSinceLastRender < 16 && renderCountRef.current > 1) {
        console.warn(
          `⚠️ Fast re-render detected in ${componentName}: ${timeSinceLastRender.toFixed(2)}ms (Render #${renderCountRef.current})`
        );
      }
    }

    lastRenderTimeRef.current = now;
  });

  return {
    renderCount: renderCountRef.current,
  };
}
