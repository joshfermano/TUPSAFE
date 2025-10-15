/**
 * LocalStorage utility for persisting mock data
 * Simulates backend database persistence during development
 */
const STORAGE_PREFIX = 'smartgov_mock_';
export const storage = {
    /**
     * Get item from localStorage
     */
    get: (key) => {
        if (typeof window === 'undefined')
            return null;
        try {
            const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
            return item ? JSON.parse(item) : null;
        }
        catch (error) {
            console.error(`Error reading from localStorage: ${key}`, error);
            return null;
        }
    },
    /**
     * Set item in localStorage
     */
    set: (key, value) => {
        if (typeof window === 'undefined')
            return;
        try {
            localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
        }
        catch (error) {
            console.error(`Error writing to localStorage: ${key}`, error);
        }
    },
    /**
     * Remove item from localStorage
     */
    remove: (key) => {
        if (typeof window === 'undefined')
            return;
        try {
            localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
        }
        catch (error) {
            console.error(`Error removing from localStorage: ${key}`, error);
        }
    },
    /**
     * Clear all SmartGov mock data from localStorage
     */
    clear: () => {
        if (typeof window === 'undefined')
            return;
        try {
            Object.keys(localStorage)
                .filter((key) => key.startsWith(STORAGE_PREFIX))
                .forEach((key) => localStorage.removeItem(key));
        }
        catch (error) {
            console.error('Error clearing localStorage', error);
        }
    },
    /**
     * Get all keys with the SmartGov prefix
     */
    keys: () => {
        if (typeof window === 'undefined')
            return [];
        return Object.keys(localStorage)
            .filter((key) => key.startsWith(STORAGE_PREFIX))
            .map((key) => key.replace(STORAGE_PREFIX, ''));
    },
};
