'use client';

import React, { createContext, useContext, useState, type ReactNode, useCallback } from 'react';

interface Counts {
  jobOpenings: number;
  contacts: number;
  companies: number;
}

interface CountsContextType {
  counts: Counts;
  setCounts: React.Dispatch<React.SetStateAction<Counts>>;
  isLoadingCounts: boolean;
  setIsLoadingCounts: React.Dispatch<React.SetStateAction<boolean>>;
  incrementCount: (entity: keyof Counts) => void;
  decrementCount: (entity: keyof Counts) => void;
  setCount: (entity: keyof Counts, value: number) => void;
}

const CountsContext = createContext<CountsContextType | undefined>(undefined);

export const CountsProvider = ({ children }: { children: ReactNode }) => {
  const [counts, setCounts] = useState<Counts>({
    jobOpenings: 0,
    contacts: 0,
    companies: 0,
  });
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);

  const incrementCount = useCallback((entity: keyof Counts) => {
    setCounts(prev => ({ ...prev, [entity]: prev[entity] + 1 }));
  }, []);

  const decrementCount = useCallback((entity: keyof Counts) => {
    setCounts(prev => ({ ...prev, [entity]: Math.max(0, prev[entity] - 1) }));
  }, []);

  const setCount = useCallback((entity: keyof Counts, value: number) => {
    setCounts(prev => ({ ...prev, [entity]: value }));
  }, []);

  return (
    <CountsContext.Provider value={{
        counts,
        setCounts,
        isLoadingCounts,
        setIsLoadingCounts,
        incrementCount,
        decrementCount,
        setCount
    }}>
      {children}
    </CountsContext.Provider>
  );
};

export const useCounts = (): CountsContextType => {
  const context = useContext(CountsContext);
  if (context === undefined) {
    throw new Error('useCounts must be used within a CountsProvider');
  }
  return context;
};
