// src/components/chat/ChatContainer.tsx

import { useState, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { NetWorthChart } from '../charts/NetWorthChart';
import { calculateNetWorthComparison, calculateBuyingCosts, calculateRentingCosts, getTimelineBasedRates } from '../../lib/finance/calculator';
import { getLocationData, formatLocationData, detectZipCode, type FormattedLocationData } from '../../lib/location/zipCodeService';
import type { ScenarioInputs, MonthlySnapshot } from '../../types/calculator';
import { MonthlyCostChart } from '../charts/MonthlyCostChart';
import { TotalCostChart } from '../charts/TotalCostChart';
import { getAIResponse, openai } from '../../lib/ai/openai';
import { EquityBuildupChart } from '../charts/EquityBuildupChart';
import { RentGrowthChart } from '../charts/RentGrowthChart';
import { BreakEvenChart } from '../charts/BreakEvenChart';
import { getZIPBasedRates } from '../../lib/finance/calculator';
import { SuggestionChips } from './SuggestionChips';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  chartToShow?: 'netWorth' | 'monthlyCost' | 'totalCost' | 'equity' | 'rentGrowth' | 'breakEven';
  // Store chart data with the message so it doesn't change when new scenarios are calculated
  snapshotData?: {
    chartData: MonthlySnapshot[];
    monthlyCosts: {
      buying: any;
      renting: any;
    };
    totalCostData: {
      buyerFinalNetWorth: number;
      renterFinalNetWorth: number;
      totalBuyingCosts: number;
      totalRentingCosts: number;
      finalHomeValue: number;
      finalInvestmentValue: number;
    };
    // Store the input values that created this chart
    inputValues: {
      homePrice: number;
      monthlyRent: number;
      downPaymentPercent: number;
    };
  };
}

interface UserData {
  homePrice: number | null;
  monthlyRent: number | null;
  downPaymentPercent: number | null;
  timeHorizonYears: number | null;
}

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
        content: "Welcome! I'm your AI-powered financial advisor, here to help you make the smartest decision between buying and renting. I'll analyze your specific situation and show you exactly how your money will grow over time."
      },
      {
        id: '2',
        role: 'assistant',
        content: "Let's get started! What's the home price you're considering and your current monthly rent?\n\nPro tip: You can also enter a ZIP code (like 90210) and I'll pull real local market data for that area!"
    }
  ]);
  
  const [userData, setUserData] = useState<UserData>({
    homePrice: null,
    monthlyRent: null,
    downPaymentPercent: null,
    timeHorizonYears: null
  });
  
  const [chartData, setChartData] = useState<MonthlySnapshot[] | null>(null);
  // Track which charts are visible
  const [visibleCharts, setVisibleCharts] = useState({
  netWorth: false,
  monthlyCost: false,
  totalCost: false,
  equity: false,
  rentGrowth: false,
  breakEven: false
});

