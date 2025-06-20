
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Building2, Users, Briefcase, CreditCard, AlertTriangle } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import type { UserSubscription, SubscriptionTier } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useCurrentSubscription } from '@/hooks/use-current-subscription';
import { differenceInDays } from 'date-fns';
import { useCounts } from '@/contexts/CountsContext'; // Import useCounts
import type { User } from '@supabase/supabase-js'; // Keep User type for prop

interface UsageStats {
  companies: { current: number; limit: number | typeof Infinity };
  contacts: { current: number; limit: number | typeof Infinity };
  jobOpenings: { current: number; limit: number | typeof Infinity };
}

interface SidebarUsageProgressProps {
  user: User | null;
}

const StatItem: React.FC<{
  icon: React.ElementType;
  label: string;
  current: number;
  limit: number | typeof Infinity;
}> = ({ icon: Icon, label, current, limit }) => {
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === 'collapsed';

  const isUnlimited = limit === Infinity;
  const percentage = !isUnlimited && limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
  const displayLimit = isUnlimited ? '∞' : limit;
  const isOverLimit = !isUnlimited && current > limit;

  const content = (
    <div className={cn("w-full", isCollapsed ? "py-1 flex flex-col items-center" : "space-y-1")}>
      <div className={cn("flex items-center gap-2", isCollapsed ? "flex-col justify-center w-full" : "justify-between")}>
        <div className={cn("flex items-center", isCollapsed ? "flex-col gap-0.5" : "gap-1.5")}>
          <Icon className={cn("h-4 w-4 text-sidebar-foreground/80", isCollapsed ? "h-5 w-5" : "")} />
          {!isCollapsed && <span className="text-xs font-medium text-sidebar-foreground/90 truncate">{label}</span>}
        </div>
        {!isCollapsed && (
          <span className={cn("text-xs text-sidebar-foreground/70 shrink-0", isOverLimit ? "text-destructive font-semibold" : "")}>
            {current}/{displayLimit}
          </span>
        )}
      </div>
      <Progress
        value={isUnlimited ? 0 : percentage} 
        className={cn(
          "h-1.5 w-full",
          isCollapsed ? "h-1 mt-0.5 max-w-[2rem]" : "",
          isOverLimit
            ? "bg-destructive/20 [&>div]:bg-destructive"
            : isUnlimited
              ? "[&>div]:bg-transparent" // Make indicator transparent for unlimited
              : "[&>div]:bg-sidebar-accent"
        )}
        aria-label={`${label} usage ${current} of ${displayLimit}`}
      />
       {isCollapsed && isUnlimited && (
        <span className="text-[0.6rem] text-sidebar-foreground/70 mt-0.5">Diamond</span>
      )}
    </div>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex justify-center w-full cursor-default">{content}</div>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" className="text-xs">
          <p>{label}: {current}/{displayLimit} {isOverLimit && "(Over Limit!)"}</p>
        </TooltipContent>
      </Tooltip>
    );
  }
  return content;
};


