// src/App.tsx

import { useState, useEffect, useRef } from 'react';
import Joyride from 'react-joyride';
import type { Step } from 'react-joyride';
import { ChatContainer } from './components/chat/ChatContainer';
import AuroraBackground from './components/layout/AuroraBackground';
import './App.css';

function App() {
  const [runTour, setRunTour] = useState(false); // Start as false, will be set to true after mount
  const joyrideHelpersRef = useRef<any>(null);
  
  // Function to manually start the tour
  const handleStartTour = () => {
    console.log('🎯 Manually starting tour...');
    setRunTour(true);
  };

  // Keyboard shortcut for right arrow key to go to next step
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle right arrow when tour is running
      if (runTour && event.key === 'ArrowRight') {
        event.preventDefault();
        event.stopPropagation();
        
        console.log('🎯 Right arrow pressed, helpers:', { 
          hasHelpers: !!joyrideHelpersRef.current,
          hasNext: !!joyrideHelpersRef.current?.next 
        });
        
        // Try using helpers first
        if (joyrideHelpersRef.current?.next) {
          try {
            joyrideHelpersRef.current.next();
            return;
          } catch (error) {
            console.error('Error calling helpers.next():', error);
          }
        }
        
        // Fallback: Find and click the next button by various selectors
        const selectors = [
          'button[data-testid="button-next"]',
          '.react-joyride__button--next',
          'button.react-joyride__button--primary',
          '[role="dialog"] button:last-of-type',
          '.react-joyride__tooltip button:last-of-type'
        ];
        
        for (const selector of selectors) {
          const button = document.querySelector(selector) as HTMLButtonElement;
          if (button && button.textContent && (button.textContent.includes('Next') || button.textContent.includes('Finish'))) {
            console.log('🎯 Found next button with selector:', selector);
            button.click();
            return;
        }
        }
        
        // Last resort: Find all buttons in the tooltip and click the one that says Next
        const tooltip = document.querySelector('.react-joyride__tooltip, [role="dialog"]');
        if (tooltip) {
          const buttons = Array.from(tooltip.querySelectorAll('button'));
          const nextBtn = buttons.find(btn => {
            const text = btn.textContent?.trim() || '';
            return text === 'Next' || text === 'Finish' || text.includes('Next');
          });
          if (nextBtn) {
            console.log('🎯 Found next button in tooltip');
            nextBtn.click();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase on document
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [runTour]);

  const tourSteps: Step[] = [
    {
      target: '[data-tour-id="help-button"]',
      content: "Welcome! Click this Help button anytime to restart this tour. Let's walk through the key features.",
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '[data-tour-id="zip-input"]',
      content: "Start here: tell me your ZIP code so I can pull local prices and rents.",
    },
    {
      target: '[data-tour-id="scenario-card"]',
      content: "This card shows the scenario I'm analyzing. You can edit home price, rent, down payment, or timeframe here.",
    },
    {
      target: '[data-tour-id="save-button"]',
      content: "Save your conversation and charts as a PDF to review later or share with others.",
    },
    {
      target: '[data-tour-id="restart-button"]',
      content: "Start over with a fresh conversation. This clears all your data and charts.",
    },
    {
      target: '[data-tour-id="scenario-toggle-button"]',
      content: "Toggle the scenario card on or off. Use this to show or hide your analysis parameters.",
      placement: 'bottom',
    },
    {
      target: '[data-tour-id="charts-area"]',
      content: "These charts compare rent vs buy, show your net worth, and simulate possible market outcomes. The Core charts are always visible. Click any button to view that chart.",
    },
    {
      target: '[data-tour-id="advanced-charts-toggle"]',
      content: "Click here to expand Advanced Analysis charts. These show risk, volatility, break-even heatmaps, and detailed scenarios for experts. Beginners can stick with the Core charts above.",
      placement: 'top',
    },
    {
      target: '[data-tour-id="chat-area"]',
      content: "Use the chat to ask follow-up questions like \"what if I do 30% down?\" or \"show me the Monte Carlo chart.\"",
    },
  ];

  // Start tour after component mounts to ensure DOM is ready
  useEffect(() => {
    // Check URL parameter to force tour reset
    const urlParams = new URLSearchParams(window.location.search);
    const resetTour = urlParams.get('resetTour');
    
    if (resetTour === 'true') {
      localStorage.removeItem('hasSeenTour');
      console.log('🔄 Tour reset requested via URL parameter');
    }
    
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    console.log('🎯 Tour check:', { hasSeenTour, resetTour });
    
    // Always try to start tour, but check localStorage for persistence
    const startTour = () => {
      // Wait for DOM elements to be ready
      let attempts = 0;
      const maxAttempts = 20; // 10 seconds total (20 * 500ms)
      
      const checkElements = setInterval(() => {
        attempts++;
        const zipInput = document.querySelector('[data-tour-id="zip-input"]');
        const chatArea = document.querySelector('[data-tour-id="chat-area"]');
        
        console.log(`🎯 Tour check attempt ${attempts}:`, { 
          zipInput: !!zipInput, 
          chatArea: !!chatArea 
        });
        
        if (zipInput && chatArea) {
          clearInterval(checkElements);
          console.log('✅ Tour elements found, starting tour...');
          setRunTour(true);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkElements);
          // Start anyway if we've waited long enough
          console.log('⏰ Tour timeout reached, starting tour anyway...');
          setRunTour(true);
        }
      }, 500);
    };
    
    if (!hasSeenTour || resetTour === 'true') {
      console.log('🚀 Starting tour initialization...');
      setTimeout(startTour, 2000); // Give more time for components to render
    } else {
      console.log('ℹ️ Tour already seen. Add ?resetTour=true to URL or run: localStorage.removeItem("hasSeenTour")');
    }
  }, []);

  return (
    <div className="app">
      <AuroraBackground />
      {/* Manual Tour Button - Always available */}
      <button
        onClick={handleStartTour}
        data-tour-id="help-button"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10003, // Higher than Joyride (10000) to stay visible during tour
          padding: '10px 20px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)',
          color: 'white',
          border: '2px solid rgba(139, 92, 246, 0.6)',
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
          transition: 'all 0.2s',
          pointerEvents: 'auto', // Ensure it's always clickable
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(59, 130, 246, 1) 100%)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.5)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)';
        }}
        title="Take a guided tour of the app"
      >
        Help
      </button>
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        disableOverlayClose={false}
        disableScrolling={false}
        spotlightClicks={false}
        scrollOffset={20}
        scrollDuration={500}
        getHelpers={(helpers) => {
          joyrideHelpersRef.current = helpers;
          console.log('🎯 Joyride helpers set:', { hasNext: !!helpers?.next, helpers });
        }}
        callback={(data) => {
          const { action, index, status, type } = data;
          
          // Smooth scrolling callback
          if (type === 'step:after' && (action === 'next' || action === 'prev')) {
            setTimeout(() => {
              const step = tourSteps[index];
              if (step?.target && typeof step.target === 'string') {
                const targetElement = document.querySelector(step.target);
                if (targetElement) {
                  targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }
            }, 250);
          }
          
          // Handle tour completion
          if (status === 'finished' || status === 'skipped') {
            console.log('✅ Tour completed, saved to localStorage');
            localStorage.setItem('hasSeenTour', 'true');
            setRunTour(false);
          }
          if (action === 'skip') {
            console.log('⏭️ Tour skipped');
          }
          if (action === 'close') {
            console.log('❌ Tour closed');
          }
        }}
        locale={{
          back: 'Back',
          close: 'Close',
          last: 'Finish',
          next: 'Next',
          open: 'Open the dialog',
          skip: 'Skip',
        }}
        styles={{
          options: {
            zIndex: 10000,
            primaryColor: '#8b5cf6', // Purple theme
          },
          buttonNext: {
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 600,
            padding: '10px 20px',
            borderRadius: '20px',
            border: '2px solid rgba(139, 92, 246, 0.6)',
            outline: 'none',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
            transition: 'all 0.3s ease',
          },
          buttonBack: {
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.7) 0%, rgba(59, 130, 246, 0.7) 100%)',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 500,
            padding: '10px 20px',
            borderRadius: '20px',
            border: '2px solid rgba(139, 92, 246, 0.5)',
            outline: 'none',
            marginRight: '10px',
            transition: 'all 0.3s ease',
          },
          buttonSkip: {
            color: 'rgba(139, 92, 246, 0.9)',
            fontSize: '14px',
            fontWeight: 500,
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: '2px solid rgba(139, 92, 246, 0.5)',
            borderRadius: '20px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          },
          buttonClose: {
            color: 'rgba(139, 92, 246, 0.9)',
            transition: 'all 0.3s ease',
          },
          spotlight: {
            borderRadius: '12px',
            transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            animation: 'spotlightFadeIn 0.6s ease-out',
            // Make spotlight transparent so element shows through
            backgroundColor: 'transparent',
          },
          tooltip: {
            borderRadius: '12px',
            padding: '20px',
            background: 'rgba(30, 30, 40, 0.95)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            animation: 'tooltipFadeIn 0.65s ease-out',
          },
          tooltipContainer: {
            textAlign: 'left',
            transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          },
          tooltipTitle: {
            color: 'rgba(255, 255, 255, 0.95)',
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '8px',
            transition: 'opacity 0.5s ease',
            animation: 'tooltipFadeIn 0.65s ease-out',
          },
          tooltipContent: {
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '14px',
            lineHeight: '1.5',
            transition: 'opacity 0.5s ease',
            animation: 'tooltipFadeIn 0.65s ease-out 0.1s both',
          },
          overlay: {
            // Very light backdrop - just a subtle dim, not blackout
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            mixBlendMode: 'normal',
            transition: 'opacity 0.5s ease-in-out',
            animation: 'overlayFadeIn 0.5s ease-in-out',
          },
        }}
      />
      <ChatContainer />
    </div>
  );
}

export default App;