// Track if charts are ready to show (data calculated)
const [chartsReady, setChartsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveProgress, setSaveProgress] = useState<number | null>(null); // Track PDF save progress
  
  // Restart modal state
  const [showRestartModal, setShowRestartModal] = useState(false);
  
  // Location data state
  const [locationData, setLocationData] = useState<FormattedLocationData | null>(null);
  const [showLocationCard, setShowLocationCard] = useState(false);
  const [isLocationLocked, setIsLocationLocked] = useState(false); // Track if user made a choice
  const [usingZipData, setUsingZipData] = useState(false); // Track which scenario
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableValues, setEditableValues] = useState<UserData | null>(null);
  
  // Ref for scrolling to charts
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [monthlyCosts, setMonthlyCosts] = useState<{
    buying: any;
    renting: any;
  } | null>(null);
  
  const [totalCostData, setTotalCostData] = useState<{
    buyerFinalNetWorth: number;
    renterFinalNetWorth: number;
    totalBuyingCosts: number;
    totalRentingCosts: number;
    finalHomeValue: number;
    finalInvestmentValue: number;
  } | null>(null);
  
  
  // Handle save chat as PDF
  const handleSaveChat = async () => {
    try {
      setSaveProgress(0); // Start progress
      
      // Create new PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;
      
      // Helper function to check if we need a new page
      const checkNewPage = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };
      
      // Helper function to add text with word wrapping
      const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        if (isBold) {
          pdf.setFont('helvetica', 'bold');
        } else {
          pdf.setFont('helvetica', 'normal');
        }
        
        // Remove emojis that cause random symbols in PDF
        const cleanText = text.replace(/[📊🏠💵💰🔄💾]/g, '').trim();
        
        const lines = pdf.splitTextToSize(cleanText, pageWidth - 2 * margin);
        checkNewPage(lines.length * fontSize * 0.35 + 3);
        
        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * fontSize * 0.35 + 3;
      };
      
      // Add header
      addText('RentVsBuy.ai Analysis', 20, true);
      addText(`Generated on ${new Date().toLocaleDateString()}`, 12);
      
      // Add scenario info
      const scenario = userData.homePrice && userData.monthlyRent && userData.downPaymentPercent ? 
        `$${userData.homePrice.toLocaleString()}, $${userData.monthlyRent.toLocaleString()}, ${userData.downPaymentPercent}%` : 
        'Incomplete scenario';
      addText(`Scenario: ${scenario}`, 14, true);
      
      // Add "Your Inputs" section
      if (isLocationLocked && userData.homePrice && userData.monthlyRent) {
        addText('Your Inputs:', 12, true);
        
        // Home price
        addText(`🏠 Home: $${userData.homePrice.toLocaleString()}`, 10);
        
        // Monthly rent
        addText(`💵 Rent: $${userData.monthlyRent.toLocaleString()}/mo`, 10);
        
        // Down payment
        if (userData.downPaymentPercent) {
          addText(`💰 Down: ${userData.downPaymentPercent}%`, 10);
        }
        
        // Timeline
        if (userData.timeHorizonYears) {
          addText(`Timeline: ${userData.timeHorizonYears} years`, 10);
        }
        
        // Property tax rate
        const propertyTaxRate = locationData?.propertyTaxRate ? (locationData.propertyTaxRate * 100).toFixed(2) : '1.0';
        addText(`Tax: ${propertyTaxRate}%`, 10);
        
        // Growth rates
        if (locationData) {
          const homeAppreciationRate = getZIPBasedRates(locationData, userData.timeHorizonYears || 5).homeAppreciationRate;
          const rentGrowthRate = getZIPBasedRates(locationData, userData.timeHorizonYears || 5).rentGrowthRate;
          const investmentReturnRate = getZIPBasedRates(locationData, userData.timeHorizonYears || 5).investmentReturnRate;
          
          addText(`Appreciation: ${homeAppreciationRate.toFixed(1)}%/year (${locationData.city} market)`, 10);
          addText(`Rent Growth: ${rentGrowthRate.toFixed(1)}%/year (${locationData.city} market)`, 10);
          addText(`Investment: ${investmentReturnRate.toFixed(1)}%/year (based on timeline)`, 10);
        } else {
          const timelineRates = getTimelineBasedRates(userData.timeHorizonYears || 5);
          addText(`Appreciation: ${timelineRates.homeAppreciationRate.toFixed(1)}%/year (based on timeline)`, 10);
          addText(`Rent Growth: ${timelineRates.rentGrowthRate.toFixed(1)}%/year (based on timeline)`, 10);
          addText(`Investment: ${timelineRates.investmentReturnRate.toFixed(1)}%/year (based on timeline)`, 10);
        }
      }
      
      yPosition += 5; // Extra space before conversation
      
      // Process each message
      const totalMessages = messages.length;
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        const role = message.role === 'user' ? 'You' : 'AI Assistant';
        
        // Update progress (10% for setup, 80% for messages, 10% for finalization)
        setSaveProgress(10 + Math.floor((i / totalMessages) * 80));
        
        // Add message header
        addText(`${role}:`, 12, true);
        
        // Add message content
        addText(message.content, 11);
        
        // Add chart if present
        if (message.chartToShow && message.snapshotData) {
          const chartNames = {
            netWorth: 'Net Worth Comparison',
            monthlyCost: 'Monthly Costs Breakdown',
            totalCost: 'Total Cost Comparison',
            equity: 'Equity Buildup',
            rentGrowth: 'Rent Growth Comparison',
            breakEven: 'Break-Even Timeline'
          };
          
          const chartName = chartNames[message.chartToShow] || message.chartToShow;
          const inputVals = message.snapshotData.inputValues;
          
          addText(`Chart: ${chartName}`, 12, true);
          
          if (inputVals) {
            addText(`Home Price: $${inputVals.homePrice.toLocaleString()} | Monthly Rent: $${inputVals.monthlyRent.toLocaleString()} | Down Payment: ${inputVals.downPaymentPercent}%`, 10);
          }
          
          // Try to capture and add chart image
          const chartElement = document.querySelector(`[data-message-id="${message.id}"] .chart-wrapper`);
          if (chartElement) {
            try {
              // Small delay to ensure chart is fully rendered
              await new Promise(resolve => setTimeout(resolve, 100));
              
              const canvas = await html2canvas(chartElement as HTMLElement, {
                backgroundColor: '#ffffff',
                scale: 2, // Higher quality
                useCORS: true,
                allowTaint: true
              });
              
              const imgData = canvas.toDataURL('image/png');
              const imgWidth = pageWidth - 2 * margin;
              const imgHeight = (canvas.height * imgWidth) / canvas.width;
              
              // Check if we need a new page for the chart
              checkNewPage(imgHeight + 5);
              
              pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
              yPosition += imgHeight + 5;
              
            } catch (error) {
              addText('[Chart image could not be captured]', 10);
            }
          }
        }
        
        yPosition += 2; // Space between messages
      }
      
      // Save the PDF
      setSaveProgress(95);
      const fileName = `rentvsbuy-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      setSaveProgress(100);
      
      // Hide progress after a short delay
      setTimeout(() => {
        setSaveProgress(null);
      }, 500);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
      setSaveProgress(null); // Hide progress on error
    }
  };

  // Handle restart/reset
  const handleRestart = () => {
    // Reset all state to initial values
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hi! I'm here to help you figure out whether buying or renting makes more financial sense for you. To get started, tell me: what's the home price you're considering and your current monthly rent?"
      }
    ]);
    setUserData({
      homePrice: null,
      monthlyRent: null,
      downPaymentPercent: null,
      timeHorizonYears: null
    });
    setChartData(null);
    setVisibleCharts({
      netWorth: false,
      monthlyCost: false,
      totalCost: false,
      equity: false,
      rentGrowth: false,
      breakEven: false
    });
    setChartsReady(false);
    setMonthlyCosts(null);
    setTotalCostData(null);
    setShowRestartModal(false);
    setLocationData(null);
    setShowLocationCard(false);
    setIsLocationLocked(false);
    setUsingZipData(false);
    setIsEditMode(false);
    setEditableValues(null);
  };

  // Edit mode handlers
  const handleEditValues = () => {
    setIsEditMode(true);
    setEditableValues({ ...userData });
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditableValues(null);
  };

  const handleSaveEdit = () => {
    if (!editableValues) return;
    
    // Check if any values actually changed
    const hasChanges = 
      editableValues.homePrice !== userData.homePrice ||
      editableValues.monthlyRent !== userData.monthlyRent ||
      editableValues.downPaymentPercent !== userData.downPaymentPercent ||
      editableValues.timeHorizonYears !== userData.timeHorizonYears;
    
    if (!hasChanges) {
      // No changes made
      setIsEditMode(false);
      setEditableValues(null);
      
      const noChangeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "No changes were made to your scenario. Everything remains the same!"
      };
      setMessages(prev => [...prev, noChangeMessage]);
      return;
    }
    
    // Update user data with edited values
    setUserData(editableValues);
    setIsEditMode(false);
    setEditableValues(null);
    
    // Recalculate charts with new values
    calculateAndShowChart(editableValues, locationData);
    
    // Add AI message acknowledging the change
    const changeMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: "Perfect! I've updated your scenario with the new values. The charts have been recalculated to reflect your changes. Check out the chart buttons above to explore different views!"
    };
    setMessages(prev => [...prev, changeMessage]);
  };

  const handleUseLocalData = () => {
    if (locationData) {
      // Add user message showing the choice
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
        content: `Use this data`
    };
    setMessages(prev => [...prev, userMessage]);
    
      // Set the ZIP data immediately
      const newUserData: UserData = {
        homePrice: locationData.medianHomePrice,
        monthlyRent: locationData.averageRent,
        downPaymentPercent: null,
        timeHorizonYears: null
      };
      
    setUserData(newUserData);
      setIsLocationLocked(true);
      setUsingZipData(true);
      
      // Add AI message asking for down payment and timeline
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Perfect! I'll use the ${locationData.city}, ${locationData.state} market data. Now I just need two more details:\n\n1. What down payment percentage are you thinking? (e.g., 10%, 20%)\n2. How long do you plan to stay in this home? (e.g., 3, 5, 10 years)`
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Hide the location card
      setShowLocationCard(false);
    }
  };

  const handleKeepMyData = () => {
    if (locationData) {
      // Add user message showing the choice
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: `Use my own values`
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Lock the card in reference mode and show it immediately with blanks
      setIsLocationLocked(true);
      setUsingZipData(false);
      setShowLocationCard(false); // Hide the decision card
      
      // Clear location data so reference box uses custom values, not ZIP data
      setLocationData(null);
      
      // Add AI message referencing the box
      const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
        content: `Got it! You can use your own values instead. The default assumptions are shown in the box on the top right. What home price and monthly rent are you working with?`
      };
      setMessages(prev => [...prev, aiMessage]);
    }
  };

  // Simple function to check if AI response indicates a chart should be shown
