/**
 * useAutoSave Hook
 *
 * Production-ready React hook for automatically saving form data with comprehensive features:
 * - Auto-save at configurable intervals (default: 30 seconds)
 * - Debounced saving after user stops typing (default: 2 seconds)
 * - LocalStorage persistence for offline draft recovery
 * - Real-time save status tracking (idle, saving, saved, error)
 * - Manual save trigger capability
 * - Fast equality checking (shallow + lazy deep) to prevent unnecessary saves
 * - Lazy data getter support for improved performance with large forms
 * - Reduced toast notifications (only on manual saves or errors)
 * - Error handling with custom error callbacks
 * - Automatic cleanup on unmount
 * - TypeScript generic support for type-safe data handling
 *
 * @module hooks/useAutoSave
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { toast } from 'sonner';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Save status enumeration
 */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Configuration options for useAutoSave hook
 *
 * @template T - Type of data being saved
 */
export interface UseAutoSaveOptions<T> {
  /**
   * Unique key for localStorage storage
   * Recommended format: `${formType}-draft-${userId}`
   *
   * @example "pds-draft-user-123"
   * @example "saln-draft-2024-user-456"
   */
  key: string;

  /**
   * Form data to save
   * Typically obtained from React Hook Form's watch() function
   */
  data?: T;

  /**
   * Alternative to data - a function that returns data when save is triggered
   * More performant for large forms as data isn't evaluated on every render
   */
  getData?: () => T;

  /**
   * Optional async save function for API persistence
   * If provided, will be called in addition to localStorage save
   *
   * @param data - Form data to save
   * @returns Promise that resolves when save is complete
   */
  onSave?: (data: T) => Promise<void>;

  /**
   * Debounce delay in milliseconds
   * Time to wait after last data change before saving
   *
   * @default 2000 (2 seconds)
   */
  debounceMs?: number;

  /**
   * Auto-save interval in milliseconds
   * Maximum time between saves regardless of changes
   *
   * @default 30000 (30 seconds)
   */
  autoSaveIntervalMs?: number;

  /**
   * Enable or disable auto-save functionality
   * Useful for conditionally disabling during submission or when form is locked
   *
   * @default true
   */
  enabled?: boolean;

  /**
   * Custom error handler
   * Called when save operation fails
   *
   * @param error - Error that occurred during save
   */
  onError?: (error: Error) => void;

  /**
   * Success callback
   * Called when save operation succeeds
   *
   * @param data - Data that was successfully saved
   */
  onSuccess?: (data: T) => void;

  /**
   * Show toast notifications for save operations
   *
   * @default true
   */
  showToast?: boolean;
}

/**
 * Return value from useAutoSave hook
 */
export interface UseAutoSaveReturn {
  /**
   * Current save status
   */
  saveStatus: SaveStatus;

  /**
   * Timestamp of last successful save
   * Null if never saved
   */
  lastSaved: Date | null;

  /**
   * Manually trigger a save operation
   * Bypasses debounce and interval timers
   *
   * @returns Promise that resolves when save is complete
   */
  saveNow: () => Promise<void>;

  /**
   * Clear saved draft from localStorage
   * Useful when form is successfully submitted
   */
  clearSaved: () => void;

  /**
   * Check if a saved draft exists
   * Useful for showing "Resume draft" prompts
   */
  hasSavedData: boolean;

  /**
   * Get the last error that occurred
   * Null if no error has occurred
   */
  lastError: Error | null;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Serialize Date objects to ISO strings for localStorage
 * Recursively processes nested objects and arrays
 *
 * @param data - Data to serialize
 * @returns Data with Date objects converted to ISO strings
 */
function serializeDates<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle Date objects
  if (data instanceof Date) {
    return data.toISOString() as T;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => serializeDates(item)) as T;
  }

  // Handle objects
  if (typeof data === 'object') {
    const serialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeDates(value);
    }
    return serialized as T;
  }

  // Primitives pass through
  return data;
}

/**
 * Deserialize ISO strings back to Date objects
 * Recursively processes nested objects and arrays
 * Only converts strings that match ISO date format
 *
 * @param data - Data to deserialize
 * @returns Data with ISO strings converted to Date objects
 */
