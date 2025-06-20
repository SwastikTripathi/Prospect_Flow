
'use client';

import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { UserSettings } from '@/lib/types';

interface UserSettingsContextType {
  userSettings: UserSettings | null;
  setUserSettings: (settings: UserSettings | null) => void;
  isLoadingSettings: boolean;
  setIsLoadingSettings: (loading: boolean) => void;
  hasFetchedSettingsOnce: boolean;
  setHasFetchedSettingsOnce: (fetched: boolean) => void;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export const UserSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true); // True initially until first fetch attempt
  const [hasFetchedSettingsOnce, setHasFetchedSettingsOnce] = useState(false);


  return (
    <UserSettingsContext.Provider value={{
      userSettings,
      setUserSettings,
      isLoadingSettings,
      setIsLoadingSettings,
      hasFetchedSettingsOnce,
      setHasFetchedSettingsOnce
    }}>
      {children}
    </UserSettingsContext.Provider>
  );
};

export const useUserSettings = (): UserSettingsContextType => {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
};
