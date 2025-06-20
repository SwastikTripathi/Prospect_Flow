
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, HelpCircle, Check, ChevronsUpDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { UserSettings, UsagePreference } from '@/lib/types';
import type { TablesInsert, TablesUpdate } from '@/lib/database.types';
import { DEFAULT_FOLLOW_UP_CADENCE_DAYS } from '@/app/job-openings/components/AddJobOpeningDialog';
import { cn } from '@/lib/utils';


const AGE_RANGES = ["Under 18", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD", "CNY", "SGD", "ZAR", "Other"];
const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Transgender", "Genderqueer / Gender non-conforming", "Prefer to self-describe", "Prefer not to say"];
const MANAGEMENT_METHODS = [
    "Manually through email (e.g. Gmail, Outlook)",
    "Using spreadsheets (Google Sheets, Excel, etc.)",
    "With a CRM (like HubSpot, Zoho, Salesforce)",
    "Using LinkedIn messages",
    "Through cold email tools (e.g. Lemlist, Instantly)",
    "WhatsApp or other messaging apps",
    "I have a virtual assistant or team handling it",
    "Using job platforms (like Indeed, Naukri, etc.)",
    "I don’t have a system – it’s ad hoc",
    "I’m not actively doing outreach right now",
];
const OUTREACH_VOLUMES = ["1-10 per week", "11-25 per week", "26-50 per week", "51-100 per week", "100+ per week", "Prefer not to say"];
const HOW_HEARD_OPTIONS = ["Google Search", "LinkedIn", "Instagram", "Word of Mouth", "Product Hunt", "Twitter (X)", "Reddit", "Blog or Article", "Webinar or Online Event", "YouTube", "Other"];


const onboardingSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(30, "Name too long (max 30 characters)"),
  ageRange: z.string().min(1, "Age range is required"),
  country: z.string().min(1, "Country is required").max(30, "Country name too long (max 30 characters)"),
  annualIncome: z.coerce.number().min(0, "Income cannot be negative").optional().or(z.literal('')),
  incomeCurrency: z.string().optional(),
  currentRole: z.string().min(1, "Current role is required").max(30, "Role name too long (max 30 characters)"),
  currentManagementMethod: z.array(z.string()).optional().default([]),
  outreachVolume: z.string().optional(),
  gender: z.string().optional(),
  genderSelfDescribe: z.string().max(15, "Description too long (max 15 characters)").optional(),
  howHeard: z.string().min(1, "This field is required"),
}).refine(data => !(data.gender === "Prefer to self-describe" && !data.genderSelfDescribe?.trim()), {
  message: "Please specify your gender or choose another option.",
  path: ["genderSelfDescribe"],
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

interface OnboardingFormProps {
  user: User;
  userId: string;
  userEmail?: string | null;
  initialFullName?: string | null;
  existingSettings: UserSettings | null;
  onOnboardingFormComplete: () => void;
}

export function OnboardingForm({
  user,
  userId,
  userEmail,
  initialFullName,
  existingSettings,
  onOnboardingFormComplete
}: OnboardingFormProps) {
  const { toast } = useToast();
  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: existingSettings?.full_name || initialFullName || '',
      ageRange: existingSettings?.age_range || '',
      country: existingSettings?.country || '',
      annualIncome: existingSettings?.annual_income === null || existingSettings?.annual_income === undefined ? '' : existingSettings.annual_income,
      incomeCurrency: existingSettings?.income_currency || 'Prefer not to say',
      currentRole: existingSettings?.current_role || '',
      currentManagementMethod: (Array.isArray(existingSettings?.current_management_method) ? existingSettings.current_management_method : []) || [],
      outreachVolume: existingSettings?.outreach_volume || 'Prefer not to say',
      gender: existingSettings?.gender || 'Prefer not to say',
      genderSelfDescribe: existingSettings?.gender_self_describe || '',
      howHeard: existingSettings?.how_heard || '',
    },
  });

  const watchedGender = form.watch("gender");
  const [managementMethodPopoverOpen, setManagementMethodPopoverOpen] = useState(false);


  const attemptSaveSettings = async (values: OnboardingFormValues) => {
    if (!userId) {
      toast({ title: 'Authentication Error', description: 'User ID is missing.', variant: 'destructive' });
      return;
    }

    const settingsPayload: Partial<UserSettings> & { user_id: string } = {
      user_id: userId,
      full_name: values.fullName,
      age_range: values.ageRange,
      country: values.country,
      annual_income: values.annualIncome === '' ? null : Number(values.annualIncome),
      income_currency: values.incomeCurrency === 'Prefer not to say' ? null : values.incomeCurrency,
      current_role: values.currentRole,
      usage_preference: existingSettings?.usage_preference || 'job_hunt',
      follow_up_cadence_days: existingSettings?.follow_up_cadence_days || DEFAULT_FOLLOW_UP_CADENCE_DAYS,
      default_email_templates: existingSettings?.default_email_templates || {
        followUp1: { subject: '', openingLine: '' },
        followUp2: { subject: '', openingLine: '' },
        followUp3: { subject: '', openingLine: '' },
        sharedSignature: '',
      },
      onboarding_complete: false,
      current_management_method: values.currentManagementMethod && values.currentManagementMethod.length > 0 ? values.currentManagementMethod : null,
      outreach_volume: values.outreachVolume === 'Prefer not to say' ? null : values.outreachVolume,
      gender: values.gender === 'Prefer not to say' ? null : values.gender,
      gender_self_describe: values.gender === 'Prefer to self-describe' ? values.genderSelfDescribe : null,
      how_heard: values.howHeard,
    };

    try {
        const { error } = await supabase
            .from('user_settings')
            .upsert(settingsPayload as TablesUpdate<'user_settings'>, { onConflict: 'user_id' });
        
        if (error) {
            toast({
                title: 'Onboarding Save Failed',
                description: `Could not save your information. ${error.message || 'Please try again.'}`,
                variant: 'destructive',
                duration: 7000,
            });
            return;
        }

        if (user.user_metadata?.full_name !== values.fullName) {
            const { error: userUpdateError } = await supabase.auth.updateUser({
                data: { full_name: values.fullName }
            });
            if (userUpdateError) {
            }
        }
        onOnboardingFormComplete();

    } catch (error: any) {
      toast({
        title: 'Onboarding Save Failed',
        description: error.message || "An unexpected error occurred.",
        variant: 'destructive',
        duration: 10000,
      });
    }
  };

  const TooltipLabel: React.FC<{ label: string, tooltipText?: string, showTooltipIcon?: boolean }> = ({ label, tooltipText, showTooltipIcon = false }) => (
    <div className="flex items-center">
      <FormLabel>{label}</FormLabel>
      {showTooltipIcon && tooltipText && (
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="ml-1.5 h-3.5 w-3.5 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );


  return (
    <Dialog open={true} onOpenChange={() => {}}> {/* Controlled by AppLayout */}
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Welcome to ProspectFlow!</DialogTitle>
          <DialogDescription>
            Let's get you set up. Please tell us a bit about yourself.
            {userEmail && (<span className="block text-xs mt-1 text-muted-foreground">For account: {userEmail}</span>)}
          </DialogDescription>
        </DialogHeader>
        <TooltipProvider delayDuration={0}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(attemptSaveSettings)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-2">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <TooltipLabel label="Full Name" />
                    <FormControl><Input placeholder="Your full name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentRole"
                render={({ field }) => (
                  <FormItem>
                    <TooltipLabel label="Current Role/Profession" />
                    <FormControl><Input placeholder="e.g., Software Engineer, Sales Manager" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ageRange"
                  render={({ field }) => (
                    <FormItem>
                      <TooltipLabel label="Age Range" />
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select your age range" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {AGE_RANGES.map(range => <SelectItem key={range} value={range}>{range}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                       <TooltipLabel label="Country of Residence" />
                      <FormControl><Input placeholder="e.g., United States" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="annualIncome"
                  render={({ field }) => (
                    <FormItem>
                      <TooltipLabel label="Annual Income (Optional)" tooltipText="This helps us tailor features and content that are more aligned with your goals and needs. It also supports anonymized analytics to improve the platform for all users." showTooltipIcon={true} />
                      <FormControl><Input type="number" placeholder="e.g., 50000" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="incomeCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <TooltipLabel label="Income Currency (Optional)" />
                      <Select onValueChange={field.onChange} value={field.value || 'Prefer not to say'}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {CURRENCIES.map(currency => <SelectItem key={currency} value={currency}>{currency}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="currentManagementMethod"
                render={({ field }) => (
                  <FormItem>
                    <TooltipLabel label="How are you currently managing your outreach and follow-ups?" />
                     <Popover open={managementMethodPopoverOpen} onOpenChange={setManagementMethodPopoverOpen}>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                    "w-full justify-between",
                                    !field.value?.length && "text-muted-foreground"
                                    )}
                                >
                                    {field.value?.length
                                    ? field.value.length === 1 ? field.value[0] : `${field.value.length} methods selected`
                                    : "Select methods..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                {/* CommandInput removed */}
                                <CommandList>
                                    <CommandEmpty>No methods found.</CommandEmpty>
                                    <CommandGroup>
                                    {MANAGEMENT_METHODS.map((method) => {
                                        const isSelected = field.value?.includes(method);
                                        return (
                                        <CommandItem
                                            key={method}
                                            value={method}
                                            onSelect={() => {
                                                const currentSelection = field.value || [];
                                                if (isSelected) {
                                                    field.onChange(currentSelection.filter(item => item !== method));
                                                } else {
                                                    field.onChange([...currentSelection, method]);
                                                }
                                                // Do not close popover: setManagementMethodPopoverOpen(false);
                                            }}
                                        >
                                            <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                isSelected ? "opacity-100" : "opacity-0"
                                            )}
                                            />
                                            {method}
                                        </CommandItem>
                                        );
                                    })}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <FormField
                control={form.control}
                name="outreachVolume"
                render={({ field }) => (
                  <FormItem>
                    <TooltipLabel label="Roughly how many new people/opportunities do you reach out to each week?" />
                    <Select onValueChange={field.onChange} value={field.value || 'Prefer not to say'}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select volume" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {OUTREACH_VOLUMES.map(volume => <SelectItem key={volume} value={volume}>{volume}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <TooltipLabel label="Gender (Optional)" tooltipText="We ask this to better understand our users and ensure we're building inclusive, relevant experiences for everyone. Your response helps us serve you better." showTooltipIcon={true}/>
                    <Select onValueChange={field.onChange} value={field.value || 'Prefer not to say'}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {GENDER_OPTIONS.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedGender === "Prefer to self-describe" && (
                <FormField
                  control={form.control}
                  name="genderSelfDescribe"
                  render={({ field }) => (
                    <FormItem>
                      <TooltipLabel label="Please specify your gender" />
                      <FormControl><Input placeholder="Your gender identity" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="howHeard"
                render={({ field }) => (
                  <FormItem>
                    <TooltipLabel label="How did you hear about us?" />
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {HOW_HEARD_OPTIONS.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save & Continue
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}

