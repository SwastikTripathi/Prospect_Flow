
'use client';

import React, { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname }
from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import type { UserSettings } from '@/lib/types';
import { TUTORIAL_STEPS_CONFIG, type TutorialStep, type TutorialKey } from '@/components/tutorial/tutorial-steps';
import { EVENTS, ACTIONS, STATUS, LIFECYCLE, type CallBackProps, type Step as JoyrideStepUI } from 'react-joyride'; // Correctly import constants as values

interface OnboardingTutorialContextType {
  isTutorialActive: boolean;
  startTutorial: (tutorialKey: TutorialKey, startAtStep?: number) => void;
  stopTutorial: (markComplete?: boolean) => Promise<void>;
  completeStep: (stepIdentifier: string) => void;
  getStepStatus: (stepIdentifier: string) => 'pending' | 'completed';
  runJoyride: boolean;
  joyrideSteps: JoyrideStepUI[];
  handleJoyrideCallback: (data: CallBackProps) => void;
  currentGlobalStepIndex: number;
  activeTutorialSet: TutorialStep[] | null;
  userClickedTutorialTarget: (nextTutorialKey?: TutorialKey, nextStepIndex?: number) => void;
}

const initialContextValue: OnboardingTutorialContextType = {
  isTutorialActive: false,
  startTutorial: () => {},
  stopTutorial: async () => {},
  completeStep: () => {},
  getStepStatus: () => 'pending',
  runJoyride: false,
  joyrideSteps: [],
  handleJoyrideCallback: () => {},
  currentGlobalStepIndex: 0,
  activeTutorialSet: null,
  userClickedTutorialTarget: () => {},
};

export const OnboardingTutorialContext = createContext<OnboardingTutorialContextType>(initialContextValue);

interface OnboardingTutorialProviderProps {
  children: ReactNode;
  currentUser: User | null;
  userSettings: UserSettings | null;
}

