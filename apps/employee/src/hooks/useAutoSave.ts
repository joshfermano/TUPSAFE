/**
 * useAutoSave Hook
 *
 * Production-ready React hook for automatically saving form data with comprehensive features:
 * - Auto-save at configurable intervals (default: 30 seconds)
 * - Debounced saving after user stops typing (default: 2 seconds)
 * - LocalStorage persistence for offline draft recovery
 * - Real-time save status tracking (idle, saving, saved, error)
 * - Manual save trigger capability
 * - Deep equality checking to prevent unnecessary saves
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
  data: T;

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
 * Deep equality comparison for objects
 * Uses JSON serialization for comparison
 *
 * @param obj1 - First object
 * @param obj2 - Second object
 * @returns True if objects are deeply equal
 */
function deepEqual<T>(obj1: T, obj2: T): boolean {
  try {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  } catch {
    // If serialization fails, assume not equal
    return false;
  }
}

/**
 * Safe localStorage wrapper with error handling
 */
const storage = {
  /**
   * Get item from localStorage
   */
  getItem: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('[useAutoSave] Failed to retrieve from localStorage:', error);
      return null;
    }
  },

  /**
   * Set item in localStorage
   */
  setItem: <T>(key: string, value: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
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

  // ============================================================================
  // Core Save Function
  // ============================================================================

  /**
   * Perform the actual save operation
   * Saves to localStorage and optionally calls onSave callback
   */
  const performSave = useCallback(
    async (dataToSave: T): Promise<void> => {
      // Prevent concurrent saves
      if (saveInProgressRef.current) {
        return;
      }

      // Skip if data hasn't changed (deep equality check)
      if (lastSavedDataRef.current && deepEqual(dataToSave, lastSavedDataRef.current)) {
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

          // Show success toast (brief)
          if (showToast) {
            toast.success('Draft Saved', {
              description: 'Your changes have been automatically saved.',
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

          // Show error toast
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

    await performSave(data);
  }, [enabled, data, performSave]);

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

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      performSave(data);
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, enabled, debounceMs, performSave]);

  // ============================================================================
  // Interval Auto-Save Effect
  // ============================================================================

  useEffect(() => {
    if (!enabled) return;

    // Set up interval timer for periodic saves
    intervalTimerRef.current = setInterval(() => {
      performSave(data);
    }, autoSaveIntervalMs);

    // Cleanup
    return () => {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
      }
    };
  }, [data, enabled, autoSaveIntervalMs, performSave]);

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
 * Retrieve saved draft from localStorage
 *
 * @template T - Type of data being retrieved
 * @param key - localStorage key
 * @returns Saved draft data or null if not found
 *
 * @example
 * const savedData = getSavedDraft<PDSFormData>('pds-draft-user-123');
 * if (savedData) form.reset(savedData);
 */
export function getSavedDraft<T>(key: string): T | null {
  return storage.getItem<T>(key);
}

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