function deserializeDates<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => deserializeDates(item)) as T;
  }

  // Handle objects
  if (typeof data === 'object') {
    const deserialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      // Check if the value is an ISO date string
      if (typeof value === 'string' && isISODateString(value)) {
        deserialized[key] = new Date(value);
      } else {
        deserialized[key] = deserializeDates(value);
      }
    }
    return deserialized as T;
  }

  // Primitives pass through
  return data;
}

/**
 * Check if a string is an ISO date string
 * Matches formats like: 2024-01-15T00:00:00.000Z or 2024-01-15
 *
 * @param value - String to check
 * @returns True if the string is an ISO date
 */
function isISODateString(value: string): boolean {
  // ISO 8601 date regex pattern
  const isoDatePattern =
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;

  if (!isoDatePattern.test(value)) {
    return false;
  }

  // Validate that it's a valid date
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Fast equality check using object reference and shallow comparison
 * Falls back to JSON only for nested changes
 *
 * @param obj1 - First object
 * @param obj2 - Second object
 * @returns True if objects are equal
 */
function fastEqual<T>(obj1: T, obj2: T): boolean {
  // Same reference - definitely equal
  if (obj1 === obj2) return true;

  // Null checks
  if (!obj1 || !obj2) return false;

  // Not objects - use strict equality
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return obj1 === obj2;
  }

  // For objects, compare keys length first (fast bail-out)
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;

  // Shallow comparison for first-level properties
  for (const key of keys1) {
    const val1 = (obj1 as Record<string, unknown>)[key];
    const val2 = (obj2 as Record<string, unknown>)[key];

    // Same reference for nested objects is good enough for our purposes
    if (val1 !== val2) {
      // Only do deep check if both are objects
      if (typeof val1 === 'object' && typeof val2 === 'object') {
        try {
          if (JSON.stringify(val1) !== JSON.stringify(val2)) return false;
        } catch {
          return false;
        }
      } else {
        return false;
      }
    }
  }

  return true;
}

/**
 * Safe localStorage wrapper with error handling and automatic date serialization
 */
const storage = {
  /**
   * Get item from localStorage with automatic date deserialization
   */
  getItem: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      const parsed = JSON.parse(item);
      // Automatically deserialize dates
      return deserializeDates(parsed) as T;
    } catch (error) {
      console.error('[useAutoSave] Failed to retrieve from localStorage:', error);
      return null;
    }
  },

  /**
   * Set item in localStorage with automatic date serialization
   */
  setItem: <T>(key: string, value: T): boolean => {
    try {
      // Automatically serialize dates before saving
      const serialized = serializeDates(value);
      localStorage.setItem(key, JSON.stringify(serialized));
      return true;
    } catch (error) {
      console.error('[useAutoSave] Failed to save to localStorage:', error);
      return false;
    }
  },

  /**
   * Remove item from localStorage
   */
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('[useAutoSave] Failed to remove from localStorage:', error);
      return false;
    }
  },

  /**
   * Check if item exists in localStorage
   */
  hasItem: (key: string): boolean => {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  },
};

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Auto-save hook for form data persistence
 *
 * @template T - Type of data being saved
 * @param options - Configuration options
 * @returns Auto-save control interface
 *
 * @example Basic usage with React Hook Form
 * const form = useForm<PDSFormData>();
 * const formData = form.watch();
 * const { saveStatus, lastSaved } = useAutoSave({
 *   key: `pds-draft-${userId}`,
 *   data: formData,
 *   enabled: !isSubmitting,
 * });
 *
 * @example Advanced usage with API persistence
 * const { saveStatus, saveNow, clearSaved } = useAutoSave({
 *   key: `saln-draft-${year}-${userId}`,
 *   data: formData,
 *   onSave: async (data) => {
 *     await fetch('/api/saln/draft', {
 *       method: 'POST',
 *       body: JSON.stringify(data),
 *     });
 *   },
 *   onError: (error) => {
 *     console.error('Save failed:', error);
 *     toast.error('Failed to save draft');
 *   },
 * });
 */
