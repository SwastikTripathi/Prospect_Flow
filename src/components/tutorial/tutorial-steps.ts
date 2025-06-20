
import type { Step } from 'react-joyride';

// Define the keys for different tutorial sets
export type TutorialKey = 'dashboard' | 'jobOpeningsSetup'; // Add more keys as needed

// Extend the base Step type from react-joyride to include custom properties
export interface TutorialStep extends Step {
  id: string; // Unique identifier for the step within its tutorial set
  pagePath?: string; // Optional: Path where this step should occur
  isClickTriggerStep?: boolean; // If true, Joyride's next button is hidden, user must click target
  hideNextButton?: boolean; // Explicitly hide the "Next" button even if not a click trigger step
  // spotlightClicks can be part of react-joyride's Step type directly, ensure it's used
  // awaitAction?: boolean; // If true, the tutorial waits for an action (e.g., userClickedTutorialTarget) before proceeding
}

// Configuration for all tutorial steps, organized by TutorialKey
export const TUTORIAL_STEPS_CONFIG: Record<TutorialKey, TutorialStep[]> = {
  dashboard: [
    {
      id: 'dashboard-welcome',
      target: '#dashboard-main-content-area', // Ensure this ID exists on the main content area of the dashboard
      content: "Welcome to ProspectFlow! This is your dashboard, your mission control for outreach. Let's take a quick tour.",
      placement: 'center',
      disableBeacon: true,
    },
    {
      id: 'dashboard-sidebar-nav',
      target: '#sidebar-main-nav-group', // Ensure this ID exists on the main navigation group in the sidebar
      content: "Navigate through Job Openings, Contacts, and Companies using these links. This is your main way to get around.",
      placement: 'right',
      spotlight: { padding: -3 }
    },
    {
      id: 'dashboard-sidebar-progress',
      target: '#sidebar-usage-progress', // Ensure this ID exists on the usage progress section in the sidebar
      content: "Keep an eye on your usage here. It shows how many entries you've created against your plan's limits.",
      placement: 'right',
      spotlight: { padding: 5 }
    },
    {
      id: 'dashboard-add-new-opening-btn',
      target: '#dashboard-add-new-opening-button', // Ensure this ID exists on the "Add New Opening" button on the dashboard
      content: "Ready to track a new opportunity? Click here to add a new job opening.",
      placement: 'bottom',
      disableBeacon: true,
      spotlightClicks: true, // Allows click on the target
      isClickTriggerStep: true, // Indicates context should wait for click
      hideFooter: true, // Hides Joyride's default footer/buttons for this step
    },
    {
        id: 'job-openings-search-highlight',
        target: '#job-openings-search-input', // Assuming this ID is on the search input in job-openings page
        content: "You're now on the Job Openings page! Use this search bar to quickly find any opening you've logged.",
        placement: 'bottom',
        pagePath: '/job-openings', // Ensures this step only shows on the correct page
        disableBeacon: true,
    },
    {
        id: 'tutorial-complete-job-openings',
        target: '#job-openings-main-content-area', // A general target on the job openings page
        content: "Great! You've completed the basic tour. You can now start adding and managing your job prospects. Good luck!",
        placement: 'center',
        pagePath: '/job-openings',
        disableBeacon: true,
    }
  ],
  jobOpeningsSetup: [
    // Define steps for the 'jobOpeningsSetup' tutorial here if needed later
    // Example:
    // {
    //   id: 'job-openings-welcome',
    //   target: 'body',
    //   content: "Let's set up your first job opening.",
    //   placement: 'center',
    //   disableBeacon: true,
    // },
  ],
  // Add other tutorial sets here
};
