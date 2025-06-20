
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Briefcase,
  Users,
  Building2,
  Star,
  Edit3,
  Rss,
  Settings,
  CreditCard,
  UserCircle,
  SlidersHorizontal,
  MailQuestion,
  KeyRound,
  LayoutDashboard,
  ShieldAlert, 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { JobOpening } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { OWNER_EMAIL } from '@/lib/config';

interface NavItem {
  id?: string;
  href: string;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
  separator?: boolean;
  ownerOnly?: boolean;
}

const mainNavItems: NavItem[] = [
  { id: 'sidebar-nav-dashboard', href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sidebar-nav-job-openings', href: '/job-openings', label: 'Job Openings', icon: Briefcase },
  { id: 'sidebar-nav-contacts', href: '/contacts', label: 'Contacts', icon: Users },
  { id: 'sidebar-nav-companies', href: '/companies', label: 'Companies', icon: Building2 },
];

const settingsBaseNavItems: NavItem[] = [
  { id: 'sidebar-nav-settings-profile', href: '/settings/account#profile-details', label: 'Profile', icon: UserCircle },
  { id: 'sidebar-nav-settings-usage', href: '/settings/account#usage-preferences', label: 'Usage & Cadence', icon: SlidersHorizontal },
  { id: 'sidebar-nav-settings-email', href: '/settings/account#email-customization', label: 'Email Templates', icon: MailQuestion },
  { id: 'sidebar-nav-settings-security', href: '/settings/account#security', label: 'Password', icon: KeyRound },
  { id: 'sidebar-nav-settings-billing', href: '/settings/billing', label: 'Billing & Plan', icon: CreditCard, separator: true },
  { id: 'sidebar-nav-settings-danger', href: '/settings/account#danger-zone', label: 'Danger Zone', icon: ShieldAlert, separator: true },
];

const settingsNavItemsWithBack: NavItem[] = [
  { id: 'sidebar-nav-settings-back-to-dashboard', href: '/', label: 'Back to Dashboard', icon: LayoutDashboard, separator: true },
  ...settingsBaseNavItems,
];


const blogNavItems: NavItem[] = [
  { id: 'sidebar-nav-blog-view', href: '/blog', label: 'View Blog', icon: Rss, separator: true, ownerOnly: true },
  { id: 'sidebar-nav-blog-create', href: '/blog/create', label: 'Create New Post', icon: Edit3, ownerOnly: true },
];


interface SidebarNavProps {
  favoriteJobOpenings?: JobOpening[];
}

export function SidebarNav({ favoriteJobOpenings = [] }: SidebarNavProps) {
  const pathname = usePathname();
  const { state: sidebarState, isMobile } = useSidebar();
  const [isOwner, setIsOwner] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [currentHash, setCurrentHash] = useState('');


  useEffect(() => {
    const updateHash = () => {
      setCurrentHash(window.location.hash);
    };
    window.addEventListener('hashchange', updateHash, false);
    updateHash(); 
    return () => window.removeEventListener('hashchange', updateHash, false);
  }, []);


  useEffect(() => {
    const checkUser = async () => {
      setIsLoadingUser(true);
      const { data: { user } } = await supabase.auth.getUser();
      setIsOwner(user?.email === OWNER_EMAIL);
      setIsLoadingUser(false);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        setIsOwner(session?.user?.email === OWNER_EMAIL);
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, []);

  const isCollapsedDesktop = sidebarState === 'collapsed' && !isMobile;
  const isExpandedDesktop = sidebarState === 'expanded' && !isMobile;
  const isSettingsPage = pathname.startsWith('/settings/account');
  const isBillingPage = pathname === '/settings/billing';


  const renderNavItems = (items: NavItem[], groupLabel?: string, groupTargetId?: string) => {
    const filteredItems = items.filter(item => !item.ownerOnly || (item.ownerOnly && isOwner));

    if (filteredItems.length === 0 && groupLabel && items.every(item => item.ownerOnly)) return null;
    if (filteredItems.length === 0 && !groupLabel) return null;

    return (
        <SidebarGroup id={groupTargetId || (groupLabel ? groupLabel.toLowerCase().replace(/\s+/g, '-') : undefined)}>
        {groupLabel && !isSettingsPage && !isBillingPage && ( 
            <SidebarGroupLabel className="group-data-[collapsible=icon]:sr-only">
            {groupLabel}
            </SidebarGroupLabel>
        )}
        <SidebarMenu>
            {filteredItems.map((item) => {
                const [pathOnly, hashValue] = item.href.split('#');
                let isActive;
                if (isSettingsPage) {
                    isActive = item.href.startsWith('/settings/account') && (hashValue ? currentHash === `#${hashValue}` : (!currentHash || currentHash === '#profile-details'));
                } else {
                    isActive = pathname === pathOnly;
                }
                
                if (item.href === '/settings/billing') {
                    isActive = isBillingPage;
                }
                

               return (
                <React.Fragment key={item.label}>
                    {item.separator && (isSettingsPage || isBillingPage) && item.href === '/settings/billing' && (
                        <SidebarSeparator className="my-1" />
                    )}
                     {item.separator && (isSettingsPage) && item.href === '/settings/account#danger-zone' && (
                        <SidebarSeparator className="my-1" />
                    )}
                    {item.separator && item.ownerOnly && isOwner && !isSettingsPage && !isBillingPage && item.href === '/blog' && (
                       <SidebarSeparator className="my-1" />
                    )}
                    {item.separator && item.href === '/' && (isSettingsPage || isBillingPage) && (
                         <SidebarSeparator className="my-1" />
                    )}


                    <SidebarMenuItem id={item.id}>
                    <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(item.disabled && "cursor-not-allowed opacity-50")}
                        tooltip={isCollapsedDesktop ? { children: item.label, side: "right", align: "center" } : undefined}
                    >
                        <Link
                        href={item.href}
                        aria-disabled={item.disabled}
                        tabIndex={item.disabled ? -1 : undefined}
                        onClick={(e) => {
                            if (item.disabled) e.preventDefault();
                            if (item.href.includes('#') && pathname === pathOnly) {
                                if (window.location.hash === `#${hashValue}`) {
                                    window.dispatchEvent(new HashChangeEvent("hashchange"));
                                }
                            }
                        }}
                        >
                        <item.icon />
                        <span>{item.label}</span>
                        </Link>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                </React.Fragment>
               );
            })}
        </SidebarMenu>
        </SidebarGroup>
    );
  };

  if (isLoadingUser && !isCollapsedDesktop) {
    return (
      <div className="space-y-2 p-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 animate-pulse">
            <div className="h-5 w-5 rounded bg-muted"></div>
            <div className="h-4 w-3/4 rounded bg-muted"></div>
          </div>
        ))}
      </div>
    );
  }


  return (
    <div className="flex flex-col h-full">
      {(isSettingsPage || isBillingPage) ? renderNavItems(settingsNavItemsWithBack) : renderNavItems(mainNavItems, undefined, "sidebar-main-nav-group")}
      {isOwner && !(isSettingsPage || isBillingPage) && renderNavItems(blogNavItems, "Blog Management")}

      {favoriteJobOpenings && favoriteJobOpenings.length > 0 && !(isSettingsPage || isBillingPage) && (
        <>
          <SidebarSeparator />
          <SidebarGroup className="flex flex-col flex-1 min-h-0">
            <SidebarGroupLabel className="group-data-[collapsible=icon]:sr-only shrink-0">
              Favorites
            </SidebarGroupLabel>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <SidebarMenu>
                {favoriteJobOpenings.map((opening) => {
                  const favoriteDisplayName = `${opening.role_title} @ ${opening.company_name_cache}`;
                  return (
                    <SidebarMenuItem key={opening.id} className="group/favorite-item">
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton
                              asChild
                              className="w-full"
                              tooltip={isCollapsedDesktop ? { children: favoriteDisplayName, side: "right", align: "center" } : undefined}
                            >
                              <Link href={`/job-openings?view=${opening.id}`}>
                                <Star className="text-yellow-500 flex-shrink-0" />
                                <span className={cn("truncate ml-2", isCollapsedDesktop ? "hidden" : "group-data-[collapsible=icon]:hidden")}>
                                  {favoriteDisplayName}
                                </span>
                              </Link>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          {isExpandedDesktop && (
                            <TooltipContent
                              side="bottom"
                              align="start"
                              className="whitespace-normal max-w-xs z-50 bg-popover text-popover-foreground"
                              sideOffset={5}
                            >
                              {favoriteDisplayName}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          </SidebarGroup>
        </>
      )}
    </div>
  );
}