function shouldShowChart(aiResponse: string): string | null {
  const lower = aiResponse.toLowerCase();
  
  // Check for chart trigger phrases (allows for "updated", "new", etc.)
  // Match patterns like: "here's your [updated/new] net worth comparison"
  if (lower.match(/here'?s your (updated |new )?net worth comparison/)) return 'netWorth';
  if (lower.match(/here'?s your (updated |new )?monthly costs breakdown/)) return 'monthlyCost';
  if (lower.match(/here'?s your (updated |new )?total cost comparison/)) return 'totalCost';
  if (lower.match(/here'?s your (updated |new )?equity buildup/)) return 'equity';
  // More flexible pattern for Rent Growth (with or without "chart", "comparison", etc.)
  if (lower.match(/here'?s your (updated |new )?rent growth( chart| comparison)?/)) return 'rentGrowth';
  if (lower.match(/here'?s your (updated |new )?break.?even timeline/)) return 'breakEven';
  
  return null;
}

  const handleSendMessage = async (content: string) => {
    // PATH 14: Check if user is changing their mind after making a choice
    if (isLocationLocked && locationData) {
      const lowerContent = content.toLowerCase();
      
      // User chose ZIP data but now wants custom
      if (usingZipData && ((lowerContent.includes('actually') || lowerContent.includes('wait')) && (lowerContent.includes('my own') || lowerContent.includes('custom') || lowerContent.includes('enter')))) {
        // Reset to custom mode
        setIsLocationLocked(false);
        setUsingZipData(false);
        setLocationData(null);
        setUserData({ homePrice: null, monthlyRent: null, downPaymentPercent: null, timeHorizonYears: null });
        
        const changeMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "No problem! Let's go with your own numbers instead. What home price and monthly rent are you working with?"
        };
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content }, changeMessage]);
        return;
      }
      
      // User chose custom but now wants ZIP data
      if (!usingZipData && ((lowerContent.includes('actually') || lowerContent.includes('wait')) && (lowerContent.includes('zip') || lowerContent.includes('local') || lowerContent.includes('those values')))) {
        // Switch to ZIP mode
        setUsingZipData(true);
        setUserData({
          homePrice: locationData.medianHomePrice,
          monthlyRent: locationData.averageRent,
          downPaymentPercent: null,
          timeHorizonYears: null
        });
        
        const changeMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Sure thing! I'll use the ${locationData.city}, ${locationData.state} data. Just need your down payment percentage.`
        };
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content }, changeMessage]);
        return;
      }
    }
    
    // Check if user is responding to ZIP code choice via text
    if (showLocationCard && locationData && !isLocationLocked) {
      const lowerContent = content.toLowerCase();
      
      // Detect "use local data" intent
      if ((lowerContent.includes('use') && (lowerContent.includes('those') || lowerContent.includes('local') || lowerContent.includes('zip') || lowerContent.includes('that') || lowerContent.includes('data'))) ||
          lowerContent.includes('use those') ||
          lowerContent.includes('use local') ||
          lowerContent.includes('use that data') ||
          lowerContent.includes('use the data') ||
          lowerContent === 'yes' || lowerContent === 'yeah' || lowerContent === 'sure') {
        // Add user message first
  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
          content
  };
  setMessages(prev => [...prev, userMessage]);
  
        // Then trigger the action
        handleUseLocalData();
        return;
      }
      
      // Detect "keep my numbers" intent
      if ((lowerContent.includes('my') && (lowerContent.includes('own') || lowerContent.includes('numbers'))) ||
          lowerContent.includes('enter my') ||
          lowerContent.includes('keep my') ||
          lowerContent.includes('custom') ||
          (lowerContent.includes('no') && (lowerContent.includes('enter') || lowerContent.includes('own'))) ||
          lowerContent === 'no') {
        // Add user message first
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content
        };
        setMessages(prev => [...prev, userMessage]);
        
        // Then trigger the action
        handleKeepMyData();
        return;
      }
    }
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    // Extract data from message using AI
    const { userData: newUserData, locationData: detectedLocationData } = await extractUserDataWithAI(content, userData);
    
    // Check if user mentioned a ZIP code but it wasn't found
    const zipCode = detectZipCode(content);
    if (zipCode && !detectedLocationData) {
      // Invalid/not found ZIP code
      const invalidZipMessage: Message = {
        id: Date.now().toString(),
      role: 'assistant',
        content: `I couldn't find data for ZIP code ${zipCode}. If you'd like, we can continue with your own numbers using standard assumptions (1.0% property tax, 3.5% rent growth). What home price and monthly rent are you working with?`
      };
      setMessages(prev => [...prev, invalidZipMessage]);
      setIsLoading(false);
      return;
    }
    
    // Handle location data if detected
    if (detectedLocationData) {
      setLocationData(detectedLocationData);
      
      // Check if user also provided custom values in the same message
      const hasCustomValues = newUserData.homePrice || newUserData.monthlyRent || newUserData.downPaymentPercent;
      
      if (hasCustomValues) {
        // PATH 10: ZIP + custom data conflict
        // Show card with custom message explaining both options
        setShowLocationCard(true);
        const conflictMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `I see you mentioned ${detectedLocationData.city}, ${detectedLocationData.state} (${zipCode}). Here's the current data for that area. Would you like to use these values instead, or should we continue with the numbers you provided${newUserData.homePrice ? ` ($${(newUserData.homePrice / 1000).toFixed(0)}k` : ''}${newUserData.monthlyRent ? `, $${(newUserData.monthlyRent / 1000).toFixed(1)}k` : ''}${newUserData.downPaymentPercent ? `, ${newUserData.downPaymentPercent}%` : ''})?`
        };
        setMessages(prev => [...prev, conflictMessage]);
        setIsLoading(false);
        return; // Wait for user choice
      }
      
      // Normal ZIP flow (no custom data provided)
      setShowLocationCard(true);
      // Reset lock if user is trying a new ZIP code
      if (isLocationLocked) {
        setIsLocationLocked(false);
        setUsingZipData(false);
      }
    }
    setUserData(newUserData);
    
    // Check if we have all data and if it changed
    const hasAllData = newUserData.homePrice && newUserData.monthlyRent && newUserData.downPaymentPercent && newUserData.timeHorizonYears;
    const dataChanged = 
      newUserData.homePrice !== userData.homePrice ||
      newUserData.monthlyRent !== userData.monthlyRent ||
      newUserData.downPaymentPercent !== userData.downPaymentPercent ||
      newUserData.timeHorizonYears !== userData.timeHorizonYears;
    
    // If data changed, we need to recalculate charts BEFORE showing them
    let freshChartData = chartData;
    let freshMonthlyCosts = monthlyCosts;
    let freshTotalCostData = totalCostData;
    
    if (hasAllData && dataChanged) {
      // Calculate fresh data synchronously
      const inputs = {
        homePrice: newUserData.homePrice!,
        downPaymentPercent: newUserData.downPaymentPercent!,
        interestRate: 7.0,
        loanTermYears: 30,
        timeHorizonYears: newUserData.timeHorizonYears!,
        propertyTaxRate: 1.0,
        homeInsuranceAnnual: 1200,
        hoaMonthly: 150,
        maintenanceRate: 1.0,
        homeAppreciationRate: getZIPBasedRates(locationData, newUserData.timeHorizonYears!).homeAppreciationRate,
        monthlyRent: newUserData.monthlyRent!,
        rentGrowthRate: getZIPBasedRates(locationData, newUserData.timeHorizonYears!).rentGrowthRate,
        renterInsuranceAnnual: 240,
        investmentReturnRate: getZIPBasedRates(locationData, newUserData.timeHorizonYears!).investmentReturnRate
      } as ScenarioInputs;
      
      // Calculate net worth comparison
      const snapshots = calculateNetWorthComparison(inputs);
      freshChartData = snapshots;
      
      // Calculate monthly costs
      const buying = calculateBuyingCosts(inputs);
      const renting = calculateRentingCosts(inputs, 1);
      freshMonthlyCosts = {
        buying: {
          mortgage: buying.mortgage,
          propertyTax: buying.propertyTax,
          insurance: buying.insurance,
          hoa: buying.hoa,
          maintenance: buying.maintenance,
          total: buying.total
        },
        renting: {
          rent: renting.monthlyRent,
          insurance: renting.insurance,
          total: renting.total
        }
      };
      
      // Calculate total costs over user's timeline
      const finalMonth = snapshots[snapshots.length - 1]; // Last month of user's timeline
      const totalBuyingCosts = snapshots.reduce((sum, s) => sum + s.monthlyBuyingCosts, 0);
      const totalRentingCosts = snapshots.reduce((sum, s) => sum + s.monthlyRentingCosts, 0);
      
      freshTotalCostData = {
        buyerFinalNetWorth: finalMonth.buyerNetWorth,
        renterFinalNetWorth: finalMonth.renterNetWorth,
        totalBuyingCosts,
        totalRentingCosts,
        finalHomeValue: finalMonth.homeValue,
        finalInvestmentValue: finalMonth.investedDownPayment
      };
      
      // Update state
      setChartData(freshChartData);
      setMonthlyCosts(freshMonthlyCosts);
      setTotalCostData(freshTotalCostData);
      setChartsReady(true);
      
      // Reset visible charts (all become available again)
      setVisibleCharts({
        netWorth: false,
        monthlyCost: false,
        totalCost: false,
        equity: false,
        rentGrowth: false,
        breakEven: false
      });
  }

    // Get AI response
    const allMessages = [...messages, userMessage].map(m => ({
      role: m.role,
      content: m.content
    }));
    
    const botResponse = await getAIResponse(allMessages, newUserData);

    // Check if AI response indicates a chart should be shown
    const chartToShow = shouldShowChart(botResponse);
    
    let assistantMessage: Message;
    if (chartToShow && (chartsReady || hasAllData) && freshChartData && freshMonthlyCosts && freshTotalCostData) {
      // AI wants to show a chart and we have the data
      assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
        content: botResponse,
        chartToShow: chartToShow as 'netWorth' | 'monthlyCost' | 'totalCost' | 'equity' | 'rentGrowth' | 'breakEven',
        snapshotData: {
          chartData: freshChartData,
          monthlyCosts: freshMonthlyCosts,
          totalCostData: freshTotalCostData,
          inputValues: {
            homePrice: newUserData.homePrice!,
            monthlyRent: newUserData.monthlyRent!,
            downPaymentPercent: newUserData.downPaymentPercent!
          }
        }
      };
      
      // Mark this chart as visible
    setVisibleCharts(prev => ({
      ...prev,
        [chartToShow]: true
      }));
      
      // Smooth scroll to the new chart after a brief delay
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }, 300);
      
    } else {
      // Normal AI response without chart
      assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: botResponse
    };
    }
    
    // Charts will be calculated and displayed automatically when all data is collected
    // Show reference box if user never used ZIP code (normal flow without location data)
    if (hasAllData && !chartsReady && !isLocationLocked && !locationData) {
      setIsLocationLocked(true);
      setUsingZipData(false);
    }
    
    // Then add bot response
    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
    
    // If we have all data and haven't calculated yet (initial case, not data change)
    if (hasAllData && !chartsReady && !dataChanged) {
      console.log('🔍 Calling calculateAndShowChart with locationData:', locationData);
      calculateAndShowChart(newUserData, locationData);
    }
    
    // Force recalculation if we have location data and charts are ready
    if (hasAllData && chartsReady && locationData) {
      console.log('🔍 Force recalculating with location data:', locationData);
      calculateAndShowChart(newUserData, locationData);
    }
  };