export function useAutoSave<T>({
  key,
  data,
  getData,
  onSave,
  debounceMs = 2000,
  autoSaveIntervalMs = 30000,
  enabled = true,
  onError,
  onSuccess,
  showToast = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  // ============================================================================
  // State Management
  // ============================================================================

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [hasSavedData, setHasSavedData] = useState<boolean>(() => storage.hasItem(key));

  // ============================================================================
  // Refs for Timers and Data
  // ============================================================================

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<T | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const saveInProgressRef = useRef<boolean>(false);

  // Use ref to store latest data for interval saves (avoids data in dependencies)
  const latestDataRef = useRef<T | (() => T) | null>(null);

  // Update the latestDataRef when getData or data changes
  useEffect(() => {
    latestDataRef.current = getData || data || null;
  }, [getData, data]);

  // ============================================================================
  // Core Save Function
  // ============================================================================

  /**
   * Perform the actual save operation
   * Saves to localStorage and optionally calls onSave callback
   *
   * @param dataToSave - The data to save
   * @param isManualSave - Whether this is a manual save (shows success toast) vs auto-save
   */
  const performSave = useCallback(
    async (dataToSave: T, isManualSave: boolean = false): Promise<void> => {
      // Prevent concurrent saves
      if (saveInProgressRef.current) {
        return;
      }

      // Skip if data hasn't changed (fast equality check)
      if (lastSavedDataRef.current && fastEqual(dataToSave, lastSavedDataRef.current)) {
        return;
      }

      // Skip if data is empty or null
      if (!dataToSave || (typeof dataToSave === 'object' && Object.keys(dataToSave).length === 0)) {
        return;
      }

      saveInProgressRef.current = true;
      setSaveStatus('saving');
      setLastError(null);

      try {
        // Save to localStorage first (fast, synchronous backup)
        const localStorageSuccess = storage.setItem(key, dataToSave);

        if (!localStorageSuccess) {
          throw new Error('Failed to save to localStorage');
        }

        // Call optional async save callback (e.g., API save)
        if (onSave) {
          await onSave(dataToSave);
        }

        // Update state on success
        if (isMountedRef.current) {
          lastSavedDataRef.current = dataToSave;
          setSaveStatus('saved');
          setLastSaved(new Date());
          setHasSavedData(true);

          // Call success callback
          onSuccess?.(dataToSave);

          // Only show success toast for manual saves to reduce notification noise
          if (showToast && isManualSave) {
            toast.success('Draft Saved', {
              description: 'Your changes have been saved.',
              duration: 2000,
            });
          }

          // Reset to idle after 3 seconds
          setTimeout(() => {
            if (isMountedRef.current) {
              setSaveStatus('idle');
            }
          }, 3000);
        }
      } catch (error) {
        const saveError = error instanceof Error ? error : new Error('Unknown save error');

        if (isMountedRef.current) {
          setSaveStatus('error');
          setLastError(saveError);

          // Call error callback
          onError?.(saveError);

          // Always show error toast (both manual and auto-saves)
          if (showToast) {
            toast.error('Save Failed', {
              description: 'Unable to save your draft. Please try again.',
              duration: 5000,
            });
          }

          // Reset to idle after 5 seconds
          setTimeout(() => {
            if (isMountedRef.current) {
              setSaveStatus('idle');
            }
          }, 5000);
        }
      } finally {
        saveInProgressRef.current = false;
      }
    },
    [key, onSave, onError, onSuccess, showToast]
  );

  // ============================================================================
  // Manual Save Function
  // ============================================================================

  /**
   * Manually trigger a save operation
   * Bypasses all timers and debouncing
   */
  const saveNow = useCallback(async (): Promise<void> => {
    if (!enabled) return;

    // Clear any pending timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Get data from getData callback if provided, otherwise use data prop
    const dataToSave = getData ? getData() : data;
    if (dataToSave) {
      await performSave(dataToSave, true); // true = manual save, show toast
    }
  }, [enabled, data, getData, performSave]);

  // ============================================================================
  // Clear Saved Data Function
  // ============================================================================

  /**
   * Clear saved draft from localStorage
   */
  const clearSaved = useCallback((): void => {
    const success = storage.removeItem(key);
    if (success) {
      setHasSavedData(false);
      lastSavedDataRef.current = null;
      setLastSaved(null);
      setSaveStatus('idle');
      setLastError(null);
    }
  }, [key]);

  // ============================================================================
  // Debounced Auto-Save Effect
  // ============================================================================

  useEffect(() => {
    if (!enabled) return;

    // If using getData callback, we only trigger on completedSteps/currentStep changes
    // not on every form keystroke - the getData will get fresh data when save runs
    const hasDataToSave = getData || data;
    if (!hasDataToSave) return;

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      const dataToSave = getData ? getData() : data;
      if (dataToSave) {
        performSave(dataToSave, false); // false = auto-save, no toast
      }
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
    // Note: When using getData, we don't include 'data' in deps to avoid re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getData ? undefined : data, enabled, debounceMs, performSave, getData]);

  // ============================================================================
  // Interval Auto-Save Effect
  // ============================================================================

  useEffect(() => {
    if (!enabled) return;

    // Set up interval timer for periodic saves using latestDataRef
    // This avoids including 'data' in dependencies which would cause unnecessary re-runs
    intervalTimerRef.current = setInterval(() => {
      const currentData = latestDataRef.current;
      const dataToSave =
        typeof currentData === 'function' ? (currentData as () => T)() : currentData;
      if (dataToSave) {
        performSave(dataToSave, false); // false = auto-save, no toast
      }
    }, autoSaveIntervalMs);

    // Cleanup
    return () => {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
      }
    };
  }, [enabled, autoSaveIntervalMs, performSave]);

  // ============================================================================
  // Mount/Unmount Effect
  // ============================================================================

  useEffect(() => {
    isMountedRef.current = true;

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;

      // Clear all timers
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
      }
    };
  }, []);

  // ============================================================================
  // Return Interface
  // ============================================================================

  return useMemo(
    () => ({
      saveStatus,
      lastSaved,
      saveNow,
      clearSaved,
      hasSavedData,
      lastError,
    }),
    [saveStatus, lastSaved, saveNow, clearSaved, hasSavedData, lastError]
  );
}

