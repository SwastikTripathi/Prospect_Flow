
'use client';

import { useContext } from 'react';
import { OnboardingTutorialContext } from '@/contexts/OnboardingTutorialContext'; // Ensure this path is correct

// Custom hook to consume the OnboardingTutorialContext
export const useOnboardingTutorial = () => {
  const context = useContext(OnboardingTutorialContext);
  if (context === undefined) {
    throw new Error('useOnboardingTutorial must be used within an OnboardingTutorialProvider');
  }
  return context;
};