export function SidebarUsageProgress({ user }: SidebarUsageProgressProps) {
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === 'collapsed';
  const { counts, isLoadingCounts: isLoadingContextCounts } = useCounts(); // Use CountsContext

  const {
    currentSubscription,
    subscriptionLoading,
    actualUserTier, 
    effectiveLimits, 
    isInGracePeriod,
    daysLeftInGracePeriod,
    isPrivilegedUser,
  } = useCurrentSubscription();


  const usageStats: UsageStats | null = user ? {
    companies: { current: counts.companies, limit: effectiveLimits.companies },
    contacts: { current: counts.contacts, limit: effectiveLimits.contacts },
    jobOpenings: { current: counts.jobOpenings, limit: effectiveLimits.jobOpenings },
  } : null;

  const renderGracePeriodWarning = () => {
    if (!isInGracePeriod || daysLeftInGracePeriod === null || subscriptionLoading) return null;

    const message = daysLeftInGracePeriod > 0
      ? `${daysLeftInGracePeriod} day${daysLeftInGracePeriod !== 1 ? 's' : ''} left to manage data.`
      : "Data cleanup imminent. Renew or manage data now.";

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex justify-center w-full cursor-default px-1 py-1.5 mb-1 bg-destructive/10 rounded-md border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" align="center" className="text-xs bg-destructive text-destructive-foreground">
            <p>{message}</p>
            <p>Excess data may be deleted.</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <div className="px-2 mb-2 text-xs text-destructive bg-destructive/10 p-2 rounded-md border border-destructive/20">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="font-semibold">{message}</span>
        </div>
        <p className="mt-0.5">Excess data may be deleted after this period.</p>
      </div>
    );
  };

  const renderSubscriptionStatus = () => {
    if (subscriptionLoading) {
      return (
        <div className={cn("px-2 mb-2", isCollapsed ? "py-2 flex flex-col items-center" : "py-1")}>
          <Skeleton className={cn("h-4", isCollapsed ? "w-8 mb-0.5" : "w-20 mb-0.5")} />
          <Skeleton className={cn("h-3", isCollapsed ? "w-12" : "w-16")} />
        </div>
      );
    }

    const planDisplayName = isPrivilegedUser ? "Diamond User" : (actualUserTier === 'premium' ? "Premium Plan" : "Free Plan");
    const timeLeftMessage = actualUserTier === 'premium' && currentSubscription?.status === 'active' && currentSubscription.plan_expiry_date
        ? (() => {
            const daysLeft = differenceInDays(currentSubscription.plan_expiry_date!, new Date());
            if (daysLeft < 0) return undefined; 
            if (daysLeft === 0) return "Expires today";
            return `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;
          })()
        : undefined;


    if (actualUserTier === 'premium' || isPrivilegedUser) {
      const content = (
        <div className={cn("w-full", isCollapsed ? "py-1 text-center" : "py-2")}>
          {isCollapsed ? (
            <>
              <p className="text-xs font-semibold truncate" title={planDisplayName}>{planDisplayName}</p>
              {timeLeftMessage && !isPrivilegedUser && <p className="text-[0.65rem] leading-tight text-sidebar-foreground/80">{timeLeftMessage}</p>}
            </>
          ) : (
            <div className="flex justify-between items-center w-full">
              <p className="text-sm font-semibold text-sidebar-foreground truncate" title={planDisplayName}>{planDisplayName}</p>
              {timeLeftMessage && !isPrivilegedUser && <p className="text-xs text-sidebar-foreground/80">{timeLeftMessage}</p>}
            </div>
          )}
        </div>
      );
      if (isCollapsed) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex justify-center w-full cursor-default px-1 mb-1">{content}</div>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" className="text-xs">
              <p>{planDisplayName}</p>
              {timeLeftMessage && !isPrivilegedUser && <p>{timeLeftMessage}</p>}
            </TooltipContent>
          </Tooltip>
        );
      }
      return <div className="px-2 mb-2 text-sidebar-foreground">{content}</div>;
    } else { // Free Plan
      const freePlanContent = (
         <div className={cn("w-full", isCollapsed ? "flex flex-col items-center py-1" : "py-2")}>
          {isCollapsed ? (
            <p className="text-xs font-semibold">{"Free Plan"}</p>
          ) : (
            <div className="flex justify-between items-center w-full">
              <p className="text-sm font-semibold text-sidebar-foreground">{"Free Plan"}</p>
              <Button asChild variant="outline" size="sm" className="h-7 text-xs bg-sidebar-accent/10 hover:bg-sidebar-accent/30 border-sidebar-accent/50 text-sidebar-accent hover:text-sidebar-accent focus-visible:ring-sidebar-accent">
                <Link href="/settings/billing">Upgrade</Link>
              </Button>
            </div>
          )}
        </div>
      );

      if (isCollapsed) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="icon" className="w-full h-auto p-1.5 mb-1 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <Link href="/settings/billing">
                  <CreditCard className="h-5 w-5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" className="text-xs">Upgrade to Premium</TooltipContent>
          </Tooltip>
        );
      }
      return <div className="px-2 mb-2 text-sidebar-foreground">{freePlanContent}</div>;
    }
  };

  if (!user) return null;

  const finalIsLoading = isLoadingContextCounts || subscriptionLoading;

  return (
    <div id="sidebar-usage-progress">
      {renderGracePeriodWarning()}
      {renderSubscriptionStatus()}
      {finalIsLoading && !usageStats && (
         <div className={cn("space-y-2 px-2", isCollapsed ? "py-2" : "py-1")}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={cn(isCollapsed ? "flex flex-col items-center gap-1 my-1.5" : "space-y-1")}>
                {!isCollapsed && <Skeleton className="h-3 w-20 mb-0.5" />}
                 <div className={cn("flex items-center w-full", isCollapsed ? "justify-center" : "justify-between")}>
                    {isCollapsed && <Skeleton className="h-5 w-5" />}
                     <Skeleton className={cn("h-1.5", isCollapsed ? "h-1 w-8" : "w-full")} />
                    {!isCollapsed && <Skeleton className="h-3 w-8" />}
                </div>
              </div>
            ))}
        </div>
      )}
      {!finalIsLoading && usageStats && (
        <div className={cn("space-y-2 px-2", isCollapsed ? "py-2" : "pt-1")}>
          <StatItem icon={Briefcase} label="Openings" current={usageStats.jobOpenings.current} limit={usageStats.jobOpenings.limit} />
          <StatItem icon={Users} label="Contacts" current={usageStats.contacts.current} limit={usageStats.contacts.limit} />
          <StatItem icon={Building2} label="Companies" current={usageStats.companies.current} limit={usageStats.companies.limit} />
        </div>
      )}
       {!finalIsLoading && !usageStats && currentSubscription?.status !== 'error' && (
        <div className={cn("p-2 text-xs text-sidebar-foreground/60", isCollapsed ? "text-center" : "text-left")}>Usage Stats N/A</div>
       )}
       {currentSubscription?.status === 'error' && !finalIsLoading && (
         <div className={cn("p-2 text-xs text-destructive", isCollapsed ? "text-center" : "text-left")}>Error loading stats.</div>
       )}
    </div>
  );
}

