import { ReactNode } from 'react';
import { MockDatabase } from '../data';
interface MockDataContextValue {
    mockDb: typeof MockDatabase;
}
export interface MockDataProviderProps {
    children: ReactNode;
}
/**
 * MockDataProvider
 * Provides access to mock database throughout the application
 */
export declare function MockDataProvider({ children }: MockDataProviderProps): import("react/jsx-runtime").JSX.Element;
/**
 * Hook to access mock database
 */
export declare function useMockData(): MockDataContextValue;
export {};
