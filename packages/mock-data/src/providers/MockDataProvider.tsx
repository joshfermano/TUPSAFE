'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { MockDatabase } from '../data';

interface MockDataContextValue {
  mockDb: typeof MockDatabase;
}

const MockDataContext = createContext<MockDataContextValue | undefined>(undefined);

export interface MockDataProviderProps {
  children: ReactNode;
}

/**
 * MockDataProvider
 * Provides access to mock database throughout the application
 */
export function MockDataProvider({ children }: MockDataProviderProps) {
  const value: MockDataContextValue = {
    mockDb: MockDatabase,
  };

  return (
    <MockDataContext.Provider value={value}>
      {children}
    </MockDataContext.Provider>
  );
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
