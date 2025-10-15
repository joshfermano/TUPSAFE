'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
import { MockDatabase } from '../data';
const MockDataContext = createContext(undefined);
/**
 * MockDataProvider
 * Provides access to mock database throughout the application
 */
export function MockDataProvider({ children }) {
    const value = {
        mockDb: MockDatabase,
    };
    return (_jsx(MockDataContext.Provider, { value: value, children: children }));
}
/**
 * Hook to access mock database
 */
export function useMockData() {
    const context = useContext(MockDataContext);
    if (context === undefined) {
        throw new Error('useMockData must be used within a MockDataProvider');
    }
    return context;
}
