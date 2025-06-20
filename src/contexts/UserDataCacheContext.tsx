
'use client';

import React, { createContext, useContext, useState, type ReactNode, useCallback, useEffect } from 'react';
import type { UserSettings, UserSubscription, Company, Contact, JobOpening, InvoiceRecord, FollowUp, JobOpeningAssociatedContact, AllUserData as AllUserDataInterface } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './AuthContext';
import { format, startOfDay, parseISO } from 'date-fns';

const LAST_FETCH_TIMESTAMP_KEY = 'prospectflow-last-full-data-fetch';
const CACHED_USER_DATA_KEY = 'prospectflow-cached-user-data';
const CACHE_EXPIRY_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export interface UserDataCacheContextType {
  cachedData: AllUserDataInterface | null;
  isLoadingCache: boolean;
  initialCacheLoadAttempted: boolean;
  fetchAndCacheAllUserData: () => Promise<void>;
  clearCache: () => void;
  updateCachedJobOpening: (updatedOpening: JobOpening) => void;
  removeCachedJobOpening: (openingId: string) => void;
  addCachedJobOpening: (newOpening: JobOpening) => void;
  addCachedCompany: (newCompany: Company) => void;
  updateCachedCompany: (updatedCompany: Company) => void;
  removeCachedCompany: (companyId: string) => void;
  setCachedCompanies: (companies: Company[]) => void;
  addCachedContact: (newContact: Contact) => void;
  updateCachedContact: (updatedContact: Contact) => void;
  removeCachedContact: (contactId: string) => void;
  setCachedContacts: (contacts: Contact[]) => void;
  updateCachedUserSettings: (settings: UserSettings) => void;
  updateCachedUserSubscription: (subscription: UserSubscription | null) => void;
  addCachedInvoice: (newInvoice: InvoiceRecord) => void;
}

const UserDataCacheContext = createContext<UserDataCacheContextType | undefined>(undefined);

// Helper to parse dates correctly when loading from localStorage
const parseDatesInRetrievedData = (data: any): AllUserDataInterface => {
  const revivedData = { ...data } as AllUserDataInterface;

  if (revivedData.userSubscription) {
    revivedData.userSubscription.plan_start_date = revivedData.userSubscription.plan_start_date ? parseISO(revivedData.userSubscription.plan_start_date as unknown as string) : null;
    revivedData.userSubscription.plan_expiry_date = revivedData.userSubscription.plan_expiry_date ? parseISO(revivedData.userSubscription.plan_expiry_date as unknown as string) : null;
  }

  if (revivedData.jobOpenings) {
    revivedData.jobOpenings = revivedData.jobOpenings.map(jo => ({
      ...jo,
      initial_email_date: jo.initial_email_date ? startOfDay(parseISO(jo.initial_email_date as unknown as string)) : new Date(),
      favorited_at: jo.favorited_at ? parseISO(jo.favorited_at as unknown as string) : null,
      created_at: jo.created_at ? parseISO(jo.created_at as unknown as string) : new Date().toISOString(),
      followUps: (jo.followUps || []).map(fu => ({
        ...fu,
        follow_up_date: fu.follow_up_date ? startOfDay(parseISO(fu.follow_up_date as unknown as string)) : new Date(),
        original_due_date: fu.original_due_date ? startOfDay(parseISO(fu.original_due_date as unknown as string)) : null,
        created_at: fu.created_at ? parseISO(fu.created_at as unknown as string) : new Date().toISOString(),
      })),
    }));
  }

  if (revivedData.invoices) {
    revivedData.invoices = revivedData.invoices.map(inv => ({
      ...inv,
      // invoice_date is already formatted string, but created_at might have been a Date object
      created_at: inv.created_at ? parseISO(inv.created_at as unknown as string).toISOString() : new Date().toISOString(),
    }));
  }
  
  if (revivedData.companies) {
    revivedData.companies = revivedData.companies.map(c => ({
        ...c,
        created_at: c.created_at ? parseISO(c.created_at as unknown as string).toISOString() : new Date().toISOString(),
    }));
  }

  if (revivedData.contacts) {
    revivedData.contacts = revivedData.contacts.map(c => ({
        ...c,
        created_at: c.created_at ? parseISO(c.created_at as unknown as string).toISOString() : new Date().toISOString(),
    }));
  }
  
  if (revivedData.userSettings) {
    revivedData.userSettings.created_at = revivedData.userSettings.created_at ? parseISO(revivedData.userSettings.created_at as unknown as string).toISOString() : new Date().toISOString();
    revivedData.userSettings.updated_at = revivedData.userSettings.updated_at ? parseISO(revivedData.userSettings.updated_at as unknown as string).toISOString() : new Date().toISOString();
  }

  // privilegedEmails is an array of strings, no date parsing needed.

  return revivedData;
};


