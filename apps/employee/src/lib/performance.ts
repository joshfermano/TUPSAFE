/**
 * Performance Monitoring Utilities (Development Only)
 *
 * These utilities help identify performance bottlenecks during development.
 * They are completely disabled in production builds.
 *
 * Usage:
 * - useRenderCount: Track component re-renders
 * - useWhyDidYouUpdate: Identify which props changed
 * - measurePerformance: Measure function execution time
 */

import { useEffect, useRef } from 'react';

/**
 * Hook to count component renders (development only)
 *
 * @param componentName - Name of the component to track
 * @returns Current render count
 *
 * @example
 * ```tsx
 * const SectionI = memo(({ form }: SectionProps) => {
 *   useRenderCount('SectionI');
 *   // ... rest of component
 * });
 * ```
 */
export const useRenderCount = (componentName: string): number => {
  const renderCount = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    renderCount.current += 1;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Render] ${componentName} - Render #${renderCount.current}`);
    }
  });

  return renderCount.current;
};

/**
 * Hook to log which props changed causing re-render (development only)
 *
 * @param name - Component or section name
 * @param props - Props object to monitor
 *
 * @example
 * ```tsx
 * const WorkExperienceItem = memo((props) => {
 *   useWhyDidYouUpdate('WorkExperienceItem', props);
 *   // ... rest of component
 * });
 * ```
 */
export const useWhyDidYouUpdate = (
  name: string,
  props: Record<string, any>
): void => {
  const previousProps = useRef<Record<string, any> | undefined>(undefined);

  useEffect(() => {
    if (previousProps.current && process.env.NODE_ENV === 'development') {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log(`[Why Update] ${name}:`, changedProps);
      }
    }

    previousProps.current = props;
  });
};

/**
 * Measure execution time of a function (development only)
 *
 * @param operationName - Name of the operation being measured
 * @param fn - Function to measure
 * @returns Result of the function
 *
 * @example
 * ```tsx
 * const result = measurePerformance('sortWorkExperiences', () =>
 *   expensiveOperation()
 * );
 * ```
 */
export const measurePerformance = <T,>(
  operationName: string,
  fn: () => T
): T => {
  if (process.env.NODE_ENV !== 'development') {
    return fn();
  }

  const start = performance.now();
  const result = fn();
  const end = performance.now();

  console.log(`[Performance] ${operationName}: ${(end - start).toFixed(2)}ms`);

  return result;
};

/**
 * React Profiler onRender callback helper (development only)
 *
 * @param id - Component/tree identifier
 * @param phase - Mount or update phase
 * @param actualDuration - Time spent rendering
 * @param baseDuration - Estimated time without memoization
 *
 * @example
 * ```tsx
 * <Profiler id="SectionIV" onRender={logProfilerData}>
 *   <SectionIV />
 * </Profiler>
 * ```
 */
export const logProfilerData = (
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number
): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Profiler] ${id} (${phase}):`, {
      actualDuration: `${actualDuration.toFixed(2)}ms`,
      baseDuration: `${baseDuration.toFixed(2)}ms`,
      optimization:
        baseDuration > 0
          ? `${(((baseDuration - actualDuration) / baseDuration) * 100).toFixed(1)}% faster`
          : 'N/A',
    });
  }
};
