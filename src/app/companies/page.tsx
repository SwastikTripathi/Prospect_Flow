
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Building2, Search as SearchIcon, Trash2, XCircle, Loader2, Star } from 'lucide-react';
import type { Company, SubscriptionTier } from '@/lib/types';
import { AddCompanyDialog } from './components/AddCompanyDialog';
import { EditCompanyDialog } from './components/EditCompanyDialog';
import { CompanyList } from './components/CompanyList';
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

export default function CompaniesPage() {
  const router = useRouter();
  const { user: currentUser, isLoadingAuth: isLoadingUserAuth, initialAuthCheckCompleted } = useAuth();
  const { counts: globalCounts, incrementCount, decrementCount, setCount: setGlobalCount } = useCounts();
  const { cachedData, isLoadingCache, initialCacheLoadAttempted, addCachedCompany, updateCachedCompany, removeCachedCompany } = useUserDataCache();

  const [companies, setCompanies] = useState<Company[]>([]);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInNotes, setSearchInNotes] = useState(true);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
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
        setCompanies(cachedData.companies || []);
      }
    } else if (initialAuthCheckCompleted && !currentUser) {
      setCompanies([]);
    }
  }, [currentUser, initialAuthCheckCompleted, isLoadingCache, initialCacheLoadAttempted, cachedData]);

  useEffect(() => {
    if (searchParams?.get('new') === 'true' && currentUser) {
      handleAddCompanyClick();
      if (typeof window !== "undefined") {
        router.replace('/companies', {scroll: false});
      }
    }
  }, [searchParams, currentUser, router]); 

  const handleAddCompanyClick = () => {
    if (!currentUser || subscriptionLoading) return;
    // Use effectiveLimits directly
    if (globalCounts.companies >= effectiveLimits.companies) {
      let message = `You have reached the limit of ${effectiveLimits.companies} companies for your current plan.`;
      if (isInGracePeriod && effectiveLimits.companies < Infinity) { // Check if not already unlimited
        message = `Your premium plan has expired, and you've reached the Free Tier limit of ${effectiveLimits.companies} companies. Please renew or manage your data.`;
      } else if (effectiveLimits.companies < Infinity) { // Check if not already unlimited
         message = `You've reached the limit of ${effectiveLimits.companies} companies for your Premium plan.`;
      } else if (effectiveLimits.companies === Infinity) {
        // This case should ideally not be hit if limits are Infinity, but as a safeguard:
        // message = "An unexpected issue occurred with company limits." 
        // Or just proceed if limits are Infinity
        setIsAddDialogOpen(true);
        return;
      }
      toast({ title: 'Limit Reached', description: message, variant: 'destructive' });
      return;
    }
    setIsAddDialogOpen(true);
  };

  const handleAddCompany = async (companyData: Omit<Company, 'id' | 'user_id' | 'created_at' | 'is_favorite'>) => {
    if (!currentUser) {
        toast({ title: 'Authentication Error', description: 'You must be logged in to add a company.', variant: 'destructive'});
        return;
    }
    // Use effectiveLimits directly
    if (globalCounts.companies >= effectiveLimits.companies) {
      toast({ title: 'Limit Reached', description: `Company limit of ${effectiveLimits.companies} reached.`, variant: 'destructive'});
      setIsAddDialogOpen(false);
      return;
    }

    const rpcParams = {
        p_user_id: currentUser.id,
        p_name: companyData.name,
        p_website: companyData.website || null,
        p_linkedin_url: companyData.linkedin_url || null,
        p_notes: companyData.notes || null,
        p_is_favorite: false, 
    };
    setIsAddDialogOpen(false);

    try {
      const { data: newCompanyId, error: rpcError } = await supabase.rpc('create_or_update_company', rpcParams);

      if (rpcError) throw rpcError;

      if (newCompanyId && typeof newCompanyId === 'string') {
        const newCompanyForCache: Company = {
          id: newCompanyId,
          user_id: currentUser.id,
          name: companyData.name,
          website: companyData.website || null,
          linkedin_url: companyData.linkedin_url || null,
          notes: companyData.notes || null,
          is_favorite: false,
          created_at: new Date().toISOString(),
        };
        
        addCachedCompany(newCompanyForCache); 
        incrementCount('companies');
        toast({ title: "Company Saved", description: `${newCompanyForCache.name} has been saved.` });
      } else {
        toast({ title: 'RPC Error', description: 'Failed to get a valid ID from RPC for company.', variant: 'destructive'});
      }
    } catch (error: any) {
      toast({ title: 'Error Saving Company', description: error.message || 'Could not save the company.', variant: 'destructive' });
    }
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setIsEditDialogOpen(true);
  };

  const handleUpdateCompany = async (updatedCompanyFormValues: Company) => {
     if (!currentUser || !updatedCompanyFormValues.id) {
        toast({ title: 'Error', description: 'Invalid operation.', variant: 'destructive'});
        return;
    }
    
    const rpcParams = {
        p_user_id: currentUser.id,
        p_company_id: updatedCompanyFormValues.id, 
        p_name: updatedCompanyFormValues.name,
        p_website: updatedCompanyFormValues.website || null,
        p_linkedin_url: updatedCompanyFormValues.linkedin_url || null,
        p_notes: updatedCompanyFormValues.notes || null,
        p_is_favorite: companies.find(c => c.id === updatedCompanyFormValues.id)?.is_favorite || false,
    };
    setIsEditDialogOpen(false);
    setEditingCompany(null);

    try {
      const { data: updatedCompanyId, error: rpcError } = await supabase.rpc('create_or_update_company', rpcParams);

      if (rpcError) throw rpcError;

      if (updatedCompanyId && typeof updatedCompanyId === 'string' && updatedCompanyId === updatedCompanyFormValues.id) {
        const existingCompany = companies.find(c => c.id === updatedCompanyId);
        const updatedCompanyForCache: Company = {
          ...(existingCompany || {}),
          id: updatedCompanyId,
          user_id: currentUser.id,
          name: updatedCompanyFormValues.name,
          website: updatedCompanyFormValues.website || null,
          linkedin_url: updatedCompanyFormValues.linkedin_url || null,
          notes: updatedCompanyFormValues.notes || null,
          is_favorite: existingCompany?.is_favorite || false, 
          created_at: existingCompany?.created_at || new Date().toISOString(),
        };
            
        updateCachedCompany(updatedCompanyForCache); 
        toast({ title: "Company Updated", description: `${updatedCompanyForCache.name} has been updated.` });
      } else {
         toast({ title: 'RPC Error', description: 'Failed to get a valid confirmation from RPC for company update.', variant: 'destructive'});
      }
    } catch (error: any) {
       toast({ title: 'Error Updating Company', description: error.message || 'Could not update the company.', variant: 'destructive' });
    }
  };

  const handleToggleFavoriteCompany = async (companyId: string, currentIsFavorite: boolean) => {
    if (!currentUser) {
      toast({ title: 'Not Authenticated', description: 'Please log in.', variant: 'destructive' });
      return;
    }
    const newIsFavorite = !currentIsFavorite;
    try {
      const { data, error } = await supabase
        .from('companies')
        .update({ is_favorite: newIsFavorite })
        .eq('id', companyId)
        .eq('user_id', currentUser.id)
        .select('id, name, website, linkedin_url, notes, is_favorite, created_at')
        .single();

      if (error) throw error;
      if (data) {
        const updatedCompany = data as Company;
        updateCachedCompany(updatedCompany); 
        toast({ title: newIsFavorite ? 'Added to Favorites' : 'Removed from Favorites' });
      }
    } catch (error: any) {
      toast({ title: 'Error Toggling Favorite', description: error.message, variant: 'destructive' });
    }
  };

  const handleInitiateDeleteCompany = (company: Company) => {
    setCompanyToDelete(company);
    setIsEditDialogOpen(false);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteCompany = async () => {
    if (!companyToDelete || !currentUser) return;
    try {
      const { error: contactsUpdateError } = await supabase
        .from('contacts')
        .update({ company_id: null, company_name_cache: null })
        .eq('company_id', companyToDelete.id)
        .eq('user_id', currentUser.id);

      // No need to log contactsUpdateError to console

      const { error: jobOpeningsUpdateError } = await supabase
        .from('job_openings')
        .update({ company_id: null, company_name_cache: `(Deleted) ${companyToDelete.name}` })
        .eq('company_id', companyToDelete.id)
        .eq('user_id', currentUser.id);

      // No need to log jobOpeningsUpdateError to console
      
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyToDelete.id)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      
      removeCachedCompany(companyToDelete.id); 
      decrementCount('companies');
      toast({ title: "Company Deleted", description: `${companyToDelete.name} has been removed.` });
    } catch (error: any) {
       toast({ title: 'Error Deleting Company', description: error.message || 'Could not delete the company.', variant: 'destructive' });
    } finally {
        setCompanyToDelete(null);
        setIsDeleteConfirmOpen(false);
    }
  };

  const filteredCompanies = companies.filter(company => {
    if (showOnlyFavorites && !company.is_favorite) {
        return false;
    }
    const term = searchTerm.toLowerCase();
    const nameMatch = company.name.toLowerCase().includes(term);
    const websiteMatch = company.website && company.website.toLowerCase().includes(term);
    const notesMatch = searchInNotes && company.notes && company.notes.toLowerCase().includes(term);
    return nameMatch || websiteMatch || notesMatch;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const clearSearch = () => setSearchTerm('');
  const isAddButtonDisabled = !currentUser || isLoadingCache || subscriptionLoading || (isInGracePeriod && effectiveLimits.companies < Infinity && globalCounts.companies >= effectiveLimits.companies);

  if (isLoadingUserAuth || !initialAuthCheckCompleted) {
    return (<AppLayout><div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div></AppLayout>);
  }
  
  const pageContentLoading = isLoadingCache && !initialCacheLoadAttempted;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Companies</h2>
            <p className="text-muted-foreground">Manage your company directory.</p>
          </div>
          <Button onClick={handleAddCompanyClick} disabled={isAddButtonDisabled}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Company
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex items-center w-full sm:max-w-md border border-input rounded-md shadow-sm bg-background">
            <SearchIcon className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search companies..."
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
                id="searchCompanyNotes"
                checked={searchInNotes}
                onCheckedChange={(checked) => setSearchInNotes(checked as boolean)}
                className="h-4 w-4"
                disabled={!currentUser || pageContentLoading || subscriptionLoading}
              />
              <Label htmlFor="searchCompanyNotes" className="text-xs text-muted-foreground whitespace-nowrap">Include Notes</Label>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            disabled={!currentUser || pageContentLoading || subscriptionLoading}
            title={showOnlyFavorites ? "Show All Companies" : "Show Only Favorites"}
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
            <CardHeader>
              <CardTitle className="font-headline flex items-center"> <Building2 className="mr-2 h-5 w-5 text-primary" /> Please Sign In </CardTitle>
            </CardHeader>
            <CardContent> <p className="text-muted-foreground"> You need to be signed in to view and manage companies. </p> </CardContent>
          </Card>
        ) : filteredCompanies.length > 0 ? (
          <CompanyList
            companies={filteredCompanies}
            onEditCompany={handleEditCompany}
            onToggleFavoriteCompany={handleToggleFavoriteCompany}
          />
        ) : (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline flex items-center">
                <Building2 className="mr-2 h-5 w-5 text-primary" />
                {showOnlyFavorites && searchTerm ? "No Favorite Companies Match Your Search" :
                 showOnlyFavorites ? "No Favorite Companies Yet" :
                 searchTerm ? "No Companies Match Your Search" :
                 companies.length === 0 && initialCacheLoadAttempted ? "Company Directory is Empty" : 
                 "Loading Companies or No Matches" 
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {showOnlyFavorites && searchTerm ? "Try adjusting your search or clear the favorites filter." :
                 showOnlyFavorites ? "Mark some companies as favorite to see them here." :
                 searchTerm ? "Try a different search term or add a new company." :
                 companies.length === 0 && initialCacheLoadAttempted ? "No companies have been added yet. Click \"Add New Company\" to start building your directory." :
                 "If you have companies, try adjusting your search filters. Otherwise, add your first company!"}
              </p>
            </CardContent>
          </Card>
        )}

        <AddCompanyDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAddCompanySubmit={handleAddCompany}
        />
        {editingCompany && (
          <EditCompanyDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onUpdateCompany={handleUpdateCompany}
            companyToEdit={editingCompany}
            onInitiateDelete={handleInitiateDeleteCompany}
          />
        )}
         <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the company
                <span className="font-semibold"> {companyToDelete?.name}</span>.
                Associated contacts and job openings will have their company link removed or updated to reflect deletion.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {setCompanyToDelete(null); setIsDeleteConfirmOpen(false);}}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDeleteCompany} className="bg-destructive hover:bg-destructive/90">
                Delete Company
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}

    