export const UserDataCacheProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [cachedData, setCachedData] = useState<AllUserDataInterface | null>(null);
  const [isLoadingCache, setIsLoadingCache] = useState(true); // Start true until first load attempt
  const [initialCacheLoadAttempted, setInitialCacheLoadAttempted] = useState(false);

  const fetchAndCacheAllUserData = useCallback(async () => {
    if (!user) {
      setCachedData(null);
      setInitialCacheLoadAttempted(true);
      setIsLoadingCache(false);
      localStorage.removeItem(CACHED_USER_DATA_KEY);
      localStorage.removeItem(LAST_FETCH_TIMESTAMP_KEY);
      return;
    }

    const lastFetchTimestampStr = localStorage.getItem(LAST_FETCH_TIMESTAMP_KEY);
    const persistedCachedDataStr = localStorage.getItem(CACHED_USER_DATA_KEY);

    if (lastFetchTimestampStr && persistedCachedDataStr) {
      const lastFetchTime = new Date(lastFetchTimestampStr).getTime();
      const currentTime = new Date().getTime();

      if ((currentTime - lastFetchTime) < CACHE_EXPIRY_DURATION_MS) {
        try {
          const parsedPersistedData = JSON.parse(persistedCachedDataStr);
          const dataWithDatesRevived = parseDatesInRetrievedData(parsedPersistedData);
          setCachedData(dataWithDatesRevived);
          setIsLoadingCache(false);
          setInitialCacheLoadAttempted(true);
          return; 
        } catch (e) {
          localStorage.removeItem(CACHED_USER_DATA_KEY); 
          localStorage.removeItem(LAST_FETCH_TIMESTAMP_KEY);
        }
      }
    }

    setIsLoadingCache(true);

    try {
      const [
        userDataRpc,
        privilegedEmailsData
      ] = await Promise.all([
        supabase.rpc('get_all_user_data', { p_user_id: user.id }),
        supabase.from('privileged_users').select('email')
      ]);

      const { data: rpcResponseData, error: rpcError } = userDataRpc;
      if (rpcError) throw rpcError;
      
      const { data: privilegedEmailsList, error: privilegedEmailsError } = privilegedEmailsData;
      if (privilegedEmailsError) throw privilegedEmailsError;


      const rpcResponse = rpcResponseData as any;
      const parsedData: AllUserDataInterface = {
        userSettings: rpcResponse.userSettings ? (rpcResponse.userSettings as UserSettings) : null,
        userSubscription: rpcResponse.userSubscription ? {
            ...(rpcResponse.userSubscription as UserSubscription),
            plan_start_date: rpcResponse.userSubscription.plan_start_date ? new Date(rpcResponse.userSubscription.plan_start_date) : null,
            plan_expiry_date: rpcResponse.userSubscription.plan_expiry_date ? new Date(rpcResponse.userSubscription.plan_expiry_date) : null,
        } : null,
        companies: Array.isArray(rpcResponse.companies) ? rpcResponse.companies as Company[] : [],
        contacts: Array.isArray(rpcResponse.contacts) ? rpcResponse.contacts as Contact[] : [],
        jobOpenings: (Array.isArray(rpcResponse.jobOpenings) ? rpcResponse.jobOpenings : []).map((jo: any) => ({
          ...jo,
          initial_email_date: jo.initial_email_date ? startOfDay(new Date(jo.initial_email_date)) : new Date(),
          favorited_at: jo.favorited_at ? new Date(jo.favorited_at) : null,
          followUps: (Array.isArray(jo.followUps) ? jo.followUps : []).map((fu: any) => ({
            ...fu,
            follow_up_date: fu.follow_up_date ? startOfDay(new Date(fu.follow_up_date)) : new Date(),
            original_due_date: fu.original_due_date ? startOfDay(new Date(fu.original_due_date)) : null,
          } as FollowUp)),
          associated_contacts: Array.isArray(jo.associated_contacts) ? jo.associated_contacts as JobOpeningAssociatedContact[] : [],
        } as JobOpening)),
        invoices: Array.isArray(rpcResponse.invoices) ? (rpcResponse.invoices as InvoiceRecord[]).map(inv => ({
            ...inv,
            invoice_date: inv.invoice_date ? format(new Date(inv.invoice_date), 'PPP') : format(new Date(inv.created_at!), 'PPP'),
        })) : [],
        privilegedEmails: privilegedEmailsList ? privilegedEmailsList.map(item => item.email) : [],
      };
      setCachedData(parsedData);
      localStorage.setItem(CACHED_USER_DATA_KEY, JSON.stringify(parsedData));
      localStorage.setItem(LAST_FETCH_TIMESTAMP_KEY, new Date().toISOString());
    } catch (err: any) {
      // Do not clear existing cache on fetch error
    } finally {
      setIsLoadingCache(false);
      setInitialCacheLoadAttempted(true);
    }
  }, [user]);

  const clearCache = useCallback(() => {
    setCachedData(null);
    setInitialCacheLoadAttempted(false);
    setIsLoadingCache(true); 
    localStorage.removeItem(CACHED_USER_DATA_KEY);
    localStorage.removeItem(LAST_FETCH_TIMESTAMP_KEY);
  }, []);

  const updateCachedJobOpening = useCallback((updatedOpening: JobOpening) => {
    setCachedData(prev => {
      if (!prev) return null;
      const newJobOpenings = prev.jobOpenings.map(jo => jo.id === updatedOpening.id ? updatedOpening : jo);
      const newState = { ...prev, jobOpenings: newJobOpenings };
      localStorage.setItem(CACHED_USER_DATA_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  const removeCachedJobOpening = useCallback((openingId: string) => {
    setCachedData(prev => {
      if (!prev) return null;
      const newJobOpenings = prev.jobOpenings.filter(jo => jo.id !== openingId);
      const newState = { ...prev, jobOpenings: newJobOpenings };
      localStorage.setItem(CACHED_USER_DATA_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);
  
  const addCachedJobOpening = useCallback((newOpening: JobOpening) => {
    setCachedData(prev => {
        const baseState = prev || { userSettings: null, userSubscription: null, companies: [], contacts: [], invoices: [], jobOpenings: [], privilegedEmails: [] };
        const jobOpenings = baseState.jobOpenings || [];
        const newState = { ...baseState, jobOpenings: [newOpening, ...jobOpenings] };
        localStorage.setItem(CACHED_USER_DATA_KEY, JSON.stringify(newState));
        return newState;
    });
  }, []);

  const addCachedCompany = useCallback((newCompany: Company) => {
    setCachedData(prev => {
      const baseState = prev || { userSettings: null, userSubscription: null, companies: [], contacts: [], invoices: [], jobOpenings: [], privilegedEmails: [] };
      const companies = baseState.companies || [];
      const existing = companies.find(c => c.id === newCompany.id);
      let newCompanies;
      if (existing) {
        newCompanies = companies.map(c => c.id === newCompany.id ? newCompany : c);
      } else {
        newCompanies = [...companies, newCompany];
      }
      const newState = { ...baseState, companies: newCompanies.sort((a,b) => a.name.localeCompare(b.name)) };
      localStorage.setItem(CACHED_USER_DATA_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  const updateCachedCompany = useCallback((updatedCompany: Company) => {
    setCachedData(prev => {
      if (!prev || !prev.companies) return prev;
      const newCompanies = prev.companies.map(c => c.id === updatedCompany.id ? updatedCompany : c);
      const newState = { ...prev, companies: newCompanies.sort((a,b) => a.name.localeCompare(b.name)) };
      localStorage.setItem(CACHED_USER_DATA_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  const removeCachedCompany = useCallback((companyId: string) => {
    setCachedData(prev => {
      if (!prev || !prev.companies) return prev;
      const newCompanies = prev.companies.filter(c => c.id !== companyId);
      const newState = { ...prev, companies: newCompanies };
      localStorage.setItem(CACHED_USER_DATA_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  const setCachedCompanies = useCallback((companies: Company[]) => {
    setCachedData(prev => {
        const baseState = prev || { userSettings: null, userSubscription: null, companies: [], contacts: [], invoices: [], jobOpenings: [], privilegedEmails: [] };
        const newState = { ...baseState, companies: [...companies].sort((a,b) => a.name.localeCompare(b.name)) };
        localStorage.setItem(CACHED_USER_DATA_KEY, JSON.stringify(newState));
        return newState;
    });
  }, []);

  const addCachedContact = useCallback((newContact: Contact) => {
    setCachedData(prev => {
      const baseState = prev || { userSettings: null, userSubscription: null, companies: [], contacts: [], invoices: [], jobOpenings: [], privilegedEmails: [] };
      const contacts = baseState.contacts || [];
      const existing = contacts.find(c => c.id === newContact.id);
      let newContacts;
      if (existing) {
        newContacts = contacts.map(c => c.id === newContact.id ? newContact : c);
      } else {
        newContacts = [...contacts, newContact];
      }
      const newState = { ...baseState, contacts: newContacts.sort((a,b) => a.name.localeCompare(b.name)) };
      localStorage.setItem(CACHED_USER_DATA_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  const updateCachedContact = useCallback((updatedContact: Contact) => {
    setCachedData(prev => {
      if (!prev || !prev.contacts) return prev;
      const newContacts = prev.contacts.map(c => c.id === updatedContact.id ? updatedContact : c);
      const newState = { ...prev, contacts: newContacts.sort((a,b) => a.name.localeCompare(b.name)) };
      localStorage.setItem(CACHED_USER_DATA_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  const removeCachedContact = useCallback((contactId: string) => {
    setCachedData(prev => {
      if (!prev || !prev.contacts) return prev;
      const newContacts = prev.contacts.filter(c => c.id !== contactId);
      const newState = { ...prev, contacts: newContacts };
      localStorage.setItem(CACHED_USER_DATA_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  const setCachedContacts = useCallback((contacts: Contact[]) => {
    setCachedData(prev => {
        const baseState = prev || { userSettings: null, userSubscription: null, companies: [], contacts: [], invoices: [], jobOpenings: [], privilegedEmails: [] };
        const newState = { ...baseState, contacts: [...contacts].sort((a,b) => a.name.localeCompare(b.name)) };
        localStorage.setItem(CACHED_USER_DATA_KEY, JSON.stringify(newState));
        return newState;
    });
  }, []);

  const updateCachedUserSettings = useCallback((settings: UserSettings) => {
    setCachedData(prev => {
      if (!prev) return null; 
      const newState = { ...prev, userSettings: settings };
      localStorage.setItem(CACHED_USER_DATA_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  const updateCachedUserSubscription = useCallback((subscription: UserSubscription | null) => {
    setCachedData(prev => {
      if (!prev) return null;
      const newState = { ...prev, userSubscription: subscription };
      localStorage.setItem(CACHED_USER_DATA_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  const addCachedInvoice = useCallback((newInvoice: InvoiceRecord) => {
    setCachedData(prev => {
      const baseState = prev || { userSettings: null, userSubscription: null, companies: [], contacts: [], invoices: [], jobOpenings: [], privilegedEmails: [] };
      const invoices = baseState.invoices || [];
      const newState = { ...baseState, invoices: [newInvoice, ...invoices].sort((a,b) => new Date(b.invoice_date || b.created_at!).getTime() - new Date(a.invoice_date || a.created_at!).getTime()) };
      localStorage.setItem(CACHED_USER_DATA_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  return (
    <UserDataCacheContext.Provider value={{
        cachedData,
        isLoadingCache,
        initialCacheLoadAttempted,
        fetchAndCacheAllUserData,
        clearCache,
        updateCachedJobOpening,
        removeCachedJobOpening,
        addCachedJobOpening,
        addCachedCompany,
        updateCachedCompany,
        removeCachedCompany,
        setCachedCompanies,
        addCachedContact,
        updateCachedContact,
        removeCachedContact,
        setCachedContacts,
        updateCachedUserSettings,
        updateCachedUserSubscription,
        addCachedInvoice,
    }}>
      {children}
    </UserDataCacheContext.Provider>
  );
};

export const useUserDataCache = (): UserDataCacheContextType => {
  const context = useContext(UserDataCacheContext);
  if (context === undefined) {
    throw new Error('useUserDataCache must be used within a UserDataCacheProvider');
  }
  return context;
};


    