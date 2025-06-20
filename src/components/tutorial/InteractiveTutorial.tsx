
'use client';

import React, { useEffect, useState, useRef } from 'react';
import Joyride, { type CallBackProps, type Step, typeBeaconRenderProps, typeTooltipRenderProps } from 'react-joyride';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import Link from 'next/link'; // Added for programmatic navigation if needed
import { useRouter } from 'next/navigation'; // Added

interface ExtendedStep extends Step {
  isClickableSpotlightLink?: boolean;
}

interface InteractiveTutorialProps {
  run: boolean;
  steps: ExtendedStep[];
  onJoyrideCallback: (data: CallBackProps) => void;
  onSkipTutorialRequest: () => void;
  onFinalStepAction?: () => void; // Callback for when the custom link is clicked
}

const BeaconComponent: React.FC<typeBeaconRenderProps> = ({ continuous, index, isLastStep, size, step, ...rest }) => (
  <button
    {...rest}
    type="button"
    className="react-joyride__beacon"
    aria-label={`Start tutorial from step ${index + 1}`}
    title={`Start tutorial from step ${index + 1}`}
  >
    <span />
  </button>
);

const TooltipComponent: React.FC<typeTooltipRenderProps> = ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  isLastStep,
}) => (
  <div {...tooltipProps} className="bg-card text-card-foreground p-6 rounded-lg shadow-xl w-96 max-w-sm">
    {step.title && <h4 className="text-lg font-semibold font-headline mb-2 text-foreground">{step.title}</h4>}
    <div className="text-sm text-muted-foreground leading-relaxed">{step.content}</div>
    <div className="mt-4 flex justify-between items-center">
      <div> 
        {index > 0 && !(step as ExtendedStep).isClickableSpotlightLink && !(step.hideFooter) && ( 
          <Button {...backProps} variant="outline" size="sm">
            Back
          </Button>
        )}
      </div>
      {!(step.hideFooter) && !(step as ExtendedStep).isClickableSpotlightLink && (
        <div className="flex items-center space-x-2"> 
          {continuous && !isLastStep && (
            <Button {...primaryProps} variant="default" size="sm">
              Next
            </Button>
          )}
          {continuous && isLastStep && (
             <Button {...primaryProps} variant="default" size="sm">
              Finish
            </Button>
          )}
        </div>
      )}
    </div>
  </div>
);


export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  run,
  steps,
  onJoyrideCallback,
  onSkipTutorialRequest,
  onFinalStepAction, 
}) => {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [clickableLinkPosition, setClickableLinkPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const targetRef = useRef<HTMLElement | null>(null);

  const joyrideCallback = (data: CallBackProps) => {
    const { index, type, step } = data;
    if (type === 'step:after' || type === 'step:before') {
      setCurrentStepIndex(index);
      if (step && (step as ExtendedStep).isClickableSpotlightLink && step.target) {
        const targetElement = document.querySelector(step.target as string);
        if (targetElement) {
          targetRef.current = targetElement as HTMLElement;
        } else {
          targetRef.current = null;
        }
      } else {
        targetRef.current = null;
      }
    }
    onJoyrideCallback(data);
  };

  useEffect(() => {
    if (run && targetRef.current && steps[currentStepIndex]?.isClickableSpotlightLink) {
      const rect = targetRef.current.getBoundingClientRect();
      setClickableLinkPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setClickableLinkPosition(null);
    }
  }, [run, currentStepIndex, steps]);

  useEffect(() => {
    const dashboardLinkEl = document.querySelector('#sidebar-nav-dashboard');
    const contactsLinkEl = document.querySelector('#sidebar-nav-contacts');
  
    const isLastStepActive = run && currentStepIndex === steps.length - 1;
  
    if (isLastStepActive) {
      if (dashboardLinkEl) (dashboardLinkEl as HTMLElement).style.pointerEvents = 'none';
      if (contactsLinkEl) (contactsLinkEl as HTMLElement).style.pointerEvents = 'none';
    } else {
      if (dashboardLinkEl) (dashboardLinkEl as HTMLElement).style.pointerEvents = '';
      if (contactsLinkEl) (contactsLinkEl as HTMLElement).style.pointerEvents = '';
    }
  
    // Cleanup function to ensure styles are reverted if component unmounts
    // or if the step changes away from the last one.
    return () => {
      if (dashboardLinkEl) (dashboardLinkEl as HTMLElement).style.pointerEvents = '';
      if (contactsLinkEl) (contactsLinkEl as HTMLElement).style.pointerEvents = '';
    };
  }, [run, currentStepIndex, steps.length]);


  const handleCustomLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFinalStepAction) {
      onFinalStepAction();
    }
  };
  
  const currentStep = steps[currentStepIndex];
  const showCustomClickableLink = run && currentStep?.isClickableSpotlightLink && clickableLinkPosition;

  return (
    <>
      <Joyride
        run={run}
        steps={steps}
        continuous
        showProgress
        showSkipButton={!showCustomClickableLink} // Hide skip if custom link is shown
        scrollToFirstStep
        disableScrollParentFix={false} 
        disableScrolling={true}
        disableOverlayClose={true}
        disableCloseOnEsc={false}
        styles={{
          options: {
            arrowColor: 'var(--joyride-arrow-color)',
            backgroundColor: 'var(--joyride-tooltip-background-color)',
            overlayColor: 'var(--joyride-overlay-color)',
            primaryColor: 'var(--joyride-tooltip-primary-button-background-color)',
            textColor: 'var(--joyride-tooltip-text-color)',
            zIndex: 10000, 
          },
          beaconInner: {
            backgroundColor: 'var(--joyride-beacon-inner-color)',
          },
          beaconOuter: {
            backgroundColor: 'var(--joyride-beacon-outer-color)',
            borderColor: 'var(--joyride-beacon-inner-color)',
          },
          spotlight: {
            padding: currentStep?.spotlight?.padding ?? 0, 
            borderRadius: 6,
          },
        }}
        callback={joyrideCallback} 
        tooltipComponent={TooltipComponent}
      />
      {showCustomClickableLink && clickableLinkPosition && (
        <div
          style={{
            position: 'absolute',
            top: `${clickableLinkPosition.top}px`,
            left: `${clickableLinkPosition.left}px`,
            width: `${clickableLinkPosition.width}px`,
            height: `${clickableLinkPosition.height}px`,
            zIndex: 10005, 
            cursor: 'pointer',
            clipPath: 'inset(8px 0px)', 
          }}
          onClick={handleCustomLinkClick}
          aria-label="Navigate to Job Openings"
          role="button"
        />
      )}
      {run && !showCustomClickableLink && ( 
        <Button
          onClick={onSkipTutorialRequest}
          variant="ghost"
          size="sm"
          className="fixed bottom-4 right-4 z-[10001] bg-card text-card-foreground shadow-lg hover:bg-muted hover:text-muted-foreground border border-border text-xs px-3 py-1.5 h-auto"
          aria-label="Skip Tutorial"
        >
          Skip Tutorial
        </Button>
      )}
    </>
  );
};

