
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PlusCircle, Rss, Mail as MailIcon, Handshake, Users, Building2, CalendarCheck, Briefcase as BriefcaseIcon, BarChart2, MailOpen, Loader2, Home } from "lucide-react";
import Link from "next/link";
import type { JobOpening, Contact, Company, FollowUp, UserSettings } from '@/lib/types';
import { isToday, isThisWeek, format, subDays, eachDayOfInterval, isEqual, startOfDay, isValid } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { InteractiveTutorial } from '@/components/tutorial/InteractiveTutorial';
import type { Step, CallBackProps } from 'react-joyride';
import { useRouter, useSearchParams as useNextSearchParams } from 'next/navigation';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCounts } from '@/contexts/CountsContext';
import { useUserDataCache } from '@/contexts/UserDataCacheContext';

const initialEmailSentStatuses: JobOpening['status'][] = [
  'Emailed', 'Followed Up - Once', 'Followed Up - Twice', 'Followed Up - Thrice',
  'No Response', 'Replied - Positive',
  'Replied - Negative', 'Interviewing', 'Offer', 'Rejected', 'Closed'
];

interface ChartDataPoint {
  date: string;
  displayDate: string;
  count: number;
}

const emailsSentChartConfig = {
  emails: { label: "Emails Sent", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const openingsAddedChartConfig = {
  openings: { label: "Openings Added", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const dashboardTutorialSteps: Step[] = [
  { target: '#dashboard-main-content-area', content: "This is your starting point on ProspectFlow. From here, you’ll get a quick snapshot of your job search—how many roles you're tracking, how your follow-ups are going, and what needs your attention next. It’s simple, clean, and made to help you stay on top of everything.", placement: 'center', disableBeacon: true, },
  { target: '#sidebar-main-nav-group', content: "Use these links on the left to move between your job openings, saved companies and contact lists. Everything’s organized so you never lose track of where things are or what to do next.", placement: 'right', spotlight: { padding: -3 }, },
  { target: '#sidebar-usage-progress', content: "These bars show how many job openings, companies, and contacts you've added relative to your plan’s limits. It’s a quick way to keep tabs on how much you’ve done—and how much room you’ve got to grow.", placement: 'right', },
  { target: '#dashboard-add-new-opening-button', content: "Whenever you find a new opportunity you want to pursue—click this button to add it. You can log emails, schedule follow-ups, and stay on top of every lead from here.", placement: 'bottom', disableBeacon: true, spotlightClicks: true, isClickableSpotlightLink: false, hideFooter: true, }, // isClickableSpotlightLink remains false as it's handled by Joyride's spotlightClicks
  { target: '#sidebar-nav-job-openings > a', content: "Now click the \"Job Openings\" button here. This is where you’ll be spending most of your time. All your tracked opportunities live here—emails, contacts, follow-ups, and updates. Click this link to get started managing your job hunt like a pro.", placement: 'right', disableBeacon: true, hideFooter: true, isClickableSpotlightLink: false, spotlightClicks: true, spotlight: { padding: 0 }, },
];

export default function DashboardPage() {
  const { user: currentUser, isLoadingAuth: isLoadingUserAuth, initialAuthCheckCompleted } = useAuth();
  const { counts: globalCounts, isLoadingCounts: isLoadingGlobalCounts } = useCounts();
  const { cachedData, isLoadingCache, initialCacheLoadAttempted } = useUserDataCache();

  const [stats, setStats] = useState({ followUpsToday: 0, followUpsThisWeek: 0 });
  const [emailsSentData, setEmailsSentData] = useState<ChartDataPoint[]>([]);
  const [openingsAddedData, setOpeningsAddedData] = useState<ChartDataPoint[]>([]);
  
  const [isProcessingDashboardData, setIsProcessingDashboardData] = useState(true);

  const { userSettings, isLoadingSettings: isLoadingContextSettings, hasFetchedSettingsOnce } = useUserSettings();
  const { toast } = useToast();
  const router = useRouter();
  const searchParamsInstance = useNextSearchParams();
  const [runDashboardTutorial, setRunDashboardTutorial] = useState(false);

  const processDashboardDataFromCache = useCallback(() => {
    if (!cachedData || !cachedData.jobOpenings) {
      setStats({ followUpsToday: 0, followUpsThisWeek: 0 });
      setEmailsSentData([]);
      setOpeningsAddedData([]);
      setIsProcessingDashboardData(false);
      return;
    }
    setIsProcessingDashboardData(true);
    const openingsWithFollowUps: Pick<JobOpening, 'id' | 'initial_email_date' | 'status' | 'followUps'>[] = cachedData.jobOpenings.map(jo => ({
      id: jo.id,
      initial_email_date: jo.initial_email_date, 
      status: jo.status,
      followUps: (jo.followUps || []).map(fuDb => ({ 
        ...fuDb,
        follow_up_date: fuDb.follow_up_date instanceof Date ? fuDb.follow_up_date : new Date(fuDb.follow_up_date),
      })),
    }));

    let todayCount = 0;
    let thisWeekCount = 0;
    openingsWithFollowUps.forEach(opening => {
      (opening.followUps || []).forEach(fu => {
        if (fu.status === 'Pending') {
          const followUpDate = startOfDay(fu.follow_up_date); 
          if (isValid(followUpDate)) {
            if (isToday(followUpDate)) todayCount++;
            if (isThisWeek(followUpDate, { weekStartsOn: 1 }) && !isToday(followUpDate) && followUpDate >= startOfDay(new Date())) {
              thisWeekCount++;
            }
          }
        }
      });
    });
    setStats({ followUpsToday: todayCount, followUpsThisWeek: thisWeekCount });

    const today = startOfDay(new Date());
    const last30DaysInterval = { start: subDays(today, 29), end: today };
    const dateRange = eachDayOfInterval(last30DaysInterval);
    const emailsMap = new Map<string, number>();
    const openingsMap = new Map<string, number>();
    dateRange.forEach(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      emailsMap.set(dateKey, 0);
      openingsMap.set(dateKey, 0);
    });

    openingsWithFollowUps.forEach(opening => {
      if (isValid(opening.initial_email_date)) {
        const initialEmailDay = startOfDay(opening.initial_email_date);
        const initialEmailDayKey = format(initialEmailDay, 'yyyy-MM-dd');
        if (openingsMap.has(initialEmailDayKey)) {
          openingsMap.set(initialEmailDayKey, (openingsMap.get(initialEmailDayKey) || 0) + 1);
        }
        if (initialEmailSentStatuses.includes(opening.status as any) && emailsMap.has(initialEmailDayKey)) {
          emailsMap.set(initialEmailDayKey, (emailsMap.get(initialEmailDayKey) || 0) + 1);
        }
      }
      (opening.followUps || []).forEach(fu => {
        if (fu.status === 'Sent' && isValid(fu.follow_up_date)) {
          const followUpDay = startOfDay(fu.follow_up_date);
          const followUpDayKey = format(followUpDay, 'yyyy-MM-dd');
          if (emailsMap.has(followUpDayKey)) {
            emailsMap.set(followUpDayKey, (emailsMap.get(followUpDayKey) || 0) + 1);
          }
        }
      });
    });
    const processedEmailsData: ChartDataPoint[] = [];
    emailsMap.forEach((count, dateKey) => {
      processedEmailsData.push({ date: dateKey, displayDate: format(new Date(dateKey + 'T00:00:00'), 'MMM dd'), count });
    });
    setEmailsSentData(processedEmailsData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

    const processedOpeningsData: ChartDataPoint[] = [];
    openingsMap.forEach((count, dateKey) => {
      processedOpeningsData.push({ date: dateKey, displayDate: format(new Date(dateKey + 'T00:00:00'), 'MMM dd'), count });
    });
    setOpeningsAddedData(processedOpeningsData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setIsProcessingDashboardData(false);
  }, [cachedData]);

  useEffect(() => {
    // console.log('[DashboardPage] Main useEffect. AuthCompleted:', initialAuthCheckCompleted, 'User:', !!currentUser, 'IsLoadingCache:', isLoadingCache, 'InitialCacheLoadAttempted:', initialCacheLoadAttempted); // Simplified
    if (initialAuthCheckCompleted && currentUser) {
      if (!isLoadingCache && initialCacheLoadAttempted) {
        // console.log('[DashboardPage] Cache ready, processing data.'); // Removed
        processDashboardDataFromCache();
      } else if (isLoadingCache) {
        // console.log('[DashboardPage] Cache is loading, setting dashboard processing to true.'); // Removed
        setIsProcessingDashboardData(true); 
      } else if (!initialCacheLoadAttempted) {
         // console.log('[DashboardPage] Initial cache load not yet attempted, setting dashboard processing to true.'); // Removed
         setIsProcessingDashboardData(true);
      }
    } else if (initialAuthCheckCompleted && !currentUser) {
      // console.log('[DashboardPage] No user, clearing dashboard data.'); // Removed
      setStats({ followUpsToday: 0, followUpsThisWeek: 0 });
      setEmailsSentData([]);
      setOpeningsAddedData([]);
      setIsProcessingDashboardData(false);
    }
  }, [currentUser, initialAuthCheckCompleted, isLoadingCache, initialCacheLoadAttempted, processDashboardDataFromCache]);

  const newQueryParam = searchParamsInstance?.get('new');
  useEffect(() => {
    if (newQueryParam === 'true' && currentUser) {
      if (typeof window !== "undefined") router.replace('/', { scroll: false }); 
    }
  }, [newQueryParam, currentUser, router]);

  useEffect(() => {
    // console.log('[DashboardPage] Tutorial useEffect.'); // Simplified
    if (isLoadingUserAuth || isLoadingContextSettings || isProcessingDashboardData || !initialAuthCheckCompleted) return;
    if (!currentUser) { setRunDashboardTutorial(false); return; }
    if (!hasFetchedSettingsOnce) return;

    const timer = setTimeout(() => {
      const dbOnboardingComplete = userSettings?.onboarding_complete === true;
      // console.log('[DashboardPage] Tutorial check: dbOnboardingComplete:', dbOnboardingComplete); // Removed
      if (dbOnboardingComplete) {
        setRunDashboardTutorial(false);
        if (localStorage.getItem('onboardingCompleted') !== 'true') localStorage.setItem('onboardingCompleted', 'true');
      } else {
        setRunDashboardTutorial(true);
        if (localStorage.getItem('onboardingCompleted') !== 'false') localStorage.setItem('onboardingCompleted', 'false');
      }
    }, 300); 
    return () => clearTimeout(timer);
  }, [currentUser, isLoadingUserAuth, isLoadingContextSettings, hasFetchedSettingsOnce, userSettings, isProcessingDashboardData, initialAuthCheckCompleted]);

  const completeOnboardingNoToast = async () => {
    if (currentUser) {
      try {
        const { data: existingSettings, error: fetchError } = await supabase.from('user_settings').select('user_id').eq('user_id', currentUser.id).maybeSingle();
        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
        if (existingSettings) {
            const { error } = await supabase.from('user_settings').update({ onboarding_complete: true }).eq('user_id', currentUser.id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('user_settings').insert({ user_id: currentUser.id, onboarding_complete: true, how_heard: 'Unknown' }); 
            if (error) throw error;
        }
        localStorage.setItem('onboardingCompleted', 'true');
        // console.log('[DashboardPage] Onboarding marked complete.'); // Removed
      } catch (dbError: any) {
        toast({ title: 'Error Saving Onboarding Status', description: dbError.message, variant: 'destructive' });
      }
    }
  };

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status, type, step, action } = data;
    // console.log('[DashboardPage] Joyride callback:', { status, type, stepId: step?.target, action }); // Removed
    if (status === 'finished' || status === 'skipped') {
      setRunDashboardTutorial(false);
      if (!(action === 'click' && (step as any).isClickableSpotlightLink)) { // type assertion for custom prop
        await completeOnboardingNoToast();
      }
      if (status === 'skipped' && !(action === 'click' && (step as any).isClickableSpotlightLink)) { // type assertion
        // Toast handled by handleSkipTutorialExternally
      } else if (status === 'finished' && !(action === 'click' && (step as any).isClickableSpotlightLink)) { // type assertion
        toast({ title: "Onboarding Complete!", description: "Welcome to ProspectFlow! Redirecting to Dashboard..." });
        router.push('/');
      }
    }
    if (type === 'step:after' && action === 'next' && step && (step as any).spotlightClicks && (step as any).target === '#dashboard-add-new-opening-button') { // type assertion
        router.push('/job-openings?new=true'); // Navigate after "Add New Opening" button step is advanced by click
    }
  };

  const handleSkipTutorialExternally = async () => {
    setRunDashboardTutorial(false);
    await completeOnboardingNoToast();
    toast({ title: "Tutorial Skipped", description: "Welcome to ProspectFlow! Redirecting to Dashboard..." });
    router.push('/');
  };

  const handleFinalStepAction = async () => {
    router.push('/job-openings'); setRunDashboardTutorial(false);
    await completeOnboardingNoToast(); 
    toast({ title: "Tutorial Complete!", description: "You're all set! Redirecting to Job Openings..." });
  };

  const isStillLoadingContent = isLoadingUserAuth || !initialAuthCheckCompleted || isLoadingCache || isLoadingGlobalCounts || isProcessingDashboardData;
  // console.log('[DashboardPage] isStillLoadingContent:', isStillLoadingContent); // Removed

  if (isLoadingUserAuth || !initialAuthCheckCompleted) {
    // console.log('[DashboardPage] User auth still loading, showing main spinner.'); // Removed
    return (<AppLayout><div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div></AppLayout>);
  }
  if (!currentUser) {
    // console.log('[DashboardPage] No current user, showing Access Denied.'); // Removed
    return (<AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle></CardHeader><CardContent><p>Please log in to view your dashboard.</p><Button onClick={() => router.push('/auth')} className="mt-4">Sign In</Button></CardContent></Card></AppLayout>);
  }
  
  return (
    <AppLayout>
      {currentUser && ( <InteractiveTutorial run={runDashboardTutorial} steps={dashboardTutorialSteps} onJoyrideCallback={handleJoyrideCallback} onSkipTutorialRequest={handleSkipTutorialExternally} onFinalStepAction={handleFinalStepAction} /> )}
      <div className="space-y-6" id="dashboard-main-content-area">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div> <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2> <p className="text-muted-foreground">Welcome back! Here's an overview of your prospects.</p> </div>
          <div className="flex gap-2"> <Link href="/job-openings?new=true" passHref> <Button id="dashboard-add-new-opening-button" disabled={!currentUser || isLoadingUserAuth}> <PlusCircle className="mr-2 h-4 w-4" /> Add New Opening </Button> </Link> </div>
        </div>

        {(isStillLoadingContent) ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"> {[...Array(5)].map((_, i) => ( <Card key={i} className="shadow-lg"> <CardHeader> <Skeleton className="h-6 w-3/4 mb-2" /> <Skeleton className="h-4 w-1/2" /> </CardHeader> <CardContent> <Skeleton className="h-8 w-1/2 mb-1" /> <Skeleton className="h-4 w-3/4" /> </CardContent> </Card> ))} <Card className="shadow-lg lg:col-span-3"> <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader> <CardContent><Skeleton className="h-[300px] w-full" /></CardContent> </Card> <Card className="shadow-lg lg:col-span-3"> <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader> <CardContent><Skeleton className="h-[300px] w-full" /></CardContent> </Card> </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-lg"> <CardHeader> <CardTitle className="font-headline flex items-center"> <CalendarCheck className="mr-2 h-5 w-5 text-primary" /> Upcoming Follow-ups </CardTitle> <CardDescription>Tasks needing your attention.</CardDescription> </CardHeader> <CardContent> <div className="flex items-center justify-between"> <span className="text-sm">Due Today:</span> <span className="text-lg font-semibold">{stats.followUpsToday}</span> </div> <div className="flex items-center justify-between mt-1"> <span className="text-sm">Due This Week (upcoming):</span> <span className="text-lg font-semibold">{stats.followUpsThisWeek}</span> </div> {(stats.followUpsToday === 0 && stats.followUpsThisWeek === 0) && ( <p className="text-sm text-muted-foreground mt-2"> No pending follow-ups scheduled. </p> )} </CardContent> </Card>
            <Card className="shadow-lg"> <CardHeader> <CardTitle className="font-headline flex items-center"> <BriefcaseIcon className="mr-2 h-5 w-5 text-primary" /> Active Opportunities </CardTitle> <CardDescription>Job openings you are currently pursuing.</CardDescription> </CardHeader> <CardContent> <div className="flex items-center"> <span className="text-3xl font-bold">{globalCounts.jobOpenings}</span> <span className="ml-2 text-sm text-muted-foreground">active openings</span> </div> {(globalCounts.jobOpenings === 0) && ( <p className="text-sm text-muted-foreground mt-2"> No active job openings tracked yet. </p> )} </CardContent> </Card>
            <Card className="shadow-lg"> <CardHeader> <CardTitle className="font-headline flex items-center"> <Users className="mr-2 h-5 w-5 text-primary" /> Total Contacts </CardTitle> <CardDescription>Your professional network.</CardDescription> </CardHeader> <CardContent> <div className="flex items-center"> <span className="text-3xl font-bold">{globalCounts.contacts}</span> <span className="ml-2 text-sm text-muted-foreground">contacts</span> </div> {(globalCounts.contacts === 0) && ( <p className="text-sm text-muted-foreground mt-2"> No contacts added yet. </p> )} </CardContent> </Card>
            <Card className="shadow-lg"> <CardHeader> <CardTitle className="font-headline flex items-center"> <Building2 className="mr-2 h-5 w-5 text-primary" /> Total Companies </CardTitle> <CardDescription>Companies in your directory.</CardDescription> </CardHeader> <CardContent> <div className="flex items-center"> <span className="text-3xl font-bold">{globalCounts.companies}</span> <span className="ml-2 text-sm text-muted-foreground">companies</span> </div> {(globalCounts.companies === 0) && ( <p className="text-sm text-muted-foreground mt-2"> No companies added yet. </p> )} </CardContent> </Card>
            <Card className="shadow-lg lg:col-span-1"> <CardHeader> <CardTitle className="font-headline">Quick Links</CardTitle> <CardDescription>Navigate to key sections quickly.</CardDescription> </CardHeader> <CardContent className="grid grid-cols-1 gap-3"> <Link href="/blog" passHref> <Button variant="outline" className="w-full justify-start"> <Rss className="mr-2 h-4 w-4" /> Visit Our Blog </Button> </Link> <Link href="/contact" passHref> <Button variant="outline" className="w-full justify-start"> <MailIcon className="mr-2 h-4 w-4" /> Contact Us </Button> </Link> <Link href="/partner-with-us" passHref> <Button variant="outline" className="w-full justify-start"> <Handshake className="mr-2 h-4 w-4" /> Partner With Us </Button> </Link> </CardContent> </Card>
            <Card className="shadow-lg lg:col-span-3"> <CardHeader> <CardTitle className="font-headline flex items-center"> <MailOpen className="mr-2 h-5 w-5 text-primary" /> Emails Sent Per Day (Last 30 Days) </CardTitle> </CardHeader> <CardContent> {(!Array.isArray(emailsSentData) || emailsSentData.filter(d => d.count > 0).length === 0) ? ( <p className="text-sm text-muted-foreground h-[300px] flex items-center justify-center">No email data to display for the last 30 days.</p> ) : ( <ChartContainer config={emailsSentChartConfig} className="h-[300px] w-full"> <BarChart accessibilityLayer data={emailsSentData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}> <CartesianGrid vertical={false} strokeDasharray="3 3" /> <XAxis dataKey="displayDate" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value, index) => { if (emailsSentData.length > 10 && index % 3 !== 0 && index !== 0 && index !== emailsSentData.length -1) return ''; return value; }} /> <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} /> <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} /> <Bar dataKey="count" fill="var(--color-emails)" radius={4} /> </BarChart> </ChartContainer> )} </CardContent> </Card>
            <Card className="shadow-lg lg:col-span-3"> <CardHeader> <CardTitle className="font-headline flex items-center"> <BarChart2 className="mr-2 h-5 w-5 text-primary" /> Job Openings Added Per Day (Last 30 Days) </CardTitle> </CardHeader> <CardContent> {(!Array.isArray(openingsAddedData) || openingsAddedData.filter(d => d.count > 0).length === 0) ? ( <p className="text-sm text-muted-foreground h-[300px] flex items-center justify-center">No new openings data to display for the last 30 days.</p> ): ( <ChartContainer config={openingsAddedChartConfig} className="h-[300px] w-full"> <BarChart accessibilityLayer data={openingsAddedData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}> <CartesianGrid vertical={false} strokeDasharray="3 3" /> <XAxis dataKey="displayDate" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value, index) => { if (openingsAddedData.length > 10 && index % 3 !== 0 && index !== 0 && index !== openingsAddedData.length -1) return ''; return value; }} /> <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} /> <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} /> <Bar dataKey="count" fill="var(--color-openings)" radius={4} /> </BarChart> </ChartContainer> )} </CardContent> </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