// Handle suggestion chip clicks
const handleChipClick = (message: string) => {
    // Handle chip click as a normal message - let AI handle everything
    handleSendMessage(message);
    
};

  const calculateAndShowChart = (data: UserData, currentLocationData?: FormattedLocationData | null) => {
    // Use local property tax rate if available, otherwise default to 1.0%
    // ZIP data stores propertyTaxRate as decimal (0.73 = 0.73%), so convert to percentage
    const locationDataToUse = currentLocationData || locationData;
    const propertyTaxRate = locationDataToUse?.propertyTaxRate ? locationDataToUse.propertyTaxRate * 100 : 1.0;
    
    // Debug logging for property tax rate
    console.log('🔍 Property Tax Rate Debug:');
    console.log('Location Data:', currentLocationData || locationData);
    console.log('Property Tax Rate (raw):', (currentLocationData || locationData)?.propertyTaxRate);
    console.log('Property Tax Rate (converted):', propertyTaxRate);
    
    const inputs: ScenarioInputs = {
      homePrice: data.homePrice!,
      downPaymentPercent: data.downPaymentPercent!,
      monthlyRent: data.monthlyRent!,
      interestRate: 7.0,
      loanTermYears: 30,
      timeHorizonYears: data.timeHorizonYears!,
      propertyTaxRate: propertyTaxRate,
      homeInsuranceAnnual: 1200,
      hoaMonthly: 150,
      maintenanceRate: 1.0,
      renterInsuranceAnnual: 240,
      // Use ZIP-based rates if location data exists, otherwise use timeline-based rates
      ...(locationDataToUse ? 
        getZIPBasedRates(locationDataToUse, data.timeHorizonYears!) : 
        getTimelineBasedRates(data.timeHorizonYears!)
      )
    };
    
    // Calculate net worth comparison
    const snapshots = calculateNetWorthComparison(inputs);

    setChartData(snapshots);
    setChartsReady(true); // Mark charts as ready
    
    // Automatically show the Net Worth chart when all data is collected
    setVisibleCharts(prev => ({
      ...prev,
      netWorth: true
    }));
    
    // Calculate monthly costs
    const buying = calculateBuyingCosts(inputs);
    const renting = calculateRentingCosts(inputs, 1);
    setMonthlyCosts({
      buying: {
        mortgage: buying.mortgage,
        propertyTax: buying.propertyTax,
        insurance: buying.insurance,
        hoa: buying.hoa,
        maintenance: buying.maintenance,
        total: buying.total
      },
      renting: {
        rent: renting.monthlyRent,
        insurance: renting.insurance,
        total: renting.total
      }
    });
    
    // Calculate total costs over user's timeline
    const finalMonth = snapshots[snapshots.length - 1]; // Last month of user's timeline
    const totalBuyingCosts = snapshots.reduce((sum, s) => sum + s.monthlyBuyingCosts, 0);
    const totalRentingCosts = snapshots.reduce((sum, s) => sum + s.monthlyRentingCosts, 0);

    setTotalCostData({
      buyerFinalNetWorth: finalMonth.buyerNetWorth,
      renterFinalNetWorth: finalMonth.renterNetWorth,
      totalBuyingCosts,
      totalRentingCosts,
      finalHomeValue: finalMonth.homeValue,
      finalInvestmentValue: finalMonth.investedDownPayment
    });
  };
  
  // Helper function to render chart based on type - uses message's snapshot data
  const renderChart = (chartType: string, snapshotData?: Message['snapshotData']) => {
    // Use snapshot data from the message, or fall back to current data
    const data = snapshotData?.chartData || chartData;
    // For monthly cost chart, always use fresh data if available (to get updated ZIP-based rates)
    const costs = chartType === 'monthlyCost' ? monthlyCosts : (snapshotData?.monthlyCosts || monthlyCosts);
    const totalData = snapshotData?.totalCostData || totalCostData;
    
    if (!data) return null;
    
    
    switch (chartType) {
      case 'netWorth':
  return (
          <div className="chart-wrapper">
            <NetWorthChart data={data} />
          </div>
        );
      case 'monthlyCost':
        return costs ? (
          <div className="chart-wrapper">
            <MonthlyCostChart 
              buyingCosts={costs.buying}
              rentingCosts={costs.renting}
            />
          </div>
        ) : null;
      case 'totalCost':
        return totalData ? (
          <div className="chart-wrapper">
            <TotalCostChart 
              buyerFinalNetWorth={totalData.buyerFinalNetWorth}
              renterFinalNetWorth={totalData.renterFinalNetWorth}
              totalBuyingCosts={totalData.totalBuyingCosts}
              totalRentingCosts={totalData.totalRentingCosts}
              finalHomeValue={totalData.finalHomeValue}
              finalInvestmentValue={totalData.finalInvestmentValue}
              timelineYears={Math.ceil((chartData?.length || 0) / 12)}
            />
          </div>
        ) : null;
      case 'equity':
        return (
          <div className="chart-wrapper">
            <EquityBuildupChart data={data} />
          </div>
        );
      case 'rentGrowth':
        return costs ? (
          <div className="chart-wrapper">
            <RentGrowthChart 
              data={data} 
              monthlyMortgage={costs.buying.mortgage}
            />
          </div>
        ) : null;
      case 'breakEven':
        return (
          <div className="chart-wrapper">
            <BreakEvenChart data={data} />
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="app-layout">
      
      {/* Location Data Card */}
      {showLocationCard && locationData && !isLocationLocked && (
        // Decision Mode: Show big card with buttons
        <div className="location-data-card">
          <div className="location-card-header">
            <h3>📍 {locationData.city}, {locationData.state}</h3>
            <button 
              className="location-card-close"
              onClick={() => setShowLocationCard(false)}
              title="Close"
            >
              ×
            </button>
          </div>
          <div className="location-card-content">
            <div className="location-section-title">Local Market Data:</div>
            <div className="location-data-item">
              <span className="location-icon">🏠</span>
              <span className="location-label">Median home price:</span>
              <span className="location-value">${locationData.medianHomePrice.toLocaleString()}</span>
            </div>
            <div className="location-data-item">
              <span className="location-icon">💵</span>
              <span className="location-label">Average rent:</span>
              <span className="location-value">${locationData.averageRent.toLocaleString()}/mo</span>
            </div>
            <div className="location-data-item">
              <span className="location-icon">🏛️</span>
              <span className="location-label">Property tax rate:</span>
              <span className="location-value">{locationData.propertyTaxRate}%</span>
            </div>
            
            <div className="location-section-title" style={{ marginTop: '12px' }}>National Averages:</div>
            <div className="location-data-item">
              <span className="location-icon">📈</span>
              <span className="location-label">Rent growth:</span>
              <span className="location-value">3.5%/year</span>
            </div>
            <div className="location-data-item">
              <span className="location-icon">🏘️</span>
              <span className="location-label">Home appreciation:</span>
              <span className="location-value">3.0%/year</span>
            </div>
            <div className="location-data-item">
              <span className="location-icon">💹</span>
              <span className="location-label">Investment return:</span>
              <span className="location-value">7.0%/year</span>
            </div>
          </div>
          <div className="location-card-actions">
            <button 
              className="location-btn location-btn-primary"
              onClick={handleUseLocalData}
            >
              Use this data
            </button>
            <button 
              className="location-btn location-btn-secondary"
              onClick={handleKeepMyData}
            >
              Keep my numbers
            </button>
          </div>
        </div>
      )}
      
      {/* Reference Box: Show after user makes choice */}
      {isLocationLocked && (
        <div className="reference-box">
          <div className="reference-box-header">
            <h4>📊 Your Inputs</h4>
          </div>
          <div className="reference-box-content">
            {usingZipData && locationData ? (
              // Scenario 1: Using ZIP data
              <>
                <div className="reference-item">
                  <span className="ref-label">🏠 Home:</span>
                  {isEditMode ? (
                    <div className="ref-input-container">
                      <input
                        type="number"
                        value={editableValues?.homePrice || ''}
                        onChange={(e) => setEditableValues(prev => prev ? {...prev, homePrice: parseInt(e.target.value) || null} : null)}
                        className="ref-input"
                        placeholder="Home price"
                      />
                      <small>({locationData.city})</small>
                    </div>
                  ) : (
                    <span className="ref-value">
                      {userData.homePrice ? `$${userData.homePrice.toLocaleString()}` : '___'} 
                      <small>({locationData.city})</small>
                    </span>
                  )}
                </div>
                <div className="reference-item">
                  <span className="ref-label">💵 Rent:</span>
                  {isEditMode ? (
                    <div className="ref-input-container">
                      <input
                        type="number"
                        value={editableValues?.monthlyRent || ''}
                        onChange={(e) => setEditableValues(prev => prev ? {...prev, monthlyRent: parseInt(e.target.value) || null} : null)}
                        className="ref-input"
                        placeholder="Monthly rent"
                      />
                      <small>({locationData.city})</small>
                    </div>
                  ) : (
                    <span className="ref-value">
                      {userData.monthlyRent ? `$${userData.monthlyRent.toLocaleString()}/mo` : '___'} 
                      <small>({locationData.city})</small>
                    </span>
                  )}
                </div>
                <div className="reference-item">
                  <span className="ref-label">💰 Down:</span>
                  {isEditMode ? (
                    <div className="ref-input-container">
                      <input
                        type="number"
                        value={editableValues?.downPaymentPercent || ''}
                        onChange={(e) => setEditableValues(prev => prev ? {...prev, downPaymentPercent: parseInt(e.target.value) || null} : null)}
                        className="ref-input"
                        placeholder="Down payment %"
                        min="1"
                        max="100"
                      />
                      <small>(you chose)</small>
                    </div>
                  ) : (
                    <span className="ref-value">
                      {userData.downPaymentPercent ? `${userData.downPaymentPercent}%` : '___'} 
                      <small>(you chose)</small>
                    </span>
                  )}
                </div>
                <div className="reference-item">
                  <span className="ref-label">⏰ Timeline:</span>
                  {isEditMode ? (
                    <div className="ref-input-container">
                      <input
                        type="number"
                        value={editableValues?.timeHorizonYears || ''}
                        onChange={(e) => setEditableValues(prev => prev ? {...prev, timeHorizonYears: parseInt(e.target.value) || null} : null)}
                        className="ref-input"
                        placeholder="Years"
                        min="1"
                        max="30"
                      />
                      <small>(you chose)</small>
                    </div>
                  ) : (
                    <span className="ref-value">
                      {userData.timeHorizonYears ? `${userData.timeHorizonYears} years` : '___'} 
                      <small>(you chose)</small>
                    </span>
                  )}
                </div>
                <div className="reference-item">
                  <span className="ref-label">🏛️ Tax:</span>
                  <span className="ref-value">{(locationData.propertyTaxRate * 100).toFixed(2)}% <small>({locationData.state})</small></span>
                </div>
                <div className="reference-divider"></div>
                <div className="reference-item">
                  <span className="ref-label">📈 Rent growth:</span>
                  <span className="ref-value">
                    {userData.timeHorizonYears ? `${getZIPBasedRates(locationData, userData.timeHorizonYears).rentGrowthRate.toFixed(1)}%/year` : '___'} 
                    <small>({locationData ? `${locationData.city} market` : 'nat\'l avg'})</small>
                  </span>
                </div>
                <div className="reference-item">
                  <span className="ref-label">🏘️ Appreciation:</span>
                  <span className="ref-value">
                    {userData.timeHorizonYears ? `${getZIPBasedRates(locationData, userData.timeHorizonYears).homeAppreciationRate.toFixed(1)}%/year` : '___'} 
                    <small>({locationData ? `${locationData.city} market` : 'based on timeline'})</small>
                  </span>
                </div>
                <div className="reference-item">
                  <span className="ref-label">💹 Investment:</span>
                  <span className="ref-value">
                    {userData.timeHorizonYears ? `${getZIPBasedRates(locationData, userData.timeHorizonYears).investmentReturnRate}%/year` : '___'} 
                    <small>(based on timeline)</small>
                  </span>
                </div>
              </>
            ) : (
              // Scenario 2: Using custom data
              <>
                <div className="reference-item">
                  <span className="ref-label">🏠 Home:</span>
                  {isEditMode ? (
                    <div className="ref-input-container">
                      <input
                        type="number"
                        value={editableValues?.homePrice || ''}
                        onChange={(e) => setEditableValues(prev => prev ? {...prev, homePrice: parseInt(e.target.value) || null} : null)}
                        className="ref-input"
                        placeholder="Home price"
                      />
                      <small>(you chose)</small>
                    </div>
                  ) : (
                    <span className="ref-value">
                      {userData.homePrice ? `$${userData.homePrice.toLocaleString()}` : '___'} 
                      <small>(you chose)</small>
                    </span>
                  )}
                </div>
                <div className="reference-item">
                  <span className="ref-label">💵 Rent:</span>
                  {isEditMode ? (
                    <div className="ref-input-container">
                      <input
                        type="number"
                        value={editableValues?.monthlyRent || ''}
                        onChange={(e) => setEditableValues(prev => prev ? {...prev, monthlyRent: parseInt(e.target.value) || null} : null)}
                        className="ref-input"
                        placeholder="Monthly rent"
                      />
                      <small>(you chose)</small>
                    </div>
                  ) : (
                    <span className="ref-value">
                      {userData.monthlyRent ? `$${userData.monthlyRent.toLocaleString()}/mo` : '___'} 
                      <small>(you chose)</small>
                    </span>
                  )}
                </div>
                <div className="reference-item">
                  <span className="ref-label">💰 Down:</span>
                  {isEditMode ? (
                    <div className="ref-input-container">
                      <input
                        type="number"
                        value={editableValues?.downPaymentPercent || ''}
                        onChange={(e) => setEditableValues(prev => prev ? {...prev, downPaymentPercent: parseInt(e.target.value) || null} : null)}
                        className="ref-input"
                        placeholder="Down payment %"
                        min="1"
                        max="100"
                      />
                      <small>(you chose)</small>
                    </div>
                  ) : (
                    <span className="ref-value">
                      {userData.downPaymentPercent ? `${userData.downPaymentPercent}%` : '___'} 
                      <small>(you chose)</small>
                    </span>
                  )}
                </div>
                <div className="reference-item">
                  <span className="ref-label">⏰ Timeline:</span>
                  {isEditMode ? (
                    <div className="ref-input-container">
                      <input
                        type="number"
                        value={editableValues?.timeHorizonYears || ''}
                        onChange={(e) => setEditableValues(prev => prev ? {...prev, timeHorizonYears: parseInt(e.target.value) || null} : null)}
                        className="ref-input"
                        placeholder="Years"
                        min="1"
                        max="30"
                      />
                      <small>(you chose)</small>
                    </div>
                  ) : (
                    <span className="ref-value">
                      {userData.timeHorizonYears ? `${userData.timeHorizonYears} years` : '___'} 
                      <small>(you chose)</small>
                    </span>
                  )}
                </div>
                <div className="reference-item">
                  <span className="ref-label">🏛️ Tax:</span>
                  <span className="ref-value">1.0% <small>(nat'l avg)</small></span>
                </div>
                <div className="reference-divider"></div>
                <div className="reference-item">
                  <span className="ref-label">📈 Rent growth:</span>
                  <span className="ref-value">
                    {userData.timeHorizonYears ? `${getZIPBasedRates(locationData, userData.timeHorizonYears).rentGrowthRate.toFixed(1)}%/year` : '___'} 
                    <small>({locationData ? `${locationData.city} market` : 'nat\'l avg'})</small>
                  </span>
                </div>
                <div className="reference-item">
                  <span className="ref-label">🏘️ Appreciation:</span>
                  <span className="ref-value">
                    {userData.timeHorizonYears ? `${getZIPBasedRates(locationData, userData.timeHorizonYears).homeAppreciationRate.toFixed(1)}%/year` : '___'} 
                    <small>({locationData ? `${locationData.city} market` : 'based on timeline'})</small>
                  </span>
                </div>
                <div className="reference-item">
                  <span className="ref-label">💹 Investment:</span>
                  <span className="ref-value">
                    {userData.timeHorizonYears ? `${getZIPBasedRates(locationData, userData.timeHorizonYears).investmentReturnRate}%/year` : '___'} 
                    <small>(based on timeline)</small>
                  </span>
                </div>
              </>
            )}
          </div>
          
          {/* Edit Mode Buttons */}
          <div className="reference-box-actions">
            {!isEditMode ? (
              <button 
                className="edit-values-btn"
                onClick={handleEditValues}
              >
                Edit Values
              </button>
            ) : (
              <div className="edit-actions">
                <button 
                  className="save-edit-btn"
                  onClick={handleSaveEdit}
                >
                  Save Changes
                </button>
                <button 
                  className="cancel-edit-btn"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
    <div className="chat-container">
      <div className="chat-header">
        <h1 className="app-title">RentVsBuy.ai</h1>
          <div className="header-buttons">
            <button 
              className="save-button"
              onClick={handleSaveChat}
              title="Save current chat"
            >
              Save Chat
            </button>
            <button 
              className="restart-button"
              onClick={() => setShowRestartModal(true)}
              title="Start over"
            >
Restart
            </button>
          </div>
      </div>
      
      <div className="messages-container">
        {messages.map((message, index) => {
          // Calculate delay based on previous assistant messages' content length
          let delay = 0;
          if (message.role === 'assistant') {
            for (let i = 0; i < index; i++) {
              if (messages[i].role === 'assistant') {
                const wordCount = messages[i].content.split(' ').length;
                delay += 50 + (wordCount * 3); // 50ms base + 3ms per word - much faster
              }
            }
          }
          
          return (
            <div key={message.id} data-message-id={message.id}>
          <ChatMessage
            role={message.role}
            content={message.content}
                delay={delay}
              />
              {/* Render chart right after message if it has one - uses message's snapshot data */}
              {message.chartToShow && renderChart(message.chartToShow, message.snapshotData)}
            </div>
          );
        })}
        
        {isLoading && (
          <div className="loading-indicator">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span>AI is thinking...</span>
          </div>
        )}
        
        {/* ADD CHIPS AT THE END */}
        {chartsReady && (
          <SuggestionChips 
            onChipClick={handleChipClick}
            visibleCharts={visibleCharts}
          />
        )}

        {/* Scroll target for smooth scrolling to charts */}
        <div ref={messagesEndRef} />
              </div>
      
      {/* Chart Navigation Buttons - above input for convenience */}
      {chartsReady && (
        <div className="chart-nav-bar">
          <span className="chart-nav-label">📊 Charts:</span>
          <div className="chart-nav-buttons-horizontal">
            <button 
              className="chart-nav-btn-sm"
              onClick={() => handleChipClick('show me monthly costs')}
              title="View Monthly Costs"
            >
              💰 Monthly
            </button>
            <button 
              className="chart-nav-btn-sm"
              onClick={() => handleChipClick('show me net worth')}
              title="View Net Worth"
            >
              📈 Net Worth
            </button>
            <button 
              className="chart-nav-btn-sm"
              onClick={() => handleChipClick('show me total cost')}
              title="View Total Cost"
            >
              💵 Total Cost
            </button>
            <button 
              className="chart-nav-btn-sm"
              onClick={() => handleChipClick('show me equity buildup')}
              title="View Equity Buildup"
            >
              🏠 Equity
            </button>
            <button 
              className="chart-nav-btn-sm"
              onClick={() => handleChipClick('show me rent growth')}
              title="View Rent Growth"
            >
              📊 Rent
            </button>
            <button 
              className="chart-nav-btn-sm"
              onClick={() => handleChipClick('show me break even')}
              title="View Break-Even Timeline"
            >
              ⏰ Break-Even
            </button>
          </div>
              </div>
            )}
  
      <ChatInput onSend={handleSendMessage} />
      
        {/* Footer */}
        <div className="chat-footer">
          <span>RentVsBuy.ai v1.0</span>
          <span>•</span>
          <span>Built with AI-powered insights</span>
              </div>
      </div>
      
      {/* Restart Confirmation Modal */}
      {showRestartModal && (
        <div className="modal-overlay" onClick={() => setShowRestartModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Start Over?</h2>
            <p>This will clear all your data and conversation. Are you sure?</p>
            <div className="modal-buttons">
              <button 
                className="modal-button cancel-button"
                onClick={() => setShowRestartModal(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-button confirm-button"
                onClick={handleRestart}
              >
                Yes, Restart
              </button>
            </div>
          </div>
              </div>
            )}
  
      {/* Save Progress Modal */}
      {saveProgress !== null && (
        <div className="modal-overlay">
          <div className="progress-modal">
            <div className="progress-circle">
              <svg className="progress-ring" width="120" height="120">
                <circle
                  className="progress-ring-circle-bg"
                  stroke="#e0e0e0"
                  strokeWidth="8"
                  fill="transparent"
                  r="52"
                  cx="60"
                  cy="60"
                />
                <circle
                  className="progress-ring-circle"
                  stroke="#4CAF50"
                  strokeWidth="8"
                  fill="transparent"
                  r="52"
                  cx="60"
                  cy="60"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 52}`,
                    strokeDashoffset: `${2 * Math.PI * 52 * (1 - saveProgress / 100)}`,
                    transition: 'stroke-dashoffset 0.3s ease'
                  }}
                />
              </svg>
              <div className="progress-text">{saveProgress}%</div>
              </div>
            <p className="progress-label">Generating PDF...</p>
      </div>
              </div>
            )}
      
    </div>
  );
  

}







// Extract numbers from user messages

// AI-powered data extraction - handles any user input format
async function extractUserDataWithAI(message: string, currentData: UserData): Promise<{ userData: UserData; locationData: FormattedLocationData | null }> {
  const newData = { ...currentData };
  
  // Check for ZIP code FIRST
  const zipCode = detectZipCode(message);
  let locationData: FormattedLocationData | null = null;
  
  if (zipCode) {
    const rawLocationData = getLocationData(zipCode);
    if (rawLocationData) {
      locationData = formatLocationData(rawLocationData);
    }
  }
  
  // Use AI to extract financial data from the message
  try {
    const extractionPrompt = `
Extract financial data from this user message: "${message}"

Look for and extract:
1. Home price: Any large number (like 400000, 500k, $500,000) that could be a home price
2. Monthly rent: Any number that could be monthly rent (like 2500, 2.5k, $2,500)
3. Down payment percentage: Any number with % or "percent" (like 20%, 15 percent)
4. Timeline in years: Any number with time-related words (year, yr, yrs, stay, plan, timeline)

Return ONLY a JSON object with this exact format:
{
  "homePrice": number or null,
  "monthlyRent": number or null, 
  "downPaymentPercent": number or null,
  "timeHorizonYears": number or null
}

If you can't find a value, use null. Only extract numbers that make sense for each field.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a financial data extraction assistant. Extract only the requested financial data and return valid JSON."
        },
        {
          role: "user", 
          content: extractionPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 200
    });

    const extractedData = JSON.parse(response.choices[0].message.content || '{}');
    
    // Update newData with extracted values (only if they exist)
    if (extractedData.homePrice && extractedData.homePrice > 0) {
      newData.homePrice = extractedData.homePrice;
    }
    if (extractedData.monthlyRent && extractedData.monthlyRent > 0) {
      newData.monthlyRent = extractedData.monthlyRent;
    }
    if (extractedData.downPaymentPercent && extractedData.downPaymentPercent > 0) {
      newData.downPaymentPercent = extractedData.downPaymentPercent;
    }
    if (extractedData.timeHorizonYears && extractedData.timeHorizonYears > 0) {
      newData.timeHorizonYears = extractedData.timeHorizonYears;
    }
    
  } catch (error) {
    console.error('AI extraction failed:', error);
    // Fall back to basic number extraction if AI fails
    return extractUserDataFallback(message, currentData, locationData);
  }
  
  return { userData: newData, locationData };
}

// Fallback extraction for when AI fails
function extractUserDataFallback(message: string, currentData: UserData, locationData: FormattedLocationData | null): { userData: UserData; locationData: FormattedLocationData | null } {
  const newData = { ...currentData };
  const lowerMessage = message.toLowerCase();
  
  // Basic number extraction as fallback
  const numbers = message.match(/\d+(?:,\d{3})*(?:\.\d+)?/g)?.map(n => parseFloat(n.replace(/,/g, ''))) || [];
  
  // Simple heuristics for fallback
  if (numbers.length > 0) {
    const largest = Math.max(...numbers);
    
    // If largest number is very big, it's probably home price
    if (largest > 100000 && !newData.homePrice) {
      newData.homePrice = largest;
    }
    
    // If there's a medium number, it's probably rent
    if (numbers.some(n => n > 500 && n < 10000) && !newData.monthlyRent) {
      newData.monthlyRent = numbers.find(n => n > 500 && n < 10000) || null;
    }
    
    // Look for percentage
    if (lowerMessage.includes('%')) {
      const percentMatch = message.match(/(\d+(?:\.\d+)?)\s*%/);
      if (percentMatch && !newData.downPaymentPercent) {
        newData.downPaymentPercent = parseFloat(percentMatch[1]);
      }
    }
    
    // Look for years
    if (lowerMessage.includes('year') || lowerMessage.includes('yr')) {
      const yearMatch = message.match(/(\d+)\s*(?:year|yr|yrs)/i);
      if (yearMatch && !newData.timeHorizonYears) {
        newData.timeHorizonYears = parseInt(yearMatch[1]);
      }
    }
  }
  
  return { userData: newData, locationData };
}

// Old extractUserData function - replaced with AI-powered extraction
