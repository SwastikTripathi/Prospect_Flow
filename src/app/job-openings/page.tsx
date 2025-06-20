
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Search as SearchIcon, Briefcase as BriefcaseIconLucide, Trash2, XCircle, Loader2, Star, Settings, HelpCircle, User as UserIcon, Mail as MailIconLucide, CalendarDays, MessageSquareText, ExternalLink, Copy, MailCheck, Building2 as Building2Icon, Linkedin as LinkedinIcon, Phone as PhoneIcon, Globe as GlobeIcon, Info as InfoIcon, UserCircle2 as UserCircle2Icon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { JobOpening, Company, Contact, FollowUp, UserSettings, DefaultFollowUpTemplates, JobOpeningAssociatedContact, ContactFormEntry, SubscriptionTier } from '@/lib/types';
import { AddJobOpeningDialog, type AddJobOpeningFormValues, DEFAULT_FOLLOW_UP_CADENCE_DAYS } from './components/AddJobOpeningDialog';
import { EditJobOpeningDialog, type EditJobOpeningFormValues } from './components/EditJobOpeningDialog';
import { JobOpeningList } from './components/JobOpeningList';
import { JobOpeningCard } from './components/JobOpeningCard';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as ShadAlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter as ShadDialogFooter } from '@/components/ui/dialog';

import { useToast } from '@/hooks/use-toast';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabaseClient';
import type { TablesInsert, TablesUpdate } from '@/lib/database.types';
import { isToday, isValid, startOfDay, add, isBefore, format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useCurrentSubscription } from '@/hooks/use-current-subscription';
// getLimitsForTier is no longer needed here, effectiveLimits comes from the hook
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useCounts } from '@/contexts/CountsContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useUserDataCache } from '@/contexts/UserDataCacheContext';
import { JobOpeningsHelpModal } from '@/app/job-openings/components/JobOpeningsHelpModal';


type SortOptionValue = 'nextFollowUpDate_asc' | 'initialEmailDate_desc' | 'initialEmailDate_asc';

const SORT_OPTIONS: { value: SortOptionValue; label: string }[] = [
  { value: 'nextFollowUpDate_asc', label: 'Next Follow-up Date (Earliest First)' },
  { value: 'initialEmailDate_desc', label: 'Initial Email Date (Newest First)' },
  { value: 'initialEmailDate_asc', label: 'Initial Email Date (Oldest First)' },
];

const emailingCycleStatuses: JobOpening['status'][] = ['Emailed', 'Followed Up - Once', 'Followed Up - Twice', 'Followed Up - Thrice'];

async function determineNewJobOpeningStatusOnServer(
  jobOpeningId: string,
  currentJobOpeningStatus: JobOpening['status'],
  userId: string
): Promise<JobOpening['status'] | null> {
  if (!emailingCycleStatuses.includes(currentJobOpeningStatus)) {
    return null;
  }
  const { data: followUps, error: followUpsError } = await supabase
    .from('follow_ups')
    .select('status, created_at, original_due_date')
    .eq('job_opening_id', jobOpeningId)
    .eq('user_id', userId)
    .order('original_due_date', { ascending: true, nullsFirst: true });
  if (followUpsError) return null;
  if (!followUps || followUps.length === 0) return 'Emailed';
  const sentFollowUpsCount = followUps.filter(fu => fu.status === 'Sent').length;
  if (sentFollowUpsCount === 0) return 'Emailed';
  if (sentFollowUpsCount === 1) return 'Followed Up - Once';
  if (sentFollowUpsCount === 2) return 'Followed Up - Twice';
  if (sentFollowUpsCount >= 3) return 'Followed Up - Thrice';
  return currentJobOpeningStatus;
}

