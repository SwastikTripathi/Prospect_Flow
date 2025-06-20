
'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle, Briefcase, Users, Building2, MailCheck, CalendarDays, Star, Settings } from 'lucide-react';

interface JobOpeningsHelpModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function JobOpeningsHelpModal({ isOpen, onOpenChange }: JobOpeningsHelpModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center text-xl">
            <HelpCircle className="mr-2 h-6 w-6 text-primary" />
            Understanding the Job Openings Page
          </DialogTitle>
          <DialogDescription>
            Here's a quick guide to help you get the most out of managing your job applications.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto px-1 text-sm">
          <section>
            <h4 className="font-semibold text-foreground mb-1 flex items-center">
              <Briefcase className="mr-2 h-4 w-4 text-accent" />
              Adding & Viewing Openings
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Click the "Add New Opening" button to track a new job opportunity.</li>
              <li>Each card represents a job opening, showing the role, company, and status.</li>
              <li>Overdue follow-ups will highlight the card border in red.</li>
            </ul>
          </section>

          <section>
            <h4 className="font-semibold text-foreground mb-1 flex items-center">
              <MailCheck className="mr-2 h-4 w-4 text-accent" />
              Managing Follow-ups
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>The "Next Follow-up" date is automatically calculated based on your initial email date and cadence settings.</li>
              <li>Click "Log Follow-up" to mark a pending follow-up as sent. This updates the job status and schedules the next follow-up (if any).</li>
              <li>If you logged a follow-up today by mistake, an "Undo" button (rotate icon) will appear to revert it.</li>
              <li>You can pre-write email templates for each follow-up when adding or editing an opening.</li>
            </ul>
          </section>

          <section>
            <h4 className="font-semibold text-foreground mb-1 flex items-center">
              <Users className="mr-2 h-4 w-4 text-accent" />
              Contacts & Companies
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Link contacts to job openings. If a contact or company doesn't exist, it will be created automatically when you add the job opening.</li>
              <li>Contacts and Companies can be managed separately on their respective pages.</li>
            </ul>
          </section>

          <section>
            <h4 className="font-semibold text-foreground mb-1 flex items-center">
              <Star className="mr-2 h-4 w-4 text-accent" />
              Favorites & Filters
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Mark important openings as "Favorite" using the star icon for quick access from the sidebar.</li>
              <li>Use the search bar to find openings by role, company, contact, or notes.</li>
              <li>Sort openings by next follow-up date or initial email date.</li>
            </ul>
          </section>

           <section>
            <h4 className="font-semibold text-foreground mb-1 flex items-center">
              <Settings className="mr-2 h-4 w-4 text-accent" />
              Customization
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Customize your default follow-up cadence (e.g., 7, 14, 21 days) and default email templates in Account Settings.</li>
            </ul>
          </section>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Got it!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
