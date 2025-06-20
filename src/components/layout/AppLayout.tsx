
'use client';

import React, { useState, useEffect, type ReactNode, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { SidebarNav } from './SidebarNav';
import { Logo } from '../icons/Logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card';
import { Settings, LogOut, LayoutDashboard, Home, Crown } from 'lucide-react';
import { Loader2, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Around } from "@theme-toggles/react";
import "@theme-toggles/react/css/Around.css";
import { cn } from '@/lib/utils';
import { SidebarUsageProgress } from './SidebarUsageProgress';
import type { JobOpening, UserSettings } from '@/lib/types';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';
import { OnboardingTutorialProvider } from '@/contexts/OnboardingTutorialContext';
import { useOnboardingTutorial } from '@/hooks/useOnboardingTutorial';
import type { TutorialStep as AppTutorialStep } from '@/components/tutorial/tutorial-steps';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useCurrentSubscription } from '@/hooks/use-current-subscription';
import { useAuth } from '@/contexts/AuthContext';
import { useCounts } from '@/contexts/CountsContext';
import Joyride, { type CallBackProps, EVENTS, ACTIONS, STATUS, LIFECYCLE } from 'react-joyride';
import { useUserDataCache } from '@/contexts/UserDataCacheContext';
import { useUserSession } from '@/contexts/UserSessionContext';

const PUBLIC_PATHS = ['/landing', '/auth', '/pricing', '/about', '/contact', '/careers', '/partner-with-us', '/privacy-policy', '/terms-and-conditions', '/cookie-policy', '/refund-policy'];
const BLOG_PATHS_REGEX = /^\/blog(\/.*)?$/;
const HIDE_DASHBOARD_LINK_PATHS = ['/', '/job-openings', '/contacts', '/companies', '/settings/billing', '/settings/account'];

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const names = name.split(' ').filter(Boolean);
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    } else if (names.length === 1 && names[0].length > 0) {
      return names[0].substring(0, 2).toUpperCase();
    }
  }
  if (email) {
    const emailPrefix = email.split('@')[0];
    if (emailPrefix.length >= 2) {
      return emailPrefix.substring(0, 2).toUpperCase();
    } else if (emailPrefix.length === 1) {
      return emailPrefix.toUpperCase();
    }
  }
  return 'U';
}