// ============================================================================
// Standalone Utility Functions
// ============================================================================

/**
 * Retrieve saved draft from localStorage with automatic date deserialization
 *
 * @template T - Type of data being retrieved
 * @param key - localStorage key
 * @returns Saved draft data or null if not found (with dates automatically converted)
 *
 * @example
 * const savedData = getSavedDraft<PDSFormData>('pds-draft-user-123');
 * if (savedData) form.reset(savedData);
 */
export function getSavedDraft<T>(key: string): T | null {
  return storage.getItem<T>(key);
}

/**
 * Export date serialization utilities for use in other modules
 */
export { serializeDates, deserializeDates, isISODateString };

/**
 * Clear draft from localStorage
 *
 * @param key - localStorage key
 * @returns True if successfully cleared
 *
 * @example
 * const handleSubmit = async (data) => {
 *   await submitForm(data);
 *   clearDraft(`pds-draft-${userId}`);
 * };
 */
export function clearDraft(key: string): boolean {
  return storage.removeItem(key);
}

/**
 * Check if draft exists in localStorage
 *
 * @param key - localStorage key
 * @returns True if draft exists
 *
 * @example
 * if (hasDraft(`pds-draft-${userId}`)) {
 *   // Show "Resume draft?" dialog
 * }
 */
export function hasDraft(key: string): boolean {
  return storage.hasItem(key);
}

/**
 * List all draft keys in localStorage
 * Useful for debugging or cleanup operations
 *
 * @param prefix - Optional prefix to filter keys (e.g., "pds-draft")
 * @returns Array of draft keys
 *
 * @example
 * const allDrafts = listAllDrafts('pds-draft');
 * console.log(`Found ${allDrafts.length} PDS drafts`);
 */