export const OnboardingTutorialProvider = ({ children, currentUser, userSettings }: OnboardingTutorialProviderProps) => {
  const [activeTutorialKey, setActiveTutorialKey] = useState<TutorialKey | null>(null);
  const [activeTutorialSet, setActiveTutorialSet] = useState<TutorialStep[] | null>(null);
  const [currentGlobalStepIndex, setCurrentGlobalStepIndex] = useState(0);
  const [runJoyride, setRunJoyride] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const pathname = usePathname();

  const isTutorialActive = !!activeTutorialKey;

  const startTutorial = useCallback((tutorialKey: TutorialKey, startAtStep: number = 0) => {
    console.log(`[TutorialContext] Starting tutorial: ${tutorialKey} at step ${startAtStep}`);
    const stepsForTutorial = TUTORIAL_STEPS_CONFIG[tutorialKey];
    if (stepsForTutorial && stepsForTutorial.length > 0) {
      setActiveTutorialKey(tutorialKey);
      setActiveTutorialSet(stepsForTutorial);
      setCurrentGlobalStepIndex(startAtStep);
      setRunJoyride(true);
      setCompletedSteps({}); // Reset completed steps for new tutorial
    } else {
      console.warn(`[TutorialContext] No steps found for tutorial key: ${tutorialKey}`);
    }
  }, []);

  const stopTutorial = useCallback(async (markComplete: boolean = true) => {
    console.log(`[TutorialContext] Stopping tutorial. Mark complete: ${markComplete}`);
    setRunJoyride(false);
    setActiveTutorialKey(null);
    setActiveTutorialSet(null);
    setCurrentGlobalStepIndex(0);
    if (markComplete && currentUser && userSettings && !userSettings.onboarding_complete) {
      try {
        await supabase.from('user_settings').update({ onboarding_complete: true }).eq('user_id', currentUser.id);
        // Optionally update local userSettings state if it's managed globally elsewhere
        console.log("[TutorialContext] User onboarding marked complete in DB.");
      } catch (error) {
        console.error("[TutorialContext] Error marking onboarding complete:", error);
      }
    }
  }, [currentUser, userSettings]);

  const completeStep = useCallback((stepIdentifier: string) => {
    setCompletedSteps(prev => ({ ...prev, [stepIdentifier]: true }));
  }, []);

  const getStepStatus = useCallback((stepIdentifier: string): 'pending' | 'completed' => {
    return completedSteps[stepIdentifier] ? 'completed' : 'pending';
  }, [completedSteps]);

  const userClickedTutorialTarget = useCallback((nextTutorialKey?: TutorialKey, nextStepIndex: number = 0) => {
    console.log("[TutorialContext] User clicked tutorial target.");
    if (activeTutorialSet && currentGlobalStepIndex < activeTutorialSet.length -1) {
        setCurrentGlobalStepIndex(prev => prev + 1);
    } else if (nextTutorialKey) {
        startTutorial(nextTutorialKey, nextStepIndex);
    } else {
        stopTutorial(true);
    }
  }, [activeTutorialSet, currentGlobalStepIndex, startTutorial, stopTutorial]);


  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { action, index, status, type, step } = data;
    console.log('[TutorialContext] Joyride Callback:', { action, index, status, type, stepId: step?.target });

    if (type === EVENTS.STEP_BEFORE && step.target) {
        const targetElement = document.querySelector(step.target as string);
        if (targetElement) {
            console.log(`[TutorialContext] Scrolling to target for step ${index}:`, step.target);
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        } else {
            console.warn(`[TutorialContext] Target element not found for step ${index}:`, step.target);
        }
    }
    
    if (action === ACTIONS.CLOSE || status === STATUS.SKIPPED) {
      stopTutorial(status === STATUS.SKIPPED); // Mark complete if skipped via button, not if closed via ESC
    } else if (status === STATUS.FINISHED) {
      stopTutorial(true);
    } else if (type === EVENTS.STEP_AFTER) {
      const currentStepConfig = activeTutorialSet?.[index];
      if (currentStepConfig?.isClickTriggerStep && action === ACTIONS.NEXT) {
        // This case means Joyride's "Next" button was clicked for a step that should have been advanced by a target click.
        // This can happen if the user clicks Joyride's "Next" instead of the highlighted element.
        // We might want to either stop the tutorial or handle it gracefully.
        // For now, let's just log it. If it advances, it's fine.
        console.warn(`[TutorialContext] Joyride "Next" clicked on a step (${currentStepConfig.target}) that expected a target click.`);
      }
      
      if (action === ACTIONS.NEXT && activeTutorialSet) {
        if (index + 1 < activeTutorialSet.length) {
          const nextStepConfig = activeTutorialSet[index + 1];
          if (nextStepConfig.pagePath && pathname !== nextStepConfig.pagePath) {
            console.log(`[TutorialContext] Navigating to ${nextStepConfig.pagePath} for next step.`);
            router.push(nextStepConfig.pagePath);
            // Joyride will pause, and resume once the new page's target is found (or timeout)
            // We might need to re-trigger runJoyride or adjust step index if Joyride doesn't auto-resume.
            // For now, let's assume Joyride handles this or we manage it via `run` prop based on page.
          }
        }
      }
    }
  }, [stopTutorial, router, pathname, activeTutorialSet]);

  const joyrideSteps = React.useMemo((): JoyrideStepUI[] => {
    if (!activeTutorialSet) return [];
    return activeTutorialSet.map(appStep => ({
      target: appStep.target,
      content: appStep.content,
      placement: appStep.placement || 'auto',
      title: appStep.title,
      disableBeacon: appStep.disableBeacon ?? false,
      spotlightClicks: appStep.spotlightClicks ?? false,
      hideFooter: appStep.hideFooter ?? false,
      // Add any other Joyride specific props that our TutorialStep might define
    }));
  }, [activeTutorialSet]);

  // Effect to show tutorial if settings indicate onboarding incomplete
   useEffect(() => {
    if (currentUser && userSettings && !userSettings.onboarding_complete && activeTutorialKey === null && pathname === '/') {
      console.log("[TutorialContext] User logged in, onboarding not complete, starting 'dashboard' tutorial.");
      startTutorial('dashboard');
    } else if (currentUser && userSettings?.onboarding_complete && activeTutorialKey === 'dashboard') {
      // If dashboard tutorial was active but user has completed onboarding, stop it.
      console.log("[TutorialContext] Onboarding now complete, stopping 'dashboard' tutorial if active.");
      stopTutorial(false); // Don't re-mark complete, just stop UI.
    }
  }, [currentUser, userSettings, startTutorial, stopTutorial, activeTutorialKey, pathname]);

  const contextValue = {
    isTutorialActive,
    startTutorial,
    stopTutorial,
    completeStep,
    getStepStatus,
    runJoyride,
    joyrideSteps,
    handleJoyrideCallback,
    currentGlobalStepIndex,
    activeTutorialSet,
    userClickedTutorialTarget
  };

  return (
    <OnboardingTutorialContext.Provider value={contextValue}>
      {children}
    </OnboardingTutorialContext.Provider>
  );
};

// Custom hook to use the context remains in its own file: src/hooks/useOnboardingTutorial.ts
// No changes needed to the hook itself based on this error.
    