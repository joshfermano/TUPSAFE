/**
 * LocalStorage utility for persisting mock data
 * Simulates backend database persistence during development
 */
export declare const storage: {
    /**
     * Get item from localStorage
     */
    get: <T>(key: string) => T | null;
    /**
     * Set item in localStorage
     */
    set: <T>(key: string, value: T) => void;
    /**
     * Remove item from localStorage
     */
    remove: (key: string) => void;
    /**
     * Clear all SmartGov mock data from localStorage
     */
    clear: () => void;
    /**
     * Get all keys with the SmartGov prefix
     */
    keys: () => string[];
};