export function listAllDrafts(prefix?: string): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (!prefix || key.startsWith(prefix))) {
        keys.push(key);
      }
    }
    return keys;
  } catch (error) {
    console.error('[useAutoSave] Failed to list drafts:', error);
    return [];
  }
}

/**
 * Get metadata about a saved draft
 *
 * @param key - localStorage key
 * @returns Metadata about the draft or null if not found
 *
 * @example
 * const metadata = getDraftMetadata(`pds-draft-${userId}`);
 * if (metadata) {
 *   console.log(`Draft size: ${metadata.size} bytes`);
 * }
 */
export function getDraftMetadata(key: string): { exists: boolean; size: number } | null {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    return {
      exists: true,
      size: new Blob([item]).size, // Size in bytes
    };
  } catch {
    return null;
  }
}

/**
 * Bulk clear drafts by prefix
 * Useful for cleanup operations
 *
 * @param prefix - Prefix to match (e.g., "pds-draft-user-123")
 * @returns Number of drafts cleared
 *
 * @example
 * const cleared = clearDraftsByPrefix(`pds-draft-${userId}`);
 * toast.success(`Cleared ${cleared} drafts`);
 */
export function clearDraftsByPrefix(prefix: string): number {
  const drafts = listAllDrafts(prefix);
  let cleared = 0;

  for (const key of drafts) {
    if (storage.removeItem(key)) {
      cleared++;
    }
  }

  return cleared;
}

// ============================================================================
// Best Practices & Usage Guidelines
// ============================================================================

/**
 * BEST PRACTICES:
 *
 * 1. **Unique Keys**: Use descriptive, unique keys that include user ID and form type
 *    ✅ Good: "pds-draft-user-123"
 *    ❌ Bad: "draft" (too generic, will cause conflicts)
 *
 * 2. **Enable/Disable**: Disable auto-save during form submission to prevent conflicts
 *    const { saveStatus } = useAutoSave({
 *      key: `pds-draft-${userId}`,
 *      data: formData,
 *      enabled: !isSubmitting, // Disable during submission
 *    });
 *
 * 3. **Clear After Submission**: Always clear drafts after successful form submission
 *    const { clearSaved } = useAutoSave({ ... });
 *
 *    const handleSubmit = async (data) => {
 *      await submitForm(data);
 *      clearSaved(); // Clean up
 *    };
 *
 * 4. **Restore on Mount**: Check for saved drafts on component mount
 *    useEffect(() => {
 *      const draft = getSavedDraft<PDSFormData>(`pds-draft-${userId}`);
 *      if (draft && confirm('Resume previous draft?')) {
 *        form.reset(draft);
 *      }
 *    }, []);
 *
 * 5. **Handle Errors**: Provide custom error handling for production scenarios
 *    useAutoSave({
 *      key: `pds-draft-${userId}`,
 *      data: formData,
 *      onError: (error) => {
 *        logErrorToMonitoring(error);
 *        toast.error('Auto-save failed. Please save manually.');
 *      },
 *    });
 *
 * 6. **Performance**: Use with React Hook Form's watch() for optimal performance
 *    const form = useForm<PDSFormData>();
 *    const formData = form.watch(); // Efficient change tracking
 *
 *    useAutoSave({ key: `pds-draft-${userId}`, data: formData });
 *
 * 7. **Multi-Step Forms**: Use section-specific keys for better organization
 *    useAutoSave({
 *      key: `pds-draft-${userId}-section-${currentSection}`,
 *      data: formData,
 *    });
 */

/**
 * COMMON PITFALLS TO AVOID:
 *
 * ❌ Don't save empty or incomplete data
 *    - The hook automatically filters empty objects, but be mindful of partial data
 *
 * ❌ Don't use the same key for different forms
 *    - Will cause data conflicts and unexpected behavior
 *
 * ❌ Don't forget to disable during submission
 *    - Can cause race conditions between submit and auto-save
 *
 * ❌ Don't ignore localStorage quota limits
 *    - localStorage has ~5-10MB limit; handle QuotaExceededError
 *
 * ❌ Don't save sensitive data without encryption
 *    - localStorage is not secure; consider encrypting sensitive fields
 */
