
'use client';

import React, { createContext, useContext, useRef, type ReactNode, type MutableRefObject } from 'react';

interface UserSessionContextType {
  previousUserIdRef: MutableRefObject<string | undefined | null>;
}

const UserSessionContext = createContext<UserSessionContextType | undefined>(undefined);

export const UserSessionProvider = ({ children }: { children: ReactNode }) => {
  const previousUserIdRef = useRef<string | undefined | null>(undefined); // Initialize as undefined

  return (
    <UserSessionContext.Provider value={{ previousUserIdRef }}>
      {children}
    </UserSessionContext.Provider>
  );
};

export const useUserSession = (): UserSessionContextType => {
  const context = useContext(UserSessionContext);
  if (context === undefined) {
    throw new Error('useUserSession must be used within a UserSessionProvider');
  }
  return context;
};
