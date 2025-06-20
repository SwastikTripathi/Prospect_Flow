
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const askNameSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100, "Name is too long"),
});

type AskNameFormValues = z.infer<typeof askNameSchema>;

interface AskForNameDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmitName: (name: string) => void; // Simplified: only passes the name
  currentName?: string | null;
  currentEmail?: string | null;
}

export function AskForNameDialog({ isOpen, onOpenChange, onSubmitName, currentName, currentEmail }: AskForNameDialogProps) {
  const form = useForm<AskNameFormValues>({
    resolver: zodResolver(askNameSchema),
    defaultValues: {
      fullName: currentName || '',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({ fullName: currentName || '' });
    }
  }, [isOpen, currentName, form]);

  const handleSubmit = (values: AskNameFormValues) => {
    onSubmitName(values.fullName);
    // Dialog closing is handled by the parent to ensure context is managed correctly
  };

  const handleDialogClose = () => {
    onOpenChange(false); // Form reset will happen on next open via useEffect
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md shadow-xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Name for Invoice</DialogTitle>
          <DialogDescription>
            Please confirm or enter the name you'd like to appear on this invoice.
            This will not change your saved profile name.
          </DialogDescription>
          {currentEmail && (
            <div className="text-xs text-muted-foreground pt-1 text-center sm:text-left">
              For account: {currentEmail}
            </div>
          )}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name for Invoice</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Jane Doe" {...field} autoComplete="name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Use This Name & Generate Invoice
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
