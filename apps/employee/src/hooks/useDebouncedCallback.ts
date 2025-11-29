/**
 * useDebouncedCallback Hook
 *
 * A performance-optimized hook for debouncing callbacks.
 * Useful for form inputs to reduce the frequency of onChange calls.
 *
 * @module hooks/useDebouncedCallback
 */

import { useCallback, useRef, useEffect, useState } from 'react';

/**
 * Creates a debounced version of a callback function.
 *
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default: 150ms)
 * @returns Debounced callback function
 *
 * @example
 * const debouncedOnChange = useDebouncedCallback((value) => {
 *   form.setValue('field', value);
 * }, 150);
 *
 * <input onChange={(e) => debouncedOnChange(e.target.value)} />
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 150
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

/**
 * Creates a debounced value that updates after the specified delay.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 150ms)
 * @returns Debounced value
 *
 * @example
 * const [inputValue, setInputValue] = useState('');
 * const debouncedValue = useDebouncedValue(inputValue, 300);
 *
 * useEffect(() => {
 *   // This only runs after the user stops typing for 300ms
 *   performSearch(debouncedValue);
 * }, [debouncedValue]);
 */
export function useDebouncedValue<T>(value: T, delay: number = 150): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const valueRef = useRef<T>(value);
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      valueRef.current = value;
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