function TutorialComponentInternal() {
  const { isTutorialActive, runJoyride, joyrideSteps, handleJoyrideCallback, currentGlobalStepIndex, activeTutorialSet } = useOnboardingTutorial();
  
  if (!isTutorialActive || !runJoyride || !joyrideSteps || joyrideSteps.length === 0) {
    return null;
  }
  const currentStepConfig = joyrideSteps[currentGlobalStepIndex];

  return (
    <Joyride
      run={runJoyride}
      steps={joyrideSteps}
      stepIndex={currentGlobalStepIndex}
      continuous
      showProgress
      showSkipButton={!(currentStepConfig?.hideFooter || (currentStepConfig as any)?.isClickTriggerStep)}
      scrollToFirstStep
      disableScrollParentFix={false}
      disableScrolling={true}
      disableOverlayClose={true} 
      spotlightClicks={true}    
      styles={{
        options: {
          arrowColor: 'var(--joyride-arrow-color)',
          backgroundColor: 'var(--joyride-tooltip-background-color)',
          overlayColor: 'var(--joyride-overlay-color)',
          primaryColor: 'var(--joyride-tooltip-primary-button-background-color)',
          textColor: 'var(--joyride-tooltip-text-color)',
          zIndex: 10000, 
        },
        beaconInner: { backgroundColor: 'var(--joyride-beacon-inner-color)' },
        beaconOuter: { backgroundColor: 'var(--joyride-beacon-outer-color)', borderColor: 'var(--joyride-beacon-inner-color)' },
        spotlight: { padding: (currentStepConfig as any)?.spotlight?.padding ?? 0, borderRadius: 6 },
        tooltip: { padding: 16, width: 360 },
        tooltipContainer: { textAlign: 'left' },
        tooltipTitle: { margin: 0, marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: 600, color: 'var(--joyride-tooltip-title-color)' },
        tooltipContent: { padding: 0, fontSize: '0.875rem', color: 'var(--joyride-tooltip-text-color)' },
        tooltipFooter: { marginTop: '1rem', display:'flex', justifyContent: 'space-between', alignItems: 'center' },
        buttonNext: { backgroundColor: 'var(--joyride-tooltip-primary-button-background-color)', color: 'var(--joyride-tooltip-primary-button-text-color)', borderRadius: '0.375rem', padding: '0.5rem 1rem', fontSize: '0.875rem' },
        buttonBack: { color: 'var(--joyride-tooltip-text-color)', borderRadius: '0.375rem', padding: '0.5rem 1rem', fontSize: '0.875rem', marginRight: 'auto' },
        buttonSkip: { color: 'var(--joyride-tooltip-skip-button-color)', fontSize: '0.875rem' },
        buttonClose: { display: 'none' },
      }}
      callback={handleJoyrideCallback}
    />
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { user: currentUser, isLoadingAuth: isLoadingAuthContext, initialAuthCheckCompleted } = useAuth();
  const [themeState, setThemeState] = useState<'light' | 'dark'>('light');
  const [favoriteJobOpenings, setFavoriteJobOpenings] = useState<JobOpening[]>([]);
  
  const { previousUserIdRef } = useUserSession(); 
  const [isClientMounted, setIsClientMounted] = useState(false); // New state for client mount

  const {
    userSettings, 
    setUserSettings: setGlobalUserSettings,
    isLoadingSettings,
    setIsLoadingSettings: setGlobalIsLoadingSettings,
    hasFetchedSettingsOnce,
    setHasFetchedSettingsOnce
  } = useUserSettings();

  const { setCounts, setIsLoadingCounts: setGlobalIsLoadingCounts } = useCounts();
  const { actualUserTier, subscriptionLoading } = useCurrentSubscription(); // Get actualUserTier
  const { fetchAndCacheAllUserData, clearCache: clearUserDataCache, cachedData, isLoadingCache, initialCacheLoadAttempted: initialCacheLoadAttemptedForContext } = useUserDataCache();

  const isPublicPath = PUBLIC_PATHS.includes(pathname) || BLOG_PATHS_REGEX.test(pathname);
  const [showOnboardingForm, setShowOnboardingForm] = useState(false);
  const [onboardingCheckComplete, setOnboardingCheckComplete] = useState(false);

  useEffect(() => {
    setIsClientMounted(true); // Set client mounted flag
  }, []);

  const processUserSession = useCallback(async (currentUserToProcess: NonNullable<typeof currentUser>) => {
    setGlobalIsLoadingSettings(true);
    setGlobalIsLoadingCounts(true);

    try {
      await fetchAndCacheAllUserData(); 
    } catch (error: any) {
      toast({ title: 'Error initializing user session', description: error.message, variant: 'destructive' });
      setGlobalUserSettings(null);
      clearUserDataCache();
      setCounts({ jobOpenings: 0, contacts: 0, companies: 0 });
      setHasFetchedSettingsOnce(true); 
    }
  }, [
    fetchAndCacheAllUserData,
    setGlobalUserSettings, 
    setHasFetchedSettingsOnce, 
    setGlobalIsLoadingSettings, 
    setGlobalIsLoadingCounts, 
    setCounts, 
    clearUserDataCache,
    toast
  ]);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
    setThemeState(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');

    if (!initialAuthCheckCompleted) {
      return;
    }

    if (currentUser) {
      if (currentUser.id !== previousUserIdRef.current) {
        previousUserIdRef.current = currentUser.id; 
        localStorage.removeItem('onboardingCompleted');
        setShowOnboardingForm(false);
        setOnboardingCheckComplete(false);
        setGlobalUserSettings(null);
        setHasFetchedSettingsOnce(false);
        setFavoriteJobOpenings([]);
        setCounts({ jobOpenings: 0, contacts: 0, companies: 0 });
        clearUserDataCache();
        processUserSession(currentUser);
      } else { 
        if (!initialCacheLoadAttemptedForContext && !isLoadingCache) {
            processUserSession(currentUser);
        }
      }
    } else { 
      if (previousUserIdRef.current !== undefined && previousUserIdRef.current !== null) {
        localStorage.removeItem('onboardingCompleted');
        setShowOnboardingForm(false);
        setOnboardingCheckComplete(true);
        setGlobalUserSettings(null);
        setHasFetchedSettingsOnce(false); 
        setFavoriteJobOpenings([]);
        setCounts({ jobOpenings: 0, contacts: 0, companies: 0 });
        clearUserDataCache();
        previousUserIdRef.current = null; 
      } else {
         setOnboardingCheckComplete(true);
         setGlobalIsLoadingSettings(false);
         setGlobalIsLoadingCounts(false);
      }
    }

    if (currentUser && !isLoadingCache && initialCacheLoadAttemptedForContext) {
      const settingsFromCache = cachedData?.userSettings || null;
      setGlobalUserSettings(settingsFromCache); 
      setHasFetchedSettingsOnce(true);
      setGlobalIsLoadingSettings(false);

      const countsFromCache = {
        jobOpenings: (cachedData?.jobOpenings || []).length,
        contacts: (cachedData?.contacts || []).length,
        companies: (cachedData?.companies || []).length,
      };
      setCounts(countsFromCache);
      setGlobalIsLoadingCounts(false); 
      
      const onboardingCompleteInDb = settingsFromCache?.onboarding_complete === true;
      if (onboardingCompleteInDb) {
        setShowOnboardingForm(false);
        if (localStorage.getItem('onboardingCompleted') !== 'true') {
            localStorage.setItem('onboardingCompleted', 'true');
        }
      } else {
        if (settingsFromCache === null || !onboardingCompleteInDb) {
            setShowOnboardingForm(true);
            if (localStorage.getItem('onboardingCompleted') !== 'false') {
                localStorage.setItem('onboardingCompleted', 'false');
            }
        } else {
            setShowOnboardingForm(false); 
        }
      }
      setOnboardingCheckComplete(true);
    } else if (currentUser && isLoadingCache) {
       setOnboardingCheckComplete(false);
    }
  }, [
    currentUser, initialAuthCheckCompleted, 
    cachedData, isLoadingCache, initialCacheLoadAttemptedForContext,
    processUserSession, 
    setGlobalUserSettings, setHasFetchedSettingsOnce, setGlobalIsLoadingSettings, 
    setCounts, setGlobalIsLoadingCounts, 
    clearUserDataCache,
    previousUserIdRef 
  ]);

  useEffect(() => {
    if (cachedData?.jobOpenings) {
      setFavoriteJobOpenings(
        cachedData.jobOpenings.filter(jo => jo.is_favorite)
          .sort((a, b) => {
            const dateA = a.favorited_at ? new Date(a.favorited_at).getTime() : 0;
            const dateB = b.favorited_at ? new Date(b.favorited_at).getTime() : 0;
            return dateB - dateA; 
          })
      );
    } else {
      setFavoriteJobOpenings([]);
    }
  }, [cachedData?.jobOpenings]);

  useEffect(() => {
    if (!isLoadingAuthContext && initialAuthCheckCompleted && !isPublicPath && !currentUser) {
      router.push('/landing');
    }
  }, [currentUser, isLoadingAuthContext, initialAuthCheckCompleted, isPublicPath, pathname, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: 'Signed Out', description: 'You have been signed out.' });
  };

  const handleOnboardingFormComplete = async () => {
    setShowOnboardingForm(false);
    if (currentUser) {
      await processUserSession(currentUser); 
    }
  };

  const toggleTheme = () => {
    setThemeState(prevTheme => {
        const newTheme = prevTheme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        localStorage.setItem('theme', newTheme);
        return newTheme;
    });
  };
  
  const isLoadingInitialUserAndAuth = isLoadingAuthContext || !initialAuthCheckCompleted;
  const isAppLoadingForAuthenticatedUser = currentUser != null && (isLoadingCache || !initialCacheLoadAttemptedForContext || !onboardingCheckComplete);

  if (isLoadingInitialUserAndAuth) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isPublicPath) {
     return <>{children}</>;
  }

  if (!currentUser) { 
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isAppLoadingForAuthenticatedUser) {
    return (
      <OnboardingTutorialProvider currentUser={currentUser} userSettings={userSettings}>
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </OnboardingTutorialProvider>
    );
  }
  
  if (showOnboardingForm) { 
    return (
       <OnboardingTutorialProvider currentUser={currentUser} userSettings={userSettings}>
         <OnboardingForm
            user={currentUser}
            userId={currentUser.id}
            userEmail={currentUser.email}
            initialFullName={currentUser.user_metadata?.full_name || currentUser.email || ''}
            existingSettings={userSettings} 
            onOnboardingFormComplete={handleOnboardingFormComplete}
          />
       </OnboardingTutorialProvider>
    );
  }
  
  const userDisplayNameToShow = userSettings?.full_name || currentUser?.user_metadata?.full_name || currentUser?.email || 'User';
  const userInitials = getInitials(userDisplayNameToShow, currentUser?.email);
  const showDashboardLinkInMenu = !HIDE_DASHBOARD_LINK_PATHS.includes(pathname);
  const menuItemClass = "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

  return (
    <OnboardingTutorialProvider currentUser={currentUser} userSettings={userSettings}>
      {isClientMounted && <TutorialComponentInternal />} {/* Conditionally render TutorialComponentInternal */}
      <SidebarProvider defaultOpen>
        <Sidebar variant="sidebar" collapsible="icon" className="border-r">
          <SidebarHeader className="p-4 items-center flex justify-between">
            <Link href="/" passHref>
              <Logo className="group-data-[collapsible=icon]:hidden" />
            </Link>
            <SidebarTrigger className="group-data-[collapsible=icon]:hidden md:hidden hover:bg-transparent focus-visible:bg-transparent hover:text-primary" />
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav favoriteJobOpenings={favoriteJobOpenings} />
          </SidebarContent>
          <SidebarFooter
            className={cn(
              "flex flex-col justify-start",
              "p-2 group-data-[collapsible=icon]:pt-1 group-data-[collapsible=icon]:pb-2 group-data-[collapsible=icon]:pl-2 group-data-[collapsible=icon]:pr-2"
          )}>
            <SidebarUsageProgress user={currentUser} />
            <div className={cn("mt-4 flex items-center", "group-data-[collapsible=icon]:justify-center justify-start")}>
              <Around
                toggled={themeState === 'dark'}
                onClick={toggleTheme}
                title="Toggle theme"
                aria-label="Toggle theme"
                className={cn(
                    "theme-toggle",
                    "text-xl text-sidebar-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar-background hover:text-sidebar-foreground",
                    "w-auto",
                    "group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:p-0"
                )}
                style={{ '--theme-toggle__around--duration': '500ms' } as React.CSSProperties}
              />
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="bg-background">
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 shadow-sm">
              <div className="flex items-center gap-4">
                  <SidebarTrigger className="md:hidden hover:bg-transparent focus-visible:bg-transparent hover:text-primary" />
              </div>
              <HoverCard openDelay={0} closeDelay={200}>
                  <HoverCardTrigger asChild>
                      <Button
                          variant="ghost"
                          className={cn(
                              "relative h-9 w-9 rounded-full p-0 focus-visible:outline-none border-none",
                              "ring-2 ring-primary ring-offset-2 ring-offset-background hover:ring-ring"
                          )}
                      >
                          <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                              {isLoadingAuthContext || isLoadingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : userInitials}
                          </AvatarFallback>
                          </Avatar>
                           {actualUserTier === 'premium' && !subscriptionLoading && ( // Use actualUserTier for crown
                              <Crown className="absolute -bottom-1 -right-1 h-4 w-4 text-yellow-500" fill="currentColor"/>
                          )}
                      </Button>
                  </HoverCardTrigger>
                  <HoverCardContent align="end" className="w-56 p-1" sideOffset={8}>
                      <div className={cn("font-normal px-2 py-1.5")}>
                          <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none truncate">{isLoadingSettings ? "Loading name..." : userDisplayNameToShow}</p>
                          {currentUser.email && <p className="text-xs leading-none text-muted-foreground truncate">{currentUser.email}</p>}
                          </div>
                      </div>
                      <div className="my-1 h-px bg-muted" />
                      <Link href="/landing" passHref legacyBehavior>
                          <a className={cn(menuItemClass, "cursor-pointer")}>
                          <Home className="mr-2 h-4 w-4" />
                          <span>Homepage</span>
                          </a>
                      </Link>
                      {showDashboardLinkInMenu && (
                           <Link href="/" passHref legacyBehavior>
                              <a className={cn(menuItemClass, "cursor-pointer")}>
                              <LayoutDashboard className="mr-2 h-4 w-4" />
                              <span>Dashboard</span>
                              </a>
                          </Link>
                      )}
                      <Link href="/settings/account" passHref legacyBehavior>
                          <a className={cn(menuItemClass, "cursor-pointer")}>
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                          </a>
                      </Link>
                      <Link href="/settings/billing" passHref legacyBehavior>
                          <a className={cn(menuItemClass, "cursor-pointer")}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          <span>Billing & Plan</span>
                          </a>
                      </Link>
                      <div className="my-1 h-px bg-muted" />
                      <button
                          onClick={handleSignOut}
                          className={cn(menuItemClass, "text-destructive hover:bg-destructive/20 hover:text-destructive focus:bg-destructive/20 focus:text-destructive cursor-pointer w-full")}
                      >
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Sign Out</span>
                      </button>
                  </HoverCardContent>
                </HoverCard>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </OnboardingTutorialProvider>
  );
}
