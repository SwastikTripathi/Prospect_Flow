
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Users, Search as SearchIcon, Trash2, XCircle, Loader2, Star } from 'lucide-react';
import type { Contact, Company, SubscriptionTier } from '@/lib/types';
import { AddContactDialog, type AddContactFormValues } from './components/AddContactDialog';
import { EditContactDialog, type EditContactFormValues } from './components/EditContactDialog';
import { ContactList } from './components/ContactList';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabaseClient';
import type { TablesInsert, TablesUpdate } from '@/lib/database.types';
import { cn } from '@/lib/utils';
import { useCurrentSubscription } from '@/hooks/use-current-subscription';
// getLimitsForTier is no longer needed here, effectiveLimits comes from the hook
import { useAuth } from '@/contexts/AuthContext';
import { useCounts } from '@/contexts/CountsContext';
import { useUserDataCache } from '@/contexts/UserDataCacheContext';

export default function ContactsPage() {
  const router = useRouter();
  const { user: currentUser, isLoadingAuth: isLoadingUserAuth, initialAuthCheckCompleted } = useAuth();
  const { counts: globalCounts, incrementCount, decrementCount, setCount: setGlobalCount, setIsLoadingCounts: setIsLoadingGlobalCounts } = useCounts();
  const { cachedData, isLoadingCache, initialCacheLoadAttempted, addCachedContact, updateCachedContact, removeCachedContact, addCachedCompany } = useUserDataCache();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInNotes, setSearchInNotes] = useState(true);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const {
    effectiveLimits, // Changed from effectiveTierForLimits
    isInGracePeriod,
    subscriptionLoading,
  } = useCurrentSubscription();

  useEffect(() => {
    if (initialAuthCheckCompleted && currentUser) {
      if (!isLoadingCache && initialCacheLoadAttempted && cachedData) {
        setContacts(cachedData.contacts || []);
        setCompanies(cachedData.companies || []);
      }
    } else if (initialAuthCheckCompleted && !currentUser) {
      setContacts([]);
      setCompanies([]);
    }
  }, [currentUser, initialAuthCheckCompleted, isLoadingCache, initialCacheLoadAttempted, cachedData]);

  useEffect(() => {
    if (searchParams?.get('new') === 'true' && currentUser) {
      handleAddContactClick();
      if (typeof window !== "undefined") {
        router.replace('/contacts', {scroll: false});
      }
    }
  }, [searchParams, currentUser, router]);

  const handleAddContactClick = () => {
    if (!currentUser || subscriptionLoading) return;
    // Use effectiveLimits directly
    if (globalCounts.contacts >= effectiveLimits.contacts) {
      let message = `You have reached the limit of ${effectiveLimits.contacts} contacts for your current plan.`;
       if (isInGracePeriod && effectiveLimits.contacts < Infinity) {
        message = `Your premium plan has expired, and you've reached the Free Tier limit of ${effectiveLimits.contacts} contacts. Please renew or manage your data.`;
      } else if (effectiveLimits.contacts < Infinity) {
         message = `You've reached the limit of ${effectiveLimits.contacts} contacts for your Premium plan.`;
      }
      toast({ title: 'Limit Reached', description: message, variant: 'destructive' });
      return;
    }
    setIsAddDialogOpen(true);
  };

  const handleAddContactSubmit = async (values: AddContactFormValues) => {
    if (!currentUser) {
      toast({ title: 'Authentication Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    // Use effectiveLimits directly
    if (globalCounts.contacts >= effectiveLimits.contacts) {
      toast({ title: 'Limit Reached', description: `Contact limit of ${effectiveLimits.contacts} reached.`, variant: 'destructive'});
      setIsAddDialogOpen(false);
      return;
    }
    
    if (!values.company_id && values.company_name_input && !companies.find(c => c.name.toLowerCase() === values.company_name_input?.toLowerCase())) {
        if (globalCounts.companies >= effectiveLimits.companies) { // Check company limit
            toast({ title: 'Company Limit Reached', description: `Cannot create new company "${values.company_name_input}" via contact. Limit of ${effectiveLimits.companies} companies reached. Add company separately first.`, variant: 'destructive', duration: 7000 });
            return;
        }
    }

    const rpcParams = {
      p_user_id: currentUser.id,
      p_name: values.name,
      p_email: values.email,
      p_role: values.role || null,
      p_phone: values.phone || null,
      p_linkedin_url: values.linkedin_url || null,
      p_notes: values.notes || null,
      p_company_name: values.company_name_input || null, 
      p_company_id: values.company_id || null,          
      p_is_favorite: false, 
    };
    setIsAddDialogOpen(false);

    try {
      const { data: newContactId, error: rpcError } = await supabase.rpc('create_or_update_contact_with_company', rpcParams);

      if (rpcError) throw rpcError;

      if (newContactId && typeof newContactId === 'string') {
        let resolvedCompanyId = values.company_id;
        let resolvedCompanyName = values.company_name_input;

        if (!resolvedCompanyId && resolvedCompanyName) { 
            const existingCompany = companies.find(c => c.name.toLowerCase() === resolvedCompanyName!.toLowerCase());
            if (existingCompany) {
                resolvedCompanyId = existingCompany.id;
            }
        }
        
        const newContactForCache: Contact = {
          id: newContactId,
          user_id: currentUser.id,
          name: values.name,
          email: values.email,
          role: values.role || null,
          phone: values.phone || null,
          linkedin_url: values.linkedin_url || null,
          notes: values.notes || null,
          company_id: resolvedCompanyId || null, 
          company_name_cache: resolvedCompanyName || (resolvedCompanyId ? companies.find(c => c.id === resolvedCompanyId)?.name : null),
          is_favorite: false,
          created_at: new Date().toISOString(),
          tags: [],
        };

        addCachedContact(newContactForCache); 
        incrementCount('contacts');
        
        if (values.company_name_input && !values.company_id && !companies.some(comp => comp.name.toLowerCase() === values.company_name_input!.toLowerCase())) {
            const { data: companyDataFromDb, error: companyFetchError } = await supabase
                .from('companies')
                .select('*')
                .eq('name', values.company_name_input)
                .eq('user_id', currentUser.id)
                .single();
            
            if (!companyFetchError && companyDataFromDb) {
                addCachedCompany(companyDataFromDb as Company); 
                incrementCount('companies'); 
                if (newContactForCache.company_id !== companyDataFromDb.id) {
                    updateCachedContact({...newContactForCache, company_id: companyDataFromDb.id, company_name_cache: companyDataFromDb.name});
                }
            }
        }
          
        toast({ title: "Contact Saved", description: `${newContactForCache.name} has been saved.` });
      } else {
         toast({ title: 'RPC Error', description: 'Failed to get a valid ID from RPC.', variant: 'destructive'});
      }
    } catch (error: any) {
      toast({ title: 'Error Saving Contact', description: error.message || 'Could not save contact.', variant: 'destructive' });
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsEditDialogOpen(true);
  };

  const handleUpdateContactSubmit = async (values: EditContactFormValues, contactId: string) => {
    if (!currentUser) {
      toast({ title: 'Authentication Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    const originalContact = contacts.find(c => c.id === contactId);
    if(!originalContact) return;

    const isPotentiallyCreatingNewCompany = 
        values.company_name_input && 
        !values.company_id && 
        (!originalContact?.company_name_cache || originalContact.company_name_cache.toLowerCase() !== values.company_name_input.toLowerCase()) &&
        !companies.find(c => c.name.toLowerCase() === values.company_name_input?.toLowerCase());

    if (isPotentiallyCreatingNewCompany) {
        if (globalCounts.companies >= effectiveLimits.companies) { // Check company limit
            toast({ title: 'Company Limit Reached', description: `Cannot create new company "${values.company_name_input}" via contact update. Limit of ${effectiveLimits.companies} companies reached. Add company separately first or link to existing.`, variant: 'destructive', duration: 7000 });
            return;
        }
    }

    const rpcParams = {
      p_user_id: currentUser.id,
      p_contact_id: contactId, 
      p_name: values.name,
      p_email: values.email,
      p_role: values.role || null,
      p_phone: values.phone || null,
      p_linkedin_url: values.linkedin_url || null,
      p_notes: values.notes || null,
      p_company_name: values.company_name_input || null,
      p_company_id: values.company_id || null,
      p_is_favorite: contacts.find(c => c.id === contactId)?.is_favorite || false, 
    };
    setIsEditDialogOpen(false);
    setEditingContact(null);

    try {
      const { data: updatedContactId, error: rpcError } = await supabase.rpc('create_or_update_contact_with_company', rpcParams);

      if (rpcError) throw rpcError;

      if (updatedContactId && typeof updatedContactId === 'string' && updatedContactId === contactId) {
        let resolvedCompanyId = values.company_id;
        let resolvedCompanyName = values.company_name_input;

        if (!resolvedCompanyId && resolvedCompanyName) {
            const existingCompany = companies.find(c => c.name.toLowerCase() === resolvedCompanyName!.toLowerCase());
            if (existingCompany) resolvedCompanyId = existingCompany.id;
        }
        
        const updatedContactForCache: Contact = {
            ...(originalContact || {}),
            id: updatedContactId,
            user_id: currentUser.id,
            name: values.name,
            email: values.email,
            role: values.role || null,
            phone: values.phone || null,
            linkedin_url: values.linkedin_url || null,
            notes: values.notes || null,
            company_id: resolvedCompanyId || null,
            company_name_cache: resolvedCompanyName || (resolvedCompanyId ? companies.find(c => c.id === resolvedCompanyId)?.name : originalContact?.company_name_cache),
            is_favorite: originalContact?.is_favorite || false,
            created_at: originalContact?.created_at || new Date().toISOString(),
        };
          
        updateCachedContact(updatedContactForCache); 

        if (values.company_name_input && (!values.company_id || values.company_id !== originalContact.company_id) && !companies.some(comp => comp.name.toLowerCase() === values.company_name_input!.toLowerCase())) {
            const { data: companyDataFromDb, error: companyFetchError } = await supabase
                .from('companies')
                .select('*')
                .eq('name', values.company_name_input)
                .eq('user_id', currentUser.id)
                .single();
            
            if (!companyFetchError && companyDataFromDb) {
                addCachedCompany(companyDataFromDb as Company);
                incrementCount('companies');
                if (updatedContactForCache.company_id !== companyDataFromDb.id) {
                     updateCachedContact({...updatedContactForCache, company_id: companyDataFromDb.id, company_name_cache: companyDataFromDb.name});
                }
            }
        }
          
        toast({ title: "Contact Updated", description: `${updatedContactForCache.name} has been updated.` });
      } else {
         toast({ title: 'RPC Error', description: 'Failed to get a valid confirmation from RPC on update.', variant: 'destructive'});
      }
    } catch (error: any) {
      toast({ title: 'Error Updating Contact', description: error.message || 'Could not update contact.', variant: 'destructive' });
    }
  };

  const handleToggleFavoriteContact = async (contactId: string, currentIsFavorite: boolean) => {
    if (!currentUser) {
      toast({ title: 'Not Authenticated', description: 'Please log in.', variant: 'destructive' });
      return;
    }
    const newIsFavorite = !currentIsFavorite;
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update({ is_favorite: newIsFavorite })
        .eq('id', contactId)
        .eq('user_id', currentUser.id)
        .select('*, company:companies(id, name)') 
        .single();

      if (error) throw error;
      if (data) {
        const updatedContact = {
            ...data,
            company_name_cache: (data.company as any)?.id ? (data.company as any)?.name : data.company_name_cache,
            company_id: (data.company as any)?.id ? (data.company as any)?.id : data.company_id,
        } as Contact;
        updateCachedContact(updatedContact); 
        toast({ title: newIsFavorite ? 'Added to Favorites' : 'Removed from Favorites' });
      }
    } catch (error: any) {
      toast({ title: 'Error Toggling Favorite', description: error.message, variant: 'destructive' });
    }
  };

  const handleInitiateDeleteContact = (contact: Contact) => {
    setContactToDelete(contact);
    setIsEditDialogOpen(false);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteContact = async () => {
    if (!contactToDelete || !currentUser) return;
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactToDelete.id)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      removeCachedContact(contactToDelete.id); 
      decrementCount('contacts');
      toast({ title: "Contact Deleted", description: `${contactToDelete.name} has been removed.` });
    } catch (error: any) {
      toast({ title: 'Error Deleting Contact', description: error.message || 'Could not delete contact.', variant: 'destructive' });
    } finally {
      setContactToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    if (showOnlyFavorites && !contact.is_favorite) {
      return false;
    }
    const term = searchTerm.toLowerCase();
    const nameMatch = contact.name.toLowerCase().includes(term);
    const emailMatch = contact.email.toLowerCase().includes(term);
    const roleMatch = contact.role && contact.role.toLowerCase().includes(term);
    const companyMatch = contact.company_name_cache && contact.company_name_cache.toLowerCase().includes(term);
    const notesMatch = searchInNotes && contact.notes && contact.notes.toLowerCase().includes(term);
    return nameMatch || emailMatch || roleMatch || companyMatch || notesMatch;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const clearSearch = () => setSearchTerm('');
  const isAddButtonDisabled = !currentUser || isLoadingCache || subscriptionLoading || (isInGracePeriod && effectiveLimits.contacts < Infinity && globalCounts.contacts >= effectiveLimits.contacts);

  if (isLoadingUserAuth || !initialAuthCheckCompleted) {
    return (<AppLayout><div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div></AppLayout>);
  }

  const pageContentLoading = isLoadingCache && !initialCacheLoadAttempted;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Contacts</h2>
            <p className="text-muted-foreground">Manage your professional contacts.</p>
          </div>
          <Button onClick={handleAddContactClick} disabled={isAddButtonDisabled}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Contact
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
           <div className="relative flex items-center w-full sm:max-w-md border border-input rounded-md shadow-sm bg-background">
            <SearchIcon className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 py-2 h-10 flex-grow border-none focus:ring-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={!currentUser || pageContentLoading || subscriptionLoading}
            />
             {searchTerm && (
              <Button variant="ghost" size="icon" className="absolute right-28 mr-1 h-7 w-7 hover:bg-transparent focus-visible:bg-transparent hover:text-primary" onClick={clearSearch}>
                <XCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </Button>
            )}
            <div className="flex items-center space-x-2 pr-3 border-l border-input h-full pl-3">
              <Checkbox
                id="searchContactNotes"
                checked={searchInNotes}
                onCheckedChange={(checked) => setSearchInNotes(checked as boolean)}
                className="h-4 w-4"
                disabled={!currentUser || pageContentLoading || subscriptionLoading}
              />
              <Label htmlFor="searchContactNotes" className="text-xs text-muted-foreground whitespace-nowrap">Include Notes</Label>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            disabled={!currentUser || pageContentLoading || subscriptionLoading}
            title={showOnlyFavorites ? "Show All Contacts" : "Show Only Favorites"}
            className={cn(
              "hover:bg-background",
              showOnlyFavorites ? "text-yellow-500 bg-background" : "hover:text-muted-foreground"
            )}
          >
            <Star className={cn("h-5 w-5", showOnlyFavorites ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground")} />
            <span className="sr-only">{showOnlyFavorites ? "Show All" : "Show Favorites"}</span>
          </Button>
        </div>

        {pageContentLoading ? (
          <div className="flex justify-center items-center py-10"> <Loader2 className="h-12 w-12 animate-spin text-primary" /> </div>
        ) : !currentUser ? (
           <Card className="shadow-lg">
            <CardHeader><CardTitle className="font-headline flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />Please Sign In</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">You need to be signed in to view and manage contacts.</p></CardContent>
          </Card>
        ) : filteredContacts.length > 0 ? (
          <ContactList
            contacts={filteredContacts}
            onEditContact={handleEditContact}
            onToggleFavoriteContact={handleToggleFavoriteContact}
          />
        ) : (
           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary" />
                {showOnlyFavorites && searchTerm ? "No Favorite Contacts Match Your Search" :
                 showOnlyFavorites ? "No Favorite Contacts Yet" :
                 searchTerm ? "No Contacts Match Your Search" :
                 contacts.length === 0 && initialCacheLoadAttempted ? "Contact Directory is Empty" :
                 "Loading Contacts or No Matches" 
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {showOnlyFavorites && searchTerm ? "Try adjusting your search or clear the favorites filter." :
                 showOnlyFavorites ? "Mark some contacts as favorite to see them here." :
                 searchTerm ? "Try a different search term or add a new contact." :
                 contacts.length === 0 && initialCacheLoadAttempted ? "No contacts have been added yet. Click \"Add New Contact\" to start building your directory." :
                 "If you have contacts, try adjusting your search filters. Otherwise, add your first contact!"}
              </p>
            </CardContent>
          </Card>
        )}

        <AddContactDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAddContactSubmit={handleAddContactSubmit}
          companies={companies}
        />
        {editingContact && (
          <EditContactDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onUpdateContactSubmit={handleUpdateContactSubmit}
            contactToEdit={editingContact}
            companies={companies}
            onInitiateDelete={handleInitiateDeleteContact}
          />
        )}
        <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the contact
                <span className="font-semibold"> {contactToDelete?.name}</span>.
                Associated job openings will have their contact link removed (contact name/email will be cached).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {setContactToDelete(null); setIsDeleteConfirmOpen(false);}}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDeleteContact} className="bg-destructive hover:bg-destructive/90">
                Delete Contact
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}

    