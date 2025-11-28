// src/components/onboarding/OnboardingTour.tsx

import { useEffect, useMemo, useState } from 'react';
import Joyride, { type Step, STATUS, EVENTS, ACTIONS } from 'react-joyride';

const STORAGE_KEY_CHAT = 'rentvsbuy_has_seen_chat_tour';
const STORAGE_KEY_CHARTS = 'rentvsbuy_has_seen_charts_tour';

interface OnboardingTourProps {
  activeTab: 'chat' | 'charts';
}

export function OnboardingTour({ activeTab }: OnboardingTourProps) {
  const [run, setRun] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Chat & Setup Tab Tour Steps
  const chatSteps: Step[] = useMemo(
    () => [
      {
        target: '[data-tour-id="phase-one-card"]',
        content: 'Phase 1 shows your local market data. Mention any ZIP or city in the chat to refresh it.',
        disableBeacon: true,
        placement: 'bottom',
      },
      {
        target: '[data-tour-id="basic-inputs-card"]',
        content: 'Phase 2 captures the basics: home price, monthly rent, down payment %, and how long you plan to stay.',
      },
      {
        target: '[data-tour-id="advanced-inputs-card"]',
        content: 'Phase 3 lets you fine-tune assumptions like interest rates, property taxes, and HOA dues.',
      },
      {
        target: '[data-tour-id="analyze-button"]',
        content: 'When you\'re ready, hit Send to share your details and I\'ll run the full analysis.',
        placement: 'top',
      },
      {
        target: '[data-tour-id="charts-tab-button"]',
        content: 'Switch to the Charts Dashboard anytime to see every chart in one place.',
        placement: 'bottom',
      },
    ],
    []
  );

  // Charts Dashboard Tab Tour Steps
  const chartsSteps: Step[] = useMemo(
    () => [
      {
        target: '.chart-grid-item-clickable',
        content: 'Here is your Charts Dashboard! Click any chart to open it, ask AI questions, and export the chart with your insights as a PDF.',
        placement: 'top',
        disableBeacon: true,
        beforeStep: async () => {
          const chartsTab = document.querySelector('[data-tour-id="charts-tab-button"]') as HTMLElement;
          if (chartsTab && !chartsTab.classList.contains('active')) {
            chartsTab.click();
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          await new Promise(resolve => setTimeout(resolve, 150));
          const firstChart = document.querySelector('.chart-grid-item-clickable') as HTMLElement;
          if (firstChart) {
            firstChart.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        },
      },
    ],
    []
  );

  const steps = activeTab === 'chat' ? chatSteps : chartsSteps;

  // Auto-start tour for first-time visitors (only for chat tab)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (activeTab === 'chat') {
      const timer = setTimeout(() => {
        const hasSeenTour = localStorage.getItem(STORAGE_KEY_CHAT);
        if (!hasSeenTour) {
          localStorage.setItem(STORAGE_KEY_CHAT, 'true');
          console.log('[OnboardingTour] Auto-starting tour for first-time visitor');
          setRun(true);
        }
        setIsReady(true);
      }, 1200);

      return () => clearTimeout(timer);
    } else {
      setIsReady(true);
    }
  }, [activeTab]);

  // Log when run state changes
  useEffect(() => {
    console.log('[OnboardingTour] Tour run state changed:', { run, activeTab, stepsCount: steps.length });
  }, [run, activeTab, steps.length]);

  const handleReplay = () => {
    console.log('[OnboardingTour] Replay button clicked, starting tour');
    setRun(false);
    setTimeout(() => {
      setRun(true);
      console.log('[OnboardingTour] Tour started, run state:', true);
    }, 10);
  };

  // Manual arrow key handler - directly click Joyride buttons
  useEffect(() => {
    if (!run) return;

    const handleArrowKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;

      // Check if tour is actually running
      const tooltip = document.querySelector('[class*="react-joyride__tooltip"]') as HTMLElement;
      if (!tooltip) {
        console.log('[OnboardingTour] No tooltip found, ignoring arrow key');
        return;
      }

      // Find all buttons in the tooltip
      const buttons = tooltip.querySelectorAll('button');
      console.log('[OnboardingTour] Found buttons:', buttons.length, Array.from(buttons).map(b => b.textContent));

      if (e.key === 'ArrowRight') {
        // Find the "Next" or last button (skip button is usually first)
        let nextButton: HTMLElement | null = null;
        for (const btn of Array.from(buttons)) {
          const text = btn.textContent?.toLowerCase() || '';
          if (text.includes('next') || text.includes('→') || btn === buttons[buttons.length - 1]) {
            nextButton = btn;
            break;
          }
        }
        
        if (nextButton && !nextButton.disabled) {
          console.log('[OnboardingTour] Clicking next button:', nextButton.textContent);
          e.preventDefault();
          e.stopPropagation();
          nextButton.click();
        } else {
          console.log('[OnboardingTour] Next button not found or disabled');
        }
      } else if (e.key === 'ArrowLeft') {
        // Find the "Back" or "Previous" button
        let backButton: HTMLElement | null = null;
        for (const btn of Array.from(buttons)) {
          const text = btn.textContent?.toLowerCase() || '';
          if (text.includes('back') || text.includes('previous') || text.includes('←')) {
            backButton = btn;
            break;
          }
        }
        
        if (backButton) {
          console.log('[OnboardingTour] Clicking back button:', backButton.textContent);
          e.preventDefault();
          e.stopPropagation();
          backButton.click();
        } else {
          console.log('[OnboardingTour] Back button not found');
        }
      }
    };

    // Use capture phase to intercept before other handlers
    document.addEventListener('keydown', handleArrowKey, true);
    return () => {
      document.removeEventListener('keydown', handleArrowKey, true);
    };
  }, [run]);

  return (
    <>
      <button
        type="button"
        onClick={handleReplay}
        title="Replay the quick tutorial"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10003,
          padding: '10px 18px',
          borderRadius: '999px',
          border: '1px solid rgba(255,255,255,0.18)',
          background: 'rgba(12, 16, 27, 0.6)',
          color: '#f8fafc',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
        }}
      >
        Help
      </button>

      {isReady && (
        <Joyride
          steps={steps}
          run={run}
          continuous
          showSkipButton
          showProgress
          disableScrolling={false}
          scrollToFirstStep
          scrollOffset={40}
          spotlightClicks={false}
          disableCloseOnEsc={false}
          styles={{
            options: {
              zIndex: 10002,
              primaryColor: '#8b5cf6',
            },
            spotlight: {
              borderRadius: '14px',
              backgroundColor: 'rgba(0,0,0,0.3)',
            },
            overlay: {
              backgroundColor: 'rgba(2,6,23,0.55)',
            },
            tooltip: {
              borderRadius: '16px',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(99,102,241,0.35)',
              padding: '20px',
              color: '#f8fafc',
            },
            buttonNext: {
              borderRadius: '999px',
              padding: '8px 18px',
              fontWeight: 600,
            },
            buttonBack: {
              color: 'rgba(148,163,184,0.9)',
              fontWeight: 500,
            },
          }}
          callback={(data) => {
            const { status, action, type, index } = data;
            const stepIndex = index ?? 0;

            // Log all callback events to debug arrow key navigation
            if (action === ACTIONS.NEXT || action === ACTIONS.PREV) {
              console.log(`[Joyride Callback] Navigation action: ${action}`, {
                stepIndex,
                type,
                status,
                action,
                message: action === ACTIONS.NEXT ? 'Moving to next step' : 'Moving to previous step'
              });
            }

            if (type === EVENTS.STEP_AFTER || type === EVENTS.STEP_BEFORE) {
              setCurrentStepIndex(stepIndex);
              console.log(`[Joyride Callback] Step ${type}:`, {
                stepIndex,
                totalSteps: steps.length,
                action
              });
            }

            if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
              console.log(`[Joyride Callback] Tour ${status}`, { stepIndex, action });
              const storageKey = activeTab === 'chat' ? STORAGE_KEY_CHAT : STORAGE_KEY_CHARTS;
              localStorage.setItem(storageKey, 'true');
              setRun(false);
              setCurrentStepIndex(0);
              // Close any open chart insight modals
              if (activeTab === 'charts') {
                const closeButton = document.querySelector('.chart-insight-close') as HTMLElement;
                if (closeButton) {
                  closeButton.click();
                }
              }
            }

            if (action === ACTIONS.CLOSE) {
              console.log('[Joyride Callback] Tour closed by user', { stepIndex });
              setRun(false);
              setCurrentStepIndex(0);
              // Close any open chart insight modals
              if (activeTab === 'charts') {
                const closeButton = document.querySelector('.chart-insight-close') as HTMLElement;
                if (closeButton) {
                  closeButton.click();
                }
              }
            }
          }}
        />
      )}
    </>
  );
}