export default function JobOpeningsPage() {
  const router = useRouter();
  const { user: currentUser, isLoadingAuth: isLoadingUserAuth, initialAuthCheckCompleted } = useAuth();
  const { counts: globalCounts, incrementCount, decrementCount, setCounts: setGlobalCounts, setIsLoadingCounts: setIsLoadingGlobalCounts } = useCounts();
  const { userSettings } = useUserSettings();
  const { cachedData, isLoadingCache, initialCacheLoadAttempted, updateCachedJobOpening, removeCachedJobOpening, addCachedJobOpening, addCachedCompany, addCachedContact } = useUserDataCache();

  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchInNotes, setSearchInNotes] = useState(true);
  const [sortOption, setSortOption] = useState<SortOptionValue>('nextFollowUpDate_asc');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOpening, setEditingOpening] = useState<JobOpening | null>(null);
  const [openingToDelete, setOpeningToDelete] = useState<JobOpening | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [focusedOpening, setFocusedOpening] = useState<JobOpening | null>(null);
  const focusedOpeningIdFromUrl = searchParams?.get('view');

  const {
    effectiveLimits, // Changed from effectiveTierForLimits
    isInGracePeriod,
    subscriptionLoading,
  } = useCurrentSubscription();

  useEffect(() => {
    if (initialAuthCheckCompleted && currentUser) {
      if (!isLoadingCache && initialCacheLoadAttempted && cachedData) {
        setJobOpenings(cachedData.jobOpenings || []);
        setCompanies(cachedData.companies || []);
        setContacts(cachedData.contacts || []);
      }
    } else if (initialAuthCheckCompleted && !currentUser) {
      setJobOpenings([]);
      setCompanies([]);
      setContacts([]);
    }
  }, [currentUser, initialAuthCheckCompleted, isLoadingCache, initialCacheLoadAttempted, cachedData]);

  const handleAddOpeningClick = useCallback(() => {
    if (!currentUser || subscriptionLoading || isLoadingUserAuth || !initialAuthCheckCompleted) {
      return;
    }
    // Use effectiveLimits directly
    if (globalCounts.jobOpenings >= effectiveLimits.jobOpenings) {
      let message = `You have reached the limit of ${effectiveLimits.jobOpenings} job openings for your current plan.`;
      if (isInGracePeriod && effectiveLimits.jobOpenings < Infinity) {
        message = `Your premium plan has expired, and you've reached the Free Tier limit of ${effectiveLimits.jobOpenings} job openings. Please renew or manage your data.`;
      } else if (effectiveLimits.jobOpenings < Infinity) {
         message = `You've reached the limit of ${effectiveLimits.jobOpenings} job openings for your Premium plan.`;
      }
      toast({ title: 'Limit Reached', description: message, variant: 'destructive' });
      return;
    }
    setIsAddDialogOpen(true);
  }, [currentUser, subscriptionLoading, effectiveLimits, globalCounts.jobOpenings, toast, isInGracePeriod, setIsAddDialogOpen, isLoadingUserAuth, initialAuthCheckCompleted]);

  useEffect(() => {
    const newParam = searchParams?.get('new');
    if (newParam === 'true' && currentUser && !isLoadingUserAuth && initialAuthCheckCompleted) {
      handleAddOpeningClick();
      if (typeof window !== "undefined") {
        router.replace('/job-openings', { scroll: false });
      }
    }
  }, [searchParams, currentUser, router, handleAddOpeningClick, isLoadingUserAuth, initialAuthCheckCompleted]);


  useEffect(() => {
    if (focusedOpeningIdFromUrl && jobOpenings.length > 0) {
      const openingToFocus = jobOpenings.find(op => op.id === focusedOpeningIdFromUrl);
      setFocusedOpening(openingToFocus || null);
    } else if (!focusedOpeningIdFromUrl) {
      setFocusedOpening(null);
    }
  }, [focusedOpeningIdFromUrl, jobOpenings]);

  const handleCloseFocusedOpeningDialog = () => {
    setFocusedOpening(null);
    router.replace('/job-openings', { scroll: false });
  };

  const handleAddNewCompanyToListSupabase = async (companyName: string): Promise<Company | null> => {
    if (!currentUser) return null;
    const trimmedName = companyName.trim();
    if (!trimmedName) { toast({ title: 'Validation Error', description: 'Company name empty.', variant: 'destructive'}); return null; }

    const existingCompany = companies.find(c => c.name.toLowerCase() === trimmedName.toLowerCase() && c.user_id === currentUser.id);
    if (existingCompany) return existingCompany;

    const rpcPayload = { p_user_id: currentUser.id, p_name: trimmedName, p_is_favorite: false };
    const { data: newCompanyId, error } = await supabase.rpc('create_or_update_company', rpcPayload);

    if (error || !newCompanyId) {
        toast({ title: 'Error Adding Company', description: error?.message || "Failed to get company ID.", variant: 'destructive' }); return null;
    }

    const newCompanyForCache: Company = {
        id: newCompanyId,
        user_id: currentUser.id,
        name: trimmedName,
        is_favorite: false,
        created_at: new Date().toISOString(),
    };
    addCachedCompany(newCompanyForCache);
    incrementCount('companies');
    return newCompanyForCache;
  };

  const handleAddNewContactToListSupabase = async (contactName: string, contactEmail?: string, companyId?: string, companyNameCache?: string, linkedinUrl?: string, phone?: string): Promise<Contact | null> => {
    if (!currentUser) return null;
    const trimmedName = contactName.trim();
    const trimmedEmail = contactEmail?.trim() || null;
    const trimmedLinkedin = linkedinUrl?.trim() || null;
    const trimmedPhone = phone?.trim() || null;
    
    if (!trimmedName) { 
        toast({ title: 'Validation Error', description: 'Contact name is required.', variant: 'destructive'}); 
        return null; 
    }
    if (!trimmedEmail && !trimmedLinkedin && !trimmedPhone) {
        toast({ title: 'Validation Error', description: 'At least one of email, LinkedIn, or phone is required.', variant: 'destructive'});
        return null;
    }

    let existingContact: Contact | undefined;
    if (trimmedEmail) {
        existingContact = contacts.find(c => c.email && c.email.toLowerCase() === trimmedEmail.toLowerCase() && c.user_id === currentUser.id);
        if(existingContact) return existingContact;
    }

    const rpcPayload = { 
        p_user_id: currentUser.id, 
        p_name: trimmedName, 
        p_email: trimmedEmail,
        p_linkedin_url: trimmedLinkedin,
        p_phone: trimmedPhone,
        p_company_id: companyId || null, 
        p_company_name: companyNameCache || null, 
        p_is_favorite: false 
    };
    const { data: newContactId, error } = await supabase.rpc('create_or_update_contact_with_company', rpcPayload);


    if (error || !newContactId) {
        toast({ title: 'Error Adding Contact', description: error?.message || "Failed to get contact ID.", variant: 'destructive' }); return null;
    }

    const newContactForCache: Contact = {
        id: newContactId,
        user_id: currentUser.id,
        name: trimmedName,
        email: trimmedEmail || '',
        linkedin_url: trimmedLinkedin,
        phone: trimmedPhone,
        company_id: companyId || null,
        company_name_cache: companyNameCache || (companyId ? companies.find(c=>c.id === companyId)?.name : null),
        tags: [],
        is_favorite: false,
        created_at: new Date().toISOString(),
    };
    addCachedContact(newContactForCache);
    incrementCount('contacts');
    return newContactForCache;
  };

  const handleAddJobOpening = async (values: AddJobOpeningFormValues) => {
    if (!currentUser) {
        toast({ title: 'Authentication Error', description: 'You must be logged in.', variant: 'destructive' });
        return;
    }
    // Use effectiveLimits directly
    if (globalCounts.jobOpenings >= effectiveLimits.jobOpenings) {
        toast({ title: 'Limit Reached', description: `Cannot add. Job opening limit reached.`, variant: 'destructive' });
        setIsAddDialogOpen(false);
        return;
    }

    const contactInputs = values.contacts.map(c => ({
        name: c.contactName,
        email: c.contactEmail || null,
        linkedin_url: c.linkedin_url || null,
        phone: c.phone || null,
    }));

    const followUpInputs = [
        { subject: values.followUp1.subject || null, body: values.followUp1.body || null, due_days_offset: userSettings?.follow_up_cadence_days?.[0] ?? DEFAULT_FOLLOW_UP_CADENCE_DAYS[0] },
        { subject: values.followUp2.subject || null, body: values.followUp2.body || null, due_days_offset: userSettings?.follow_up_cadence_days?.[1] ?? DEFAULT_FOLLOW_UP_CADENCE_DAYS[1] },
        { subject: values.followUp3.subject || null, body: values.followUp3.body || null, due_days_offset: userSettings?.follow_up_cadence_days?.[2] ?? DEFAULT_FOLLOW_UP_CADENCE_DAYS[2] },
    ].filter(fu => fu.due_days_offset != null);

    const rpcPayload = {
      p_user_id: currentUser.id,
      p_company_name: values.companyName,
      p_role_title: values.roleTitle,
      p_initial_email_date: values.initialEmailDate.toISOString(),
      p_job_description_url: values.jobDescriptionUrl || null,
      p_notes: values.notes || null,
      p_is_favorite: false, 
      p_contact_inputs: contactInputs,
      p_follow_up_inputs: followUpInputs,
    };

    setIsAddDialogOpen(false);

    try {
        const { data: newJobOpeningId, error: rpcError } = await supabase.rpc('create_full_job_opening', rpcPayload);

        if (rpcError) {
            throw rpcError;
        }

        if (newJobOpeningId && typeof newJobOpeningId === 'string') {
            let actualCompanyId: string | null = null;
            let actualCompanyName = values.companyName;

            const existingCompany = companies.find(c => c.name.toLowerCase() === values.companyName.toLowerCase());
            if (existingCompany) {
                actualCompanyId = existingCompany.id;
            }

            const newOpeningForCache: JobOpening = {
                id: newJobOpeningId,
                user_id: currentUser.id,
                company_name_cache: actualCompanyName,
                company_id: actualCompanyId,
                role_title: values.roleTitle,
                initial_email_date: startOfDay(new Date(values.initialEmailDate)),
                status: 'Emailed',
                job_description_url: values.jobDescriptionUrl || null,
                notes: values.notes || null,
                is_favorite: false,
                created_at: new Date().toISOString(),
                favorited_at: null,
                associated_contacts: values.contacts.map((c, idx) => {
                    const existingContact = contacts.find(ec => c.contactEmail && ec.email && ec.email.toLowerCase() === c.contactEmail.toLowerCase());
                    return {
                        contact_id: existingContact?.id || `client-temp-contact-${idx}-${Date.now()}`,
                        name: c.contactName,
                        email: c.contactEmail || '',
                        linkedin_url: c.linkedin_url || null,
                        phone: c.phone || null,
                    };
                }),
                followUps: followUpInputs.map((fu, idx) => ({
                    id: `client-temp-fu-${idx}-${Date.now()}`,
                    job_opening_id: newJobOpeningId,
                    follow_up_date: startOfDay(add(new Date(values.initialEmailDate), { days: fu.due_days_offset })),
                    original_due_date: startOfDay(add(new Date(values.initialEmailDate), { days: fu.due_days_offset })),
                    email_subject: fu.subject,
                    email_body: fu.body,
                    status: 'Pending',
                    created_at: new Date().toISOString(),
                })),
            };

            addCachedJobOpening(newOpeningForCache);
            incrementCount('jobOpenings');

            if (!existingCompany && values.companyName) {
                const newCompanyCreatedByRpc = await handleAddNewCompanyToListSupabase(values.companyName);
                if (newCompanyCreatedByRpc && newOpeningForCache.company_id !== newCompanyCreatedByRpc.id) {
                    const updatedOpeningWithCompanyId = {...newOpeningForCache, company_id: newCompanyCreatedByRpc.id, company_name_cache: newCompanyCreatedByRpc.name};
                    updateCachedJobOpening(updatedOpeningWithCompanyId);
                }
            }
            for (const cInput of values.contacts) {
              const contactExistsInCache = contacts.some(ct => ct.email && cInput.contactEmail && ct.email.toLowerCase() === cInput.contactEmail.toLowerCase());
              if (!contactExistsInCache) {
                await handleAddNewContactToListSupabase(cInput.contactName, cInput.contactEmail, actualCompanyId, actualCompanyName, cInput.linkedin_url, cInput.phone);
              }
            }
            toast({ title: "Job Opening Added", description: `${values.roleTitle} has been added.` });
        } else {
             toast({ title: 'Save Error', description: `Failed to create job opening. The database function may have encountered an issue. Please check Supabase Database Logs for [create_full_job_opening] warnings. RPC Data: ${JSON.stringify(newJobOpeningId)}`, variant: 'destructive', duration: 15000 });
        }
    } catch (error: any) {
        let errorMessage = 'An unexpected error occurred while adding the job opening. Check Supabase Database Logs for function warnings (related to "create_full_job_opening") and browser console for details.';

        if (error && typeof error === 'object') {
            const supaError = error as { code?: string; details?: string; hint?: string; message?: string; [key: string]: any };
            if (supaError.message) { errorMessage = `Msg: ${supaError.message}`; }
            else { errorMessage = `Error: ${JSON.stringify(supaError, Object.getOwnPropertyNames(supaError))}`; }
            if (supaError.details) errorMessage += ` Details: ${supaError.details}`;
            if (supaError.hint) errorMessage += ` Hint: ${supaError.hint}`;
            if (supaError.code) errorMessage += ` Code: ${supaError.code}`;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        toast({ title: 'Error Adding Job Opening', description: errorMessage, variant: 'destructive', duration: 15000 });
    }
};

  const handleEditOpening = (opening: JobOpening) => {
    setEditingOpening(opening);
    setIsEditDialogOpen(true);
  };

  const handleUpdateJobOpening = async (formValues: EditJobOpeningFormValues, openingId: string) => {
    if (!currentUser || !openingId) {
        toast({ title: 'Authentication Error', description: 'User not found or opening ID missing.', variant: 'destructive' });
        return;
    }
    const originalOpening = jobOpenings.find(jo => jo.id === openingId);
    if (!originalOpening) {
      toast({title: "Error", description: "Original opening not found for update.", variant: "destructive"});
      return;
    }

    const contactInputs = formValues.contacts.map(c => ({
      id: c.contact_id || null,
      name: c.contactName,
      email: c.contactEmail || null,
      linkedin_url: c.linkedin_url || null,
      phone: c.phone || null,
    }));

    const followUpInputs = [
      { subject: formValues.followUp1.subject || null, body: formValues.followUp1.body || null, due_days_offset: userSettings?.follow_up_cadence_days?.[0] ?? DEFAULT_FOLLOW_UP_CADENCE_DAYS[0] },
      { subject: formValues.followUp2.subject || null, body: formValues.followUp2.body || null, due_days_offset: userSettings?.follow_up_cadence_days?.[1] ?? DEFAULT_FOLLOW_UP_CADENCE_DAYS[1] },
      { subject: formValues.followUp3.subject || null, body: formValues.followUp3.body || null, due_days_offset: userSettings?.follow_up_cadence_days?.[2] ?? DEFAULT_FOLLOW_UP_CADENCE_DAYS[2] },
    ].filter(fu => fu.due_days_offset != null); 

    const rpcPayload = {
        p_user_id: currentUser.id,
        p_job_opening_id: openingId,
        p_company_name: formValues.companyName,
        p_company_id: formValues.company_id || null,
        p_role_title: formValues.roleTitle,
        p_initial_email_date: formValues.initialEmailDate.toISOString(),
        p_status: formValues.status,
        p_job_description_url: formValues.jobDescriptionUrl || null,
        p_notes: formValues.notes || null,
        p_is_favorite: originalOpening.is_favorite || false,
        p_contact_inputs: contactInputs,
        p_follow_up_inputs: followUpInputs,
    };

    setIsEditDialogOpen(false);
    setEditingOpening(null);

    try {
      const { data: updatedJobOpeningId, error: rpcError } = await supabase.rpc('update_new_job_opening', rpcPayload);

      if (rpcError) {
        throw rpcError;
      }

      if (updatedJobOpeningId && typeof updatedJobOpeningId === 'string' && updatedJobOpeningId === openingId) {
        let actualCompanyId = formValues.company_id;
        let actualCompanyName = formValues.companyName;

        if (!actualCompanyId && formValues.companyName) {
            const existingCompany = companies.find(c => c.name.toLowerCase() === formValues.companyName.toLowerCase());
            if (existingCompany) {
                actualCompanyId = existingCompany.id;
            }
        }
        
        const updatedOpeningForCache: JobOpening = {
          ...originalOpening,
          id: updatedJobOpeningId,
          company_name_cache: actualCompanyName,
          company_id: actualCompanyId || null,
          role_title: formValues.roleTitle,
          initial_email_date: startOfDay(new Date(formValues.initialEmailDate)),
          status: formValues.status,
          job_description_url: formValues.jobDescriptionUrl || null,
          notes: formValues.notes || null,
          is_favorite: originalOpening.is_favorite || false,
          associated_contacts: formValues.contacts.map((c, idx) => {
             const existingContact = contacts.find(ec => c.contactEmail && ec.email && ec.email.toLowerCase() === c.contactEmail.toLowerCase());
             return {
                contact_id: c.contact_id || existingContact?.id || `client-temp-contact-${idx}-${Date.now()}`,
                name: c.contactName,
                email: c.contactEmail || '',
                linkedin_url: c.linkedin_url || null,
                phone: c.phone || null,
             };
          }),
          followUps: followUpInputs.map((fu, idx) => {
            const existingFollowUp = originalOpening.followUps?.find(ofu => 
                ofu.email_subject === fu.subject && 
                ofu.email_body === fu.body &&
                add(new Date(formValues.initialEmailDate), { days: fu.due_days_offset }).getTime() === new Date(ofu.original_due_date || ofu.follow_up_date).getTime()
            );
            return {
                id: existingFollowUp?.id || `client-temp-fu-${idx}-${Date.now()}`,
                job_opening_id: updatedJobOpeningId,
                follow_up_date: startOfDay(add(new Date(formValues.initialEmailDate), { days: fu.due_days_offset })),
                original_due_date: startOfDay(add(new Date(formValues.initialEmailDate), { days: fu.due_days_offset })),
                email_subject: fu.subject,
                email_body: fu.body,
                status: existingFollowUp?.status || 'Pending',
                created_at: existingFollowUp?.created_at || new Date().toISOString(),
            };
          }),
        };
        updateCachedJobOpening(updatedOpeningForCache);
        if (focusedOpening && focusedOpening.id === openingId) {
          setFocusedOpening(updatedOpeningForCache);
        }

        if (!formValues.company_id && formValues.companyName && originalOpening.company_name_cache?.toLowerCase() !== formValues.companyName.toLowerCase() && !companies.some(c => c.name.toLowerCase() === formValues.companyName.toLowerCase())) {
            const newCompanyCreatedByRpc = await handleAddNewCompanyToListSupabase(formValues.companyName);
            if (newCompanyCreatedByRpc) {
                const updatedOpeningWithCompanyId = {...updatedOpeningForCache, company_id: newCompanyCreatedByRpc.id, company_name_cache: newCompanyCreatedByRpc.name};
                updateCachedJobOpening(updatedOpeningWithCompanyId);
                if (focusedOpening && focusedOpening.id === openingId) setFocusedOpening(updatedOpeningWithCompanyId);
            }
        }
        for (const cInput of formValues.contacts) {
          const contactExistsInCache = contacts.some(ct => cInput.contactEmail && ct.email && ct.email.toLowerCase() === cInput.contactEmail.toLowerCase());
          if (!cInput.contact_id && !contactExistsInCache) {
            await handleAddNewContactToListSupabase(cInput.contactName, cInput.contactEmail, actualCompanyId, actualCompanyName, cInput.linkedin_url, cInput.phone);
          }
        }

        toast({ title: "Job Opening Updated", description: `${updatedOpeningForCache.role_title} has been updated.`});
      } else {
          toast({title: 'Update Error', description: 'Failed to confirm job opening update from RPC. Please check Supabase Database Logs for warnings.', variant: 'destructive', duration: 10000});
      }
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred while updating. Check Supabase Database Logs for [FN_UPDATE_JO] warnings and browser console for details.';
      if (error && typeof error === 'object') {
            const supaError = error as { code?: string; details?: string; hint?: string; message?: string; [key: string]: any };
            if (supaError.message) errorMessage = `Msg: ${supaError.message}`;
            else errorMessage = `Error: ${JSON.stringify(supaError, Object.getOwnPropertyNames(supaError))}`;
            if (supaError.details) errorMessage += ` Details: ${supaError.details}`;
            if (supaError.hint) errorMessage += ` Hint: ${supaError.hint}`;
            if (supaError.code) errorMessage += ` Code: ${supaError.code}`;
      } else if (typeof error === 'string') {
            errorMessage = error;
      }
      toast({ title: 'Error Updating Job Opening', description: errorMessage, variant: 'destructive', duration: 15000});
    }
  };

  const handleLogFollowUp = async (followUpId: string, jobOpeningId: string) => {
    if (!currentUser) return;
    try {
        const { data: loggedFollowUp, error: logError } = await supabase.from('follow_ups').update({ status: 'Sent', follow_up_date: startOfDay(new Date()).toISOString() }).eq('id', followUpId).eq('user_id', currentUser.id).select().single();
        if (logError) throw logError;

        if (loggedFollowUp) {
            toast({title: 'Follow-up Logged!', description: 'Status updated to Sent.'});
            const currentOpening = jobOpenings.find(jo => jo.id === jobOpeningId);
            const newStatus = currentOpening ? await determineNewJobOpeningStatusOnServer(jobOpeningId, currentOpening.status as JobOpening['status'], currentUser.id) : null;

            let updatedOpeningForCache: JobOpening | undefined;
            setJobOpenings(prev => prev.map(jo => {
                if (jo.id === jobOpeningId) {
                    const updatedFollowUps = (jo.followUps || []).map(fu => fu.id === followUpId ? { ...fu, status: 'Sent' as FollowUp['status'], follow_up_date: startOfDay(new Date()) } : fu);
                    const updatedOpening = { ...jo, followUps: updatedFollowUps, status: (newStatus && newStatus !== jo.status) ? newStatus : jo.status };
                    updatedOpeningForCache = updatedOpening;
                    if (focusedOpening && focusedOpening.id === jobOpeningId) {
                        setFocusedOpening(updatedOpening);
                    }
                    return updatedOpening;
                }
                return jo;
            }));
            if (updatedOpeningForCache) {
              updateCachedJobOpening(updatedOpeningForCache);
            }

             if (newStatus && currentOpening && newStatus !== currentOpening.status) {
                await supabase.from('job_openings').update({ status: newStatus }).eq('id', jobOpeningId).eq('user_id', currentUser.id);
            }
        }
    } catch (error: any) { toast({title: 'Error Logging Follow-up', description: error.message, variant: 'destructive'}); }
  };

  const handleUnlogFollowUp = useCallback(async (followUpIdToUnlog: string, jobOpeningId: string) => {
    if (!currentUser) return;
    try {
      const { data: followUpToUnlog, error: fetchFollowUpError } = await supabase.from('follow_ups').select('original_due_date').eq('id', followUpIdToUnlog).eq('user_id', currentUser.id).single();
      if (fetchFollowUpError || !followUpToUnlog || !followUpToUnlog.original_due_date) { toast({ title: 'Error Unlogging', description: 'Original due date not found.', variant: 'destructive' }); return; }
      const revertedDueDate = startOfDay(new Date(followUpToUnlog.original_due_date));
      const { error: updateError } = await supabase.from('follow_ups').update({ status: 'Pending', follow_up_date: revertedDueDate.toISOString() }).eq('id', followUpIdToUnlog).eq('user_id', currentUser.id);
      if (updateError) throw updateError;

      toast({ title: 'Follow-up Unlogged', description: 'Reverted to pending.' });
      const currentOpening = jobOpenings.find(jo => jo.id === jobOpeningId);
      const newStatus = currentOpening ? await determineNewJobOpeningStatusOnServer(jobOpeningId, currentOpening.status as JobOpening['status'], currentUser.id) : null;

      let updatedOpeningForCache: JobOpening | undefined;
      setJobOpenings(prev => prev.map(jo => {
        if (jo.id === jobOpeningId) {
            const updatedFollowUps = (jo.followUps || []).map(fu => fu.id === followUpIdToUnlog ? { ...fu, status: 'Pending' as FollowUp['status'], follow_up_date: revertedDueDate } : fu);
            const updatedOpening = { ...jo, followUps: updatedFollowUps, status: (newStatus && newStatus !== jo.status) ? newStatus : jo.status };
            updatedOpeningForCache = updatedOpening;
             if (focusedOpening && focusedOpening.id === jobOpeningId) {
                setFocusedOpening(updatedOpening);
            }
            return updatedOpening;
        }
        return jo;
      }));
      if (updatedOpeningForCache) {
        updateCachedJobOpening(updatedOpeningForCache);
      }

      if (newStatus && currentOpening && newStatus !== currentOpening.status) {
         await supabase.from('job_openings').update({ status: newStatus }).eq('id', jobOpeningId).eq('user_id', currentUser.id);
      }
    } catch (error: any) { toast({ title: 'Error Unlogging Follow-up', description: error.message, variant: 'destructive' }); }
  }, [currentUser, toast, jobOpenings, focusedOpening, updateCachedJobOpening]);

  const handleInitiateDeleteOpening = (opening: JobOpening) => {
    setOpeningToDelete(opening); setIsEditDialogOpen(false); setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteOpening = async () => {
    if (!openingToDelete || !currentUser) return;
    try {
      const { error: jobOpeningError } = await supabase.from('job_openings').delete().eq('id', openingToDelete.id).eq('user_id', currentUser.id);
      if (jobOpeningError) throw jobOpeningError;

      removeCachedJobOpening(openingToDelete.id);
      decrementCount('jobOpenings');
      toast({ title: "Job Opening Deleted", description: `${openingToDelete.role_title} removed.`});
    } catch (error: any) { toast({ title: 'Error Deleting Opening', description: error.message, variant: 'destructive'});
    } finally { setOpeningToDelete(null); setIsDeleteConfirmOpen(false); }
  };

  const handleToggleFavorite = async (jobOpeningId: string, currentIsFavorite: boolean) => {
    if (!currentUser) return;
    const newIsFavorite = !currentIsFavorite;
    const { data: updatedData, error } = await supabase
      .from('job_openings')
      .update({ is_favorite: newIsFavorite, favorited_at: newIsFavorite ? new Date().toISOString() : null })
      .eq('id', jobOpeningId)
      .eq('user_id', currentUser.id)
      .select('id, company_name_cache, company_id, role_title, initial_email_date, status, job_description_url, notes, is_favorite, favorited_at, created_at, user_id, associated_contacts:job_opening_contacts(contact_id, contact:contacts(name, email, linkedin_url, phone)), followUps:follow_ups(*)')
      .single();

    if (error) { toast({ title: 'Error Toggling Favorite', description: error.message, variant: 'destructive' }); return; }

    if (updatedData) {
        const transformedOpening = {
            ...updatedData,
            initial_email_date: startOfDay(new Date(updatedData.initial_email_date)),
            favorited_at: updatedData.favorited_at ? new Date(updatedData.favorited_at) : null,
            associated_contacts: (updatedData.associated_contacts as any[] || []).map(joc => ({
                contact_id: joc.contact_id,
                name: joc.contact?.name || 'Unknown Name',
                email: joc.contact?.email || '',
                linkedin_url: joc.contact?.linkedin_url || null,
                phone: joc.contact?.phone || null,
            })),
            followUps: (updatedData.followUps || []).map(fu => ({...fu, follow_up_date: startOfDay(new Date(fu.follow_up_date)), original_due_date: fu.original_due_date ? startOfDay(new Date(fu.original_due_date)) : null})),
        } as JobOpening;
        updateCachedJobOpening(transformedOpening);

        if (focusedOpening && focusedOpening.id === jobOpeningId) {
            setFocusedOpening(transformedOpening);
        }
        toast({ title: newIsFavorite ? 'Added to Favorites' : 'Removed from Favorites'});
    }
  };

  const { actionRequiredOpenings, otherOpenings, allFilteredAndSortedOpenings } = useMemo(() => {
    let filtered = [...jobOpenings];
    if (showOnlyFavorites) filtered = filtered.filter(opening => opening.is_favorite);
    if (searchTerm) {
        filtered = filtered.filter(opening => {
        const term = searchTerm.toLowerCase();
        return opening.company_name_cache.toLowerCase().includes(term) ||
               opening.role_title.toLowerCase().includes(term) ||
               opening.associated_contacts?.some(ac => ac.name.toLowerCase().includes(term) || ac.email.toLowerCase().includes(term)) ||
               opening.status.toLowerCase().includes(term) ||
               (searchInNotes && opening.notes && opening.notes.toLowerCase().includes(term));
        });
    }
    const getNextPendingFollowUpDate = (opening: JobOpening): Date | null => {
      const pendingFollowUps = (opening.followUps || []).filter(fu => fu.status === 'Pending' && isValid(fu.follow_up_date)).sort((a, b) => a.follow_up_date.getTime() - b.follow_up_date.getTime());
      return pendingFollowUps.length > 0 ? pendingFollowUps[0].follow_up_date : null;
    };
    switch (sortOption) {
      case 'initialEmailDate_desc': filtered.sort((a, b) => new Date(b.initial_email_date).getTime() - new Date(a.initial_email_date).getTime()); break;
      case 'initialEmailDate_asc': filtered.sort((a, b) => new Date(a.initial_email_date).getTime() - new Date(b.initial_email_date).getTime()); break;
      case 'nextFollowUpDate_asc':
        filtered.sort((a, b) => {
          const nextA = getNextPendingFollowUpDate(a); const nextB = getNextPendingFollowUpDate(b);
          if (nextA && !nextB) return -1; if (!nextA && nextB) return 1;
          if (!nextA && !nextB) return new Date(b.initial_email_date).getTime() - new Date(a.initial_email_date).getTime();
          return nextA!.getTime() - nextB!.getTime();
        });
        break;
      default: filtered.sort((a, b) => new Date(b.initial_email_date).getTime() - new Date(a.initial_email_date).getTime());
    }
    if (sortOption === 'nextFollowUpDate_asc') {
      const todayStart = startOfDay(new Date());
      const actionReq: JobOpening[] = []; const othersArr: JobOpening[] = [];
      filtered.forEach(opening => {
        const nextFollowUpDate = getNextPendingFollowUpDate(opening);
        if (nextFollowUpDate && isValid(nextFollowUpDate)) {
          const followUpDayStart = startOfDay(nextFollowUpDate);
          if (isToday(followUpDayStart) || isBefore(followUpDayStart, todayStart)) actionReq.push(opening);
          else othersArr.push(opening);
        } else othersArr.push(opening);
      });
      return { actionRequiredOpenings: actionReq, otherOpenings: othersArr, allFilteredAndSortedOpenings: [] };
    }
    return { actionRequiredOpenings: [], otherOpenings: [], allFilteredAndSortedOpenings: filtered };
  }, [jobOpenings, searchTerm, searchInNotes, sortOption, showOnlyFavorites]);

  const clearSearch = () => setSearchTerm('');
  const isAddButtonDisabled = !currentUser || isLoadingCache || subscriptionLoading || (isInGracePeriod && effectiveLimits.jobOpenings < Infinity && globalCounts.jobOpenings >= effectiveLimits.jobOpenings) || isLoadingUserAuth;


  if (isLoadingUserAuth || !initialAuthCheckCompleted) {
    return (<AppLayout><div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div></AppLayout>);
  }

  const pageContentLoading = isLoadingCache && !initialCacheLoadAttempted;

  return (
    <AppLayout>
      <div className="space-y-6" id="job-openings-main-content-area">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Job Openings</h2>
            <p className="text-muted-foreground">Manage your job applications and follow-ups.</p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" onClick={() => setIsHelpModalOpen(true)} disabled={!currentUser || isLoadingUserAuth}>
                <HelpCircle className="mr-2 h-4 w-4" /> Help
            </Button>
            <Button onClick={handleAddOpeningClick} disabled={isAddButtonDisabled} id="add-new-opening-button-jobopenings">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Opening
            </Button>
          </div>
        </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-center">
          <div className="relative flex items-center w-full border border-input rounded-md shadow-sm bg-background sm:col-span-2 md:col-span-1 lg:col-span-2">
            <SearchIcon className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input id="job-openings-search-input" data-tutorial-target="job-openings-search-input" type="text" placeholder="Search openings..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-3 py-2 h-10 flex-grow border-none focus:ring-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" disabled={!currentUser || pageContentLoading || subscriptionLoading} />
            {searchTerm && ( <Button variant="ghost" size="icon" className="absolute right-28 mr-1 h-7 w-7 hover:bg-transparent focus-visible:bg-transparent hover:text-primary" onClick={clearSearch}> <XCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary" /> </Button> )}
            <div className="flex items-center space-x-2 pr-3 border-l border-input h-full pl-3">
              <Checkbox id="searchOpeningNotes" checked={searchInNotes} onCheckedChange={(checked) => setSearchInNotes(checked as boolean)} className="h-4 w-4" disabled={!currentUser || pageContentLoading || subscriptionLoading} />
              <Label htmlFor="searchOpeningNotes" className="text-xs text-muted-foreground whitespace-nowrap">Include Notes</Label>
            </div>
          </div>
          <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOptionValue)} disabled={!currentUser || pageContentLoading || subscriptionLoading}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Sort by..." /></SelectTrigger>
            <SelectContent>{SORT_OPTIONS.map(option => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent>
          </Select>
           <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setShowOnlyFavorites(!showOnlyFavorites)} disabled={!currentUser || pageContentLoading || subscriptionLoading} title={showOnlyFavorites ? "Show All Openings" : "Show Only Favorites"} className={cn("hover:bg-background h-10 w-10", showOnlyFavorites ? "text-yellow-500 bg-background" : "hover:text-muted-foreground")}>
              <Star className={cn("h-5 w-5", showOnlyFavorites ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground")} /> <span className="sr-only">{showOnlyFavorites ? "Show All" : "Show Favorites"}</span>
            </Button>
          </div>
        </div>

        {pageContentLoading ? (
          <div className="flex justify-center items-center py-10"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
        ) : !currentUser ? (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"> <BriefcaseIconLucide className="mr-2 h-5 w-5 text-primary" /> Please Sign In </CardTitle>
            </CardHeader>
            <CardContent> <p className="text-muted-foreground"> You need to be signed in to view and manage job openings. </p> </CardContent>
          </Card>
        ) : (allFilteredAndSortedOpenings.length === 0 && actionRequiredOpenings.length === 0 && otherOpenings.length === 0) && !focusedOpening ? (
          <Card className="shadow-lg"><CardHeader><CardTitle className="font-headline flex items-center"><BriefcaseIconLucide className="mr-2 h-5 w-5 text-primary" />
            {showOnlyFavorites ? "No Favorite Openings Match Filters" : searchTerm ? "No Openings Match Your Search" :
             jobOpenings.length === 0 && initialCacheLoadAttempted ? "No Job Openings Yet" :
             "Loading Openings or No Matches"
            }
            </CardTitle></CardHeader><CardContent><p className="text-muted-foreground">
            {searchTerm || showOnlyFavorites ? "Try adjusting your filters or " : ""}
            {jobOpenings.length === 0 && initialCacheLoadAttempted ? "Click \"Add New Opening\" to get started." : "Clear filters to see all openings."}
            </p></CardContent></Card>
        ) : focusedOpening ? null : (
          sortOption === 'nextFollowUpDate_asc' ? (
            <>
              {actionRequiredOpenings.length > 0 && ( <div className="space-y-3"> <h3 className="text-xl font-semibold text-foreground/90 font-headline">Due Today / Overdue</h3> <JobOpeningList jobOpenings={actionRequiredOpenings} onEditOpening={handleEditOpening} onLogFollowUp={handleLogFollowUp} onUnlogFollowUp={handleUnlogFollowUp} onToggleFavorite={handleToggleFavorite} /> </div> )}
              {actionRequiredOpenings.length > 0 && otherOpenings.length > 0 && ( <Separator className="my-6" /> )}
              {otherOpenings.length > 0 && ( <div className="space-y-3"> <h3 className="text-xl font-semibold text-foreground/90 font-headline">Upcoming Follow-ups</h3> <JobOpeningList jobOpenings={otherOpenings} onEditOpening={handleEditOpening} onLogFollowUp={handleLogFollowUp} onUnlogFollowUp={handleUnlogFollowUp} onToggleFavorite={handleToggleFavorite} /> </div> )}
            </>
          ) : ( <JobOpeningList jobOpenings={allFilteredAndSortedOpenings} onEditOpening={handleEditOpening} onLogFollowUp={handleLogFollowUp} onUnlogFollowUp={handleUnlogFollowUp} onToggleFavorite={handleToggleFavorite} /> )
        )}

        {focusedOpening && (
          <Dialog open={!!focusedOpening} onOpenChange={(open) => { if (!open) handleCloseFocusedOpeningDialog(); }}><DialogContent className="sm:max-w-xl p-0 border-0 shadow-2xl bg-transparent data-[state=open]:sm:zoom-in-90 data-[state=closed]:sm:zoom-out-90"><DialogHeader className="sr-only"><DialogTitle>{focusedOpening.role_title}</DialogTitle><DialogDescription>Details for {focusedOpening.role_title} at {focusedOpening.company_name_cache}</DialogDescription></DialogHeader>
              <JobOpeningCard opening={focusedOpening} onEdit={() => { handleCloseFocusedOpeningDialog(); handleEditOpening(focusedOpening); }} onLogFollowUp={handleLogFollowUp} onUnlogFollowUp={handleUnlogFollowUp} onToggleFavorite={async (id, isFav) => { await handleToggleFavorite(id, isFav); const updatedFocusedOpening = jobOpenings.find(op => op.id === id); if (updatedFocusedOpening) setFocusedOpening(updatedFocusedOpening); else handleCloseFocusedOpeningDialog(); }} isFocusedView={true} />
          </DialogContent></Dialog>
        )}

        <AddJobOpeningDialog isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAddJobOpening={handleAddJobOpening} companies={companies} contacts={contacts} companiesCount={globalCounts.companies} contactsCount={globalCounts.contacts} jobOpeningsCount={globalCounts.jobOpenings} onAddNewCompany={handleAddNewCompanyToListSupabase} onAddNewContact={handleAddNewContactToListSupabase} defaultEmailTemplates={userSettings?.default_email_templates as DefaultFollowUpTemplates | undefined} />
        {editingOpening && ( <EditJobOpeningDialog isOpen={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} onUpdateJobOpening={handleUpdateJobOpening} openingToEdit={editingOpening} onInitiateDelete={handleInitiateDeleteOpening} companies={companies} contacts={contacts} companiesCount={globalCounts.companies} contactsCount={globalCounts.contacts} onAddNewCompany={handleAddNewCompanyToListSupabase} onAddNewContact={handleAddNewContactToListSupabase} /> )}
        <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}><AlertDialogContent><AlertDialogHeader><ShadAlertDialogTitle>Are you sure?</ShadAlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the job opening: <span className="font-semibold"> {openingToDelete?.role_title} at {openingToDelete?.company_name_cache}</span>. All associated follow-up records will also be deleted.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => {setOpeningToDelete(null); setIsDeleteConfirmOpen(false);}}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDeleteOpening} className="bg-destructive hover:bg-destructive/90">Delete Opening</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        <JobOpeningsHelpModal isOpen={isHelpModalOpen} onOpenChange={setIsHelpModalOpen} />
      </div>
    </AppLayout>
  );
}

    