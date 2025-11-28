// src/components/chat/ChatContainer.tsx

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { NetWorthChart } from '../charts/NetWorthChart';
import { MonthlyCostChart } from '../charts/MonthlyCostChart';
import { TotalCostChart } from '../charts/TotalCostChart';
import { EquityBuildupChart } from '../charts/EquityBuildupChart';
import { RentGrowthChart } from '../charts/RentGrowthChart';
import { BreakEvenChart } from '../charts/BreakEvenChart';
import { BreakEvenHeatmap } from '../charts/BreakEvenHeatmap';
import { ScenarioOverlayChart } from '../charts/ScenarioOverlayChart';
import { CashFlowChart } from '../charts/CashFlowChart';
import { CumulativeCostChart } from '../charts/CumulativeCostChart';
import { TaxSavingsChart } from '../charts/TaxSavingsChart';
import { MonteCarloChart } from '../charts/MonteCarloChart';
import { SensitivityChart } from '../charts/SensitivityChart';
import { ChartPlaceholder } from '../charts/ChartPlaceholder';
import { ChartsGrid } from '../charts/ChartsGrid';
import { BasicInputsCard } from './BasicInputsCard';
import { AdvancedInputsCard } from './AdvancedInputsCard';
import { generateRecommendation, type Recommendation } from '../../types/recommendation';
import { RecommendationCard } from '../RecommendationCard/RecommendationCard';
import { calculateNetWorthComparison, calculateBuyingCosts, calculateRentingCosts, getTimelineBasedRates, getZIPBasedRates } from '../../lib/finance/calculator';
import { getLocationData, formatLocationData, detectZipCode, detectCityMention, type FormattedLocationData } from '../../lib/location/zipCodeService';
import type {
  ScenarioInputs,
  MonthlySnapshot,
  BuyingCostsBreakdown,
  RentingCostsBreakdown,
  TotalCostSummary,
  CalculatorSummary,
  CalculatorOutput,
  CashFlowPoint,
  CumulativeCostPoint,
  LiquidityPoint,
  TaxSavingsPoint,
  AnalysisResult,
  TimelinePoint,
  HomePricePathSummary,
  SensitivityResult,
  ScenarioResult
} from '../../types/calculator';
// import { MonthlyCostChart } from '../charts/MonthlyCostChart';
// import { TotalCostChart } from '../charts/TotalCostChart';
import { getAIResponse, createChatCompletion } from '../../lib/ai/openai';
// import { EquityBuildupChart } from '../charts/EquityBuildupChart';
// import { RentGrowthChart } from '../charts/RentGrowthChart';
// import { BreakEvenChart } from '../charts/BreakEvenChart';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { analyzeScenario, fetchBreakEvenHeatmap, fetchSensitivity, fetchScenarios } from '../../lib/api/finance';
import { OnboardingTour } from '../onboarding/OnboardingTour';
// import { CashFlowChart } from '../charts/CashFlowChart';
// import { CumulativeCostChart } from '../charts/CumulativeCostChart';
// import { LiquidityTimeline } from '../charts/LiquidityTimeline';
// import { TaxSavingsChart } from '../charts/TaxSavingsChart';
// import { BreakEvenHeatmap } from '../charts/BreakEvenHeatmap';
import type { BreakEvenHeatmapPoint } from '../../types/calculator';
// import { MonteCarloChart } from '../charts/MonteCarloChart';
// import { SensitivityChart } from '../charts/SensitivityChart';
// import { ScenarioOverlayChart } from '../charts/ScenarioOverlayChart';

type ChartType =
  | 'netWorth'
  | 'monthlyCost'
  | 'totalCost'
  | 'equity'
  | 'rentGrowth'
  | 'breakEven'
  | 'cashFlow'
  | 'cumulativeCost'
  | 'liquidity'
  | 'taxSavings'
  | 'breakEvenHeatmap'
  | 'monteCarlo'
  | 'sensitivity'
  | 'scenarioOverlay';

// Basic charts - always visible and easy for beginners
const BASIC_CHART_KEYS: ChartType[] = [
  'monthlyCost',
  'netWorth',
  'equity',
  'totalCost'
];

// Advanced charts - grouped under "Advanced Analysis"
const ADVANCED_CHART_KEYS: ChartType[] = [
  'monteCarlo',
  'breakEven',
  'breakEvenHeatmap',
  'cashFlow',
  'cumulativeCost',
  'liquidity',
  'rentGrowth',
  'taxSavings',
  'scenarioOverlay',
  'sensitivity'
];

// Helper to map chart keys to button labels and messages - Plain English labels
const chartButtonConfig: Record<ChartType, { label: string; message: string; title: string; description: string }> = {
  monthlyCost: { 
    label: '📅 What will I pay each month?', 
    message: 'show me monthly costs', 
    title: 'Monthly Cost Breakdown',
    description: 'Monthly cost breakdown'
  },
  netWorth: { 
    label: '💰 How much money will I have?', 
    message: 'show me net worth', 
    title: 'Net Worth Comparison',
    description: 'Total net worth over time'
  },
  equity: { 
    label: '🏠 How much house will I own?', 
    message: 'show me equity buildup', 
    title: 'Equity Buildup',
    description: 'Equity buildup over time'
  },
  totalCost: { 
    label: '💵 Total cost comparison', 
    message: 'show me total cost', 
    title: 'Total Cost Comparison',
    description: 'Everything you\'ll spend'
  },
  monteCarlo: { 
    label: '🎲 What if the market changes?', 
    message: 'run monte carlo simulation', 
    title: 'Monte Carlo Simulation',
    description: '1,000 simulated scenarios'
  },
  breakEven: { 
    label: '⏰ When does buying become worth it?', 
    message: 'show me break even', 
    title: 'Break-Even Timeline',
    description: 'Break-even timeline'
  },
  breakEvenHeatmap: { 
    label: '🟩 Break-even heatmap', 
    message: 'show me break even heatmap', 
    title: 'Break-Even Heatmap',
    description: 'Visual break-even analysis'
  },
  cashFlow: { 
    label: '💸 Monthly cash flow', 
    message: 'show me cash flow', 
    title: 'Cash Flow',
    description: 'Money saved or spent'
  },
  cumulativeCost: { 
    label: '📊 Cumulative costs', 
    message: 'show me cumulative costs', 
    title: 'Cumulative Costs',
    description: 'Running total of costs'
  },
  liquidity: { 
    label: '💧 Liquidity timeline', 
    message: 'show me liquidity', 
    title: 'Liquidity Timeline',
    description: 'Available cash over time'
  },
  rentGrowth: { 
    label: '📊 Rent growth over time', 
    message: 'show me rent growth', 
    title: 'Rent Growth',
    description: 'How rent increases over time'
  },
  taxSavings: { 
    label: '📋 Tax deduction benefits', 
    message: 'show me tax savings', 
    title: 'Tax Savings',
    description: 'Mortgage interest savings'
  },
  scenarioOverlay: { 
    label: '🔀 Compare scenarios', 
    message: 'show me scenario overlay', 
    title: 'Scenario Overlay',
    description: 'Side-by-side comparison'
  },
  sensitivity: { 
    label: '📊 Rate sensitivity analysis', 
    message: 'show me sensitivity', 
    title: 'Sensitivity Analysis',
    description: 'Impact of rate changes'
  }
};

const DEFAULT_HEATMAP_TIMELINES = [5, 10, 15, 20];
const DEFAULT_HEATMAP_DOWN_PAYMENTS = [5, 10, 15, 20];
const DEFAULT_MONTE_CARLO_RUNS = 150;

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  chartToShow?: ChartType;
  showRecommendation?: boolean; // Flag to show recommendation card in this message
  recommendation?: Recommendation; // Store recommendation data directly in the message
  recommendationTimeline?: number; // Timeline used for this recommendation
  recommendationLocation?: string; // Location string for this recommendation
  // Store chart data with the message so it doesn't change when new scenarios are calculated
  snapshotData?: {
    // New unified structure
    analysis?: AnalysisResult;
    // Legacy structure for backward compatibility (will be removed later)
    chartData?: MonthlySnapshot[];
    monthlyCosts?: {
      buying: BuyingCostsBreakdown;
      renting: RentingCostsBreakdown;
    };
    totalCostData?: TotalCostSummary;
    cashFlow?: CashFlowPoint[] | null;
    cumulativeCosts?: CumulativeCostPoint[] | null;
    liquidityTimeline?: LiquidityPoint[] | null;
    taxSavings?: TaxSavingsPoint[] | null;
    heatmapPoints?: BreakEvenHeatmapPoint[] | null;
    monteCarlo?: HomePricePathSummary | null;
    sensitivity?: SensitivityResult[] | null;
    scenarioOverlay?: ScenarioResult[] | null;
    // Store the input values that created this chart
    inputValues: {
      homePrice: number;
      monthlyRent: number;
      downPaymentPercent: number;
      timeHorizonYears: number;
    };
  };
}

interface UserData {
  homePrice: number | null;
  monthlyRent: number | null;
  downPaymentPercent: number | null;
  timeHorizonYears: number | null;
}

type AssumptionValues = {
  interestRate: number;
  homeAppreciationRate: number;
  rentGrowthRate: number;
  investmentReturnRate: number;
};

type AdvancedInputs = {
  loanTermYears: number;
  interestRate: number;
  propertyTaxRate: number;
  maintenanceRate: number;
  homeInsuranceAnnual: number;
  renterInsuranceAnnual: number;
  hoaMonthly: number;
};

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Welcome. I'm your financial advisor for home-buying decisions. I'll analyze your local market and show you how buying compares to renting over time.\n\nYou can start by:\n• providing a ZIP code (e.g., 92127) so I can pull local market data, or\n• telling me the home price and rent you want to compare."
    }
  ]);
  
  const [userData, setUserData] = useState<UserData>({
    homePrice: null,
    monthlyRent: null,
    downPaymentPercent: null,
    timeHorizonYears: null
  });
  
  const [chartData, setChartData] = useState<MonthlySnapshot[] | null>(null);

// Track if charts are ready to show (data calculated)
const [chartsReady, setChartsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<{ stage: string; progress: number }>({ stage: 'Starting...', progress: 0 });
  const [isAnalyzing, setIsAnalyzing] = useState(false); // Track if we're doing full analysis vs just AI extraction
  const [saveProgress, setSaveProgress] = useState<number | null>(null); // Track PDF save progress
  const [isMonteCarloLoading, setIsMonteCarloLoading] = useState(false);
  const [monteCarloProgress, setMonteCarloProgress] = useState(0);
  const [monteCarloProgressStage, setMonteCarloProgressStage] = useState('Starting Monte Carlo simulation...');
  
  // Chart loading states for slow charts
  const [chartLoading, setChartLoading] = useState<{
    type: ChartType | null;
    progress: number;
    message: string;
  }>({ type: null, progress: 0, message: '' });
  
  // Restart modal state
  const [showRestartModal, setShowRestartModal] = useState(false);
  
  // Location data state
  const [locationData, setLocationData] = useState<FormattedLocationData | null>(null);
  const [currentZipCode, setCurrentZipCode] = useState<string | null>(null); // Track current ZIP code for ML predictions
  const [isLocationLocked, setIsLocationLocked] = useState(false); // Track if user made a choice
  const [usingZipData, setUsingZipData] = useState(false); // Track which scenario
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);
  const [hasShownScenarioSummary, setHasShownScenarioSummary] = useState(false); // Track if we've shown scenario summary for current analysis
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableValues, setEditableValues] = useState<UserData | null>(null);
  const [advancedInputs, setAdvancedInputs] = useState<AdvancedInputs>({
    loanTermYears: 30,
    interestRate: 7,
    propertyTaxRate: 1,
    maintenanceRate: 1,
    homeInsuranceAnnual: 1200,
    renterInsuranceAnnual: 240,
    hoaMonthly: 150,
  });
  const [editableAdvancedValues, setEditableAdvancedValues] = useState<AdvancedInputs | null>(null);
  
  // Advanced assumptions visibility state
  const [showAdvancedAssumptions, setShowAdvancedAssumptions] = useState(false);
  
  // Advanced charts visibility state
  const [showAdvancedCharts, setShowAdvancedCharts] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'charts'>('chat');
  
  // Ref for scrolling to charts
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const monteCarloProgressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [monthlyCosts, setMonthlyCosts] = useState<{
    buying: BuyingCostsBreakdown;
    renting: RentingCostsBreakdown;
  } | null>(null);
  
  const [totalCostData, setTotalCostData] = useState<TotalCostSummary | null>(null);
  const [advancedMetrics, setAdvancedMetrics] = useState<{
    cashFlow: CashFlowPoint[] | null;
    cumulativeCosts: CumulativeCostPoint[] | null;
    liquidityTimeline: LiquidityPoint[] | null;
    taxSavings: TaxSavingsPoint[] | null;
  }>({
    cashFlow: null,
    cumulativeCosts: null,
    liquidityTimeline: null,
    taxSavings: null
  });
  const [heatmapData, setHeatmapData] = useState<BreakEvenHeatmapPoint[] | null>(null);
  const [monteCarloData, setMonteCarloData] = useState<HomePricePathSummary | null>(null);
  const [sensitivityData, setSensitivityData] = useState<SensitivityResult[] | null>(null);
  const [scenarioOverlayData, setScenarioOverlayData] = useState<ScenarioResult[] | null>(null);
  const [unifiedAnalysisResult, setUnifiedAnalysisResult] = useState<AnalysisResult | null>(null);
  const [recommendation, setRecommendation] = useState<any | null>(null);
  
  useEffect(() => {
    if (locationData && usingZipData) {
      setAdvancedInputs(prev => ({
        ...prev,
        propertyTaxRate: locationData.propertyTaxRate * 100,
      }));
    }
  }, [locationData, usingZipData]);

  useEffect(() => {
    return () => {
      if (monteCarloProgressTimer.current) {
        clearInterval(monteCarloProgressTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!chartsReady) {
      return;
    }
    if (heatmapData && heatmapData.length > 0) {
      return;
    }
    const inputs = buildScenarioInputs(userData, locationData, unifiedAnalysisResult ?? null, advancedInputs);
    if (!inputs) {
      return;
    }
    loadHeatmapData(inputs).catch(() => {
      // errors are already logged inside loadHeatmapData
    });
  }, [chartsReady, heatmapData, userData, locationData, unifiedAnalysisResult]);

  useEffect(() => {
    if (!chartsReady) {
      return;
    }
    if (sensitivityData && sensitivityData.length > 0) {
      return;
    }
    if (chartLoading.type === 'sensitivity') {
      return;
    }
    const baseInputs = buildScenarioInputs(userData, locationData, unifiedAnalysisResult ?? null, advancedInputs);
    if (!baseInputs) {
      return;
    }
    setChartLoading({
      type: 'sensitivity',
      progress: 15,
      message: 'Running sensitivity analysis...',
    });
    loadSensitivityData(baseInputs, 1.0, 0.1, 0.1)
      .then(result => {
        if (result && result.length > 0) {
          setSensitivityData(result);
          setChartLoading({
            type: 'sensitivity',
            progress: 100,
            message: 'Complete!',
          });
          setTimeout(() => {
            setChartLoading({ type: null, progress: 0, message: '' });
          }, 300);
        } else {
          setChartLoading({ type: null, progress: 0, message: '' });
        }
      })
      .catch(() => {
        setChartLoading({ type: null, progress: 0, message: '' });
      });
  }, [chartsReady, sensitivityData, userData, locationData, unifiedAnalysisResult, chartLoading.type]);

  useEffect(() => {
    if (!chartsReady) {
      return;
    }
    if (scenarioOverlayData && scenarioOverlayData.length > 0) {
      return;
    }
    if (chartLoading.type === 'scenarioOverlay') {
      return;
    }
    const baseInputs = buildScenarioInputs(userData, locationData, unifiedAnalysisResult ?? null, advancedInputs);
    if (!baseInputs) {
      return;
    }
    const variants = buildScenarioVariants(baseInputs);
    if (!variants.length) {
      return;
    }
    setChartLoading({
      type: 'scenarioOverlay',
      progress: 15,
      message: 'Preparing scenario comparison...'
    });
    loadScenarioOverlayData(variants)
      .then(result => {
        if (result && result.length > 0) {
          setScenarioOverlayData(result);
          setChartLoading({
            type: 'scenarioOverlay',
            progress: 100,
            message: 'Complete!'
          });
          setTimeout(() => {
            setChartLoading({
              type: null,
              progress: 0,
              message: ''
            });
          }, 300);
        } else {
          setChartLoading({
            type: null,
            progress: 0,
            message: ''
          });
        }
      })
      .catch(() => {
        setChartLoading({
          type: null,
          progress: 0,
          message: ''
        });
      });
  }, [chartsReady, scenarioOverlayData, userData, locationData, unifiedAnalysisResult, chartLoading.type]);

  // Auto-scroll to bottom when messages change or when loading state changes
  useEffect(() => {
    // Small delay to ensure DOM has updated
    const timeoutId = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages, isLoading]);

  const startMonteCarloProgress = () => {
    if (monteCarloProgressTimer.current) {
      clearInterval(monteCarloProgressTimer.current);
    }
    setIsMonteCarloLoading(true);
    setMonteCarloProgress(5);
    setMonteCarloProgressStage('Starting Monte Carlo simulation...');
    monteCarloProgressTimer.current = setInterval(() => {
      setMonteCarloProgress(prev => {
        const increment = Math.random() * 7 + 3;
        const next = Math.min(prev + increment, 92);
        if (next >= 70) {
          setMonteCarloProgressStage('Summarizing price path percentiles...');
        } else if (next >= 40) {
          setMonteCarloProgressStage('Simulating hundreds of random price paths...');
        } else {
          setMonteCarloProgressStage('Loading local appreciation + volatility assumptions...');
        }
        return next;
      });
    }, 1200);
  };

  const stopMonteCarloProgress = (wasSuccessful: boolean) => {
    if (monteCarloProgressTimer.current) {
      clearInterval(monteCarloProgressTimer.current);
      monteCarloProgressTimer.current = null;
    }
    setMonteCarloProgress(100);
    setMonteCarloProgressStage(wasSuccessful ? 'Monte Carlo complete!' : 'Monte Carlo unavailable this time.');
    setTimeout(() => {
      setIsMonteCarloLoading(false);
      setMonteCarloProgress(0);
      setMonteCarloProgressStage('Starting Monte Carlo simulation...');
    }, 800);
  };

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
        const cleanText = text.replace(/[📊🏠💵💰🔄💾]/gu, '').trim();
        
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
          const chartNames: Record<ChartType, string> = {
            netWorth: 'Net Worth Comparison',
            monthlyCost: 'Monthly Costs Breakdown',
            totalCost: 'Total Cost Comparison',
            equity: 'Equity Buildup',
            rentGrowth: 'Rent Growth Comparison',
            breakEven: 'Break-Even Timeline',
            cashFlow: 'Cash Flow Timeline',
            cumulativeCost: 'Cumulative Cost Comparison',
            liquidity: 'Liquidity Timeline',
            taxSavings: 'Tax Savings Timeline',
            breakEvenHeatmap: 'Break-Even Heatmap',
            monteCarlo: 'Monte Carlo Simulation',
            sensitivity: 'Sensitivity Analysis',
            scenarioOverlay: 'Scenario Overlay'
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
              
            } catch {
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
        content: "Welcome. I'm your financial advisor for home-buying decisions. I'll analyze your local market and show you how buying compares to renting over time.\n\nYou can start by:\n• providing a ZIP code (e.g., 92127) so I can pull local market data, or\n• telling me the home price and rent you want to compare."
      }
    ]);
    setUserData({
      homePrice: null,
      monthlyRent: null,
      downPaymentPercent: null,
      timeHorizonYears: null
    });
    setChartData(null);
    setChartsReady(false);
    setMonthlyCosts(null);
    setTotalCostData(null);
    setAdvancedMetrics({
      cashFlow: null,
      cumulativeCosts: null,
      liquidityTimeline: null,
      taxSavings: null
    });
    setHeatmapData(null);
    setMonteCarloData(null);
    setSensitivityData(null);
    setScenarioOverlayData(null);
    setShowRestartModal(false);
    setLocationData(null);
    setCurrentZipCode(null); // Clear ZIP code
    setIsLocationLocked(false);
    setUsingZipData(false);
    setIsEditMode(false);
    setEditableValues(null);
    setIsReferenceBoxVisible(true);
    setHasShownScenarioSummary(false); // Reset scenario summary flag
    setRecommendation(null);
  };

  // Edit mode handlers
  const handleEditValues = () => {
    setIsEditMode(true);
    setEditableValues({ ...userData });
    setEditableAdvancedValues({ ...advancedInputs });
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditableValues(null);
    setEditableAdvancedValues(null);
  };

  const handleSaveEdit = async () => {
    if (!editableValues) return;
    
    const hasBasicChanges = 
      editableValues.homePrice !== userData.homePrice ||
      editableValues.monthlyRent !== userData.monthlyRent ||
      editableValues.downPaymentPercent !== userData.downPaymentPercent ||
      editableValues.timeHorizonYears !== userData.timeHorizonYears;

    const advancedSnapshot = editableAdvancedValues ?? advancedInputs;
    const advancedChanged =
      editableAdvancedValues !== null &&
      (
        editableAdvancedValues.loanTermYears !== advancedInputs.loanTermYears ||
        editableAdvancedValues.interestRate !== advancedInputs.interestRate ||
        editableAdvancedValues.propertyTaxRate !== advancedInputs.propertyTaxRate ||
        editableAdvancedValues.maintenanceRate !== advancedInputs.maintenanceRate ||
        editableAdvancedValues.homeInsuranceAnnual !== advancedInputs.homeInsuranceAnnual ||
        editableAdvancedValues.renterInsuranceAnnual !== advancedInputs.renterInsuranceAnnual ||
        editableAdvancedValues.hoaMonthly !== advancedInputs.hoaMonthly
      );
    
    if (!hasBasicChanges && !advancedChanged) {
      setIsEditMode(false);
      setEditableValues(null);
      setEditableAdvancedValues(null);
      const noChangeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "No changes were made to your scenario. Everything remains the same!"
      };
      setMessages(prev => [...prev, noChangeMessage]);
      return;
    }
    
    setUserData(editableValues);
    setAdvancedInputs(advancedSnapshot);
    setIsEditMode(false);
    setEditableValues(null);
    setEditableAdvancedValues(null);
    
    const analysisUpdate = await calculateAndShowChart(editableValues, locationData, advancedSnapshot);
    const fallbackNotice = analysisUpdate?.source === 'local'
      ? "\n\nHeads up: I'm using the built-in calculator while the analysis service reconnects."
      : '';

    // Add AI message acknowledging the change
    const changeMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Perfect! I've updated your scenario with the new values. The charts have been recalculated to reflect your changes. Check out the chart buttons above to explore different views!${fallbackNotice}`
    };
    setMessages(prev => [...prev, changeMessage]);

    // Generate and show new recommendation card with updated analysis
    if (analysisUpdate?.unifiedAnalysis && editableValues.timeHorizonYears) {
      const newRecommendation = generateRecommendation(analysisUpdate.unifiedAnalysis, editableValues.timeHorizonYears);
      
      // Add recommendation card as a special message in the chat flow
      // Store the recommendation data directly in the message so it persists
      const recommendationMessage: Message = {
        id: `recommendation-${Date.now()}`,
        role: 'assistant',
        content: '', // Empty content, we'll render the card instead
        showRecommendation: true,
        recommendation: newRecommendation,
        recommendationTimeline: editableValues.timeHorizonYears,
        recommendationLocation: locationData ? `${locationData.city}, ${locationData.state}` : undefined
      };
      setMessages(prev => [...prev, recommendationMessage]);
    }
  };

  // Recommendation card handlers
  const handleShowDetails = () => {
    // Add Net Worth chart message
    const chartMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: "Here's your net worth comparison over time. The higher line shows which option leaves you with more money.",
      chartToShow: 'netWorth',
      snapshotData: unifiedAnalysisResult ? {
        analysis: unifiedAnalysisResult,
        inputValues: {
          homePrice: userData.homePrice || 0,
          monthlyRent: userData.monthlyRent || 0,
          downPaymentPercent: userData.downPaymentPercent || 0,
          timeHorizonYears: userData.timeHorizonYears || 0,
        }
      } : undefined
    };
    setMessages(prev => [...prev, chartMessage]);
  };

  const handleTryNewScenario = () => {
    setIsEditMode(true);
    setEditableValues({ ...userData });
    setEditableAdvancedValues({ ...advancedInputs });
    // No automatic message - user can see the edit fields and make changes directly
  };

  const applyLocalMarketAutoFill = (zipCode: string | null, data: FormattedLocationData) => {
    const autoFilledData: UserData = {
      homePrice: data.medianHomePrice,
      monthlyRent: data.averageRent,
      downPaymentPercent: null,
      timeHorizonYears: null,
    };

    setUserData(autoFilledData);
    setLocationData(data);
    if (zipCode) {
      setCurrentZipCode(zipCode);
    }
    setIsLocationLocked(true);
    setUsingZipData(true);

    const rentLine = data.averageRent
      ? `$${data.averageRent.toLocaleString()}/mo`
      : 'rent data not available yet';

    return `Here is the local market snapshot for ${data.city}, ${data.state}${
      zipCode ? ` (ZIP ${zipCode})` : ''
    }:\n\n• Median home: $${data.medianHomePrice.toLocaleString()}\n• Typical rent: ${rentLine}\n• Property tax: ${data.propertyTaxRate.toFixed(
      2
    )}%\n\nShare your down payment percentage and how long you plan to stay so I can finish the analysis.`;
  };

  const handleBasicFieldChange = (field: keyof UserData, value: number | null) => {
    setEditableValues(prev => {
      const next = prev ? { ...prev } : { ...userData };
      next[field] = value;
      return next;
    });
  };

  const handleAdvancedFieldChange = (field: keyof AdvancedInputs, value: number) => {
    setEditableAdvancedValues(prev => {
      const next = prev ? { ...prev } : { ...advancedInputs };
      next[field] = value;
      return next;
    });
  };

  // Simple function to check if AI response indicates a chart should be shown
function shouldShowChart(aiResponse: string): ChartType | null {
  const lower = aiResponse.toLowerCase();
  
  // Check for chart trigger phrases (allows for "updated", "new", etc.)
  // Match patterns like: "here's your [updated/new] net worth comparison"
  const netWorthPattern = /here'?s (?:how )?(?:your )?(?:updated |new )?net worth comparison/;
  const monthlyPattern = /here'?s (?:how )?(?:your )?(?:updated |new )?monthly costs breakdown/;
  const totalPattern = /here'?s (?:how )?(?:your )?(?:updated |new )?total cost comparison/;
  const equityPattern = /here'?s (?:how )?(?:your )?(?:updated |new )?equity buildup/;
  const rentPattern = /here'?s (?:how )?(?:your )?(?:updated |new )?rent growth( chart| comparison)?/;
  const breakEvenPattern = /here'?s (?:how )?(?:your )?(?:updated |new )?break.?even timeline/;
  const cashFlowPattern = /here'?s (?:how )?(?:your )?(?:updated |new )?cash flow/;
  const cumulativePattern = /here'?s (?:how )?(?:your )?(?:updated |new )?cumulative (?:cost|spend)/;
  const liquidityPattern = /here'?s (?:how )?(?:your )?(?:updated |new )?liquidity timeline/;
  const taxPattern = /here'?s (?:how )?(?:your )?(?:updated |new )?tax savings/;
  const heatmapPattern = /here'?s (?:how )?(?:your )?(?:updated |new )?break.?even heatmap/;
  const montePattern = /here'?s (?:how )?(?:your )?(?:updated |new )?monte carlo simulation/;
  const sensitivityPattern = /here'?s (?:how )?(?:your )?(?:updated |new )?sensitivity (?:analysis|chart)/;
  const scenarioPattern = /here'?s (?:how )?(?:your )?(?:updated |new )?scenario (?:overlay|comparison)/;

  if (lower.match(netWorthPattern)) return 'netWorth';
  if (lower.match(monthlyPattern)) return 'monthlyCost';
  if (lower.match(totalPattern)) return 'totalCost';
  if (lower.match(equityPattern)) return 'equity';
  if (lower.match(rentPattern)) return 'rentGrowth';
  if (lower.match(breakEvenPattern)) return 'breakEven';
  if (lower.match(cashFlowPattern)) return 'cashFlow';
  if (lower.match(cumulativePattern)) return 'cumulativeCost';
  if (lower.match(liquidityPattern)) return 'liquidity';
  if (lower.match(taxPattern)) return 'taxSavings';
  if (lower.match(heatmapPattern)) return 'breakEvenHeatmap';
  if (lower.match(montePattern)) return 'monteCarlo';
  if (lower.match(sensitivityPattern)) return 'sensitivity';
  if (lower.match(scenarioPattern)) return 'scenarioOverlay';
  
  return null;
}

  // Keyboard shortcuts - placed after function declarations
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // COMPLETELY IGNORE arrow keys - let Joyride handle them
      const isArrowKey = e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown';
      if (isArrowKey) {
        // Check if event is coming from or targeting Joyride elements
        const target = e.target as HTMLElement;
        const isFromJoyride = target?.closest('[class*="react-joyride"]') !== null;
        const hasJoyrideOverlay = !!document.querySelector('.react-joyride__overlay');
        const hasJoyrideTooltip = !!document.querySelector('[class*="react-joyride__tooltip"]');
        const tourActive = hasJoyrideOverlay || hasJoyrideTooltip || isFromJoyride;
        
        console.log(`[Keyboard Handler] Arrow key pressed: ${e.key}`, {
          tourActive,
          isFromJoyride,
          hasJoyrideOverlay,
          hasJoyrideTooltip,
          defaultPrevented: e.defaultPrevented,
          target: target?.tagName,
          targetClass: target?.className,
          action: 'Completely ignoring - letting Joyride handle'
        });
        
        // If tour is active, do absolutely nothing - let event bubble to Joyride
        // Even if tour not active, we don't handle arrow keys anyway
        return;
      }
      
      // Don't trigger shortcuts when user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Cmd/Ctrl + Enter to send message (only when in chat input)
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && target.classList.contains('chat-input')) {
          e.preventDefault();
          const input = target as HTMLInputElement;
          if (input && input.value.trim()) {
            handleSendMessage(input.value);
            input.value = '';
          }
        }
        return; // Don't process other shortcuts when typing
      }
      
      // Cmd/Ctrl + R to restart (prevent default browser refresh)
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        if (window.confirm('Start over? This will clear all your data.')) {
          handleRestart();
        }
      }
      
      // Cmd/Ctrl + S to save PDF
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveChat();
      }
    };

    // Use normal bubbling phase (not capture) so we don't intercept before Joyride
    // Arrow keys are completely ignored in our handler, so they pass through to Joyride
    document.addEventListener('keydown', handleKeyPress, false);
    return () => document.removeEventListener('keydown', handleKeyPress, false);
  }, []); // Functions are stable, empty deps is fine

  const handleSendMessage = async (content: string) => {
    const trimmed = content.trim();
    const assumptionHint = extractAssumptionHints(trimmed);
    const numberCount = (trimmed.match(/\d+(?:,\d{3})*(?:\.\d+)?/g) ?? []).length;
    const hasBaseInputs = userData.homePrice != null && userData.monthlyRent != null;
    const onlyAssumptions =
      hasBaseInputs &&
      (assumptionHint.downPayment !== undefined || assumptionHint.timeHorizon !== undefined) &&
      numberCount <= 2 &&
      !/\b(home|rent|price|mortgage|payment|loan|value|cost)\b/i.test(trimmed) &&
      !detectZipCode(trimmed);
    const normalizedContent = onlyAssumptions ? buildAssumptionSentence(assumptionHint) : trimmed;
    // PATH 14: Check if user is changing their mind after making a choice
    if (isLocationLocked && locationData) {
      const lowerContent = content.toLowerCase();
      
      // User chose ZIP data but now wants custom
      if (usingZipData && ((lowerContent.includes('actually') || lowerContent.includes('wait')) && (lowerContent.includes('my own') || lowerContent.includes('custom') || lowerContent.includes('enter')))) {
        // Reset location data
        setIsLocationLocked(false);
        setUsingZipData(false);
        setLocationData(null);
        setCurrentZipCode(null); // Clear ZIP code
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
        // Using ZIP data
        setUsingZipData(true);
        setUserData({
          homePrice: locationData.medianHomePrice,
          monthlyRent: locationData.averageRent || null,
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
    
  const trimmedContent = content.trim();
  const zipOnlyMatch = trimmedContent.match(/^(?:zip\s*)?(\d{5})$/i);
  if (zipOnlyMatch) {
    const zipCodeOnly = zipOnlyMatch[1];
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };
    setMessages((prev) => [...prev, userMessage]);

    const rawLocation = getLocationData(zipCodeOnly);
    if (!rawLocation) {
      const invalidZipMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I couldn't find market data for ZIP code ${zipCodeOnly}. Could you double-check it or share a nearby ZIP?`,
      };
      setMessages((prev) => [...prev, invalidZipMessage]);
      setIsLoading(false);
      setIsAnalyzing(false);
      return;
    }

    const formattedLocation = formatLocationData(rawLocation);
    const summaryText = applyLocalMarketAutoFill(zipCodeOnly, formattedLocation);
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: summaryText,
    };
    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
    setIsAnalyzing(false);
    return;
  }

  // Add user message
  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content,
  };
    
  setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
    // Extract data from message using AI
    const extractionResult = onlyAssumptions
      ? {
          userData: {
            ...userData,
            downPaymentPercent:
              assumptionHint.downPayment !== undefined
                ? assumptionHint.downPayment
                : userData.downPaymentPercent,
            timeHorizonYears:
              assumptionHint.timeHorizon !== undefined
                ? assumptionHint.timeHorizon
                : userData.timeHorizonYears,
          },
          locationData: null,
        }
      : await extractUserDataWithAI(normalizedContent, userData);

    const { userData: newUserData, locationData: detectedLocationData } = extractionResult;
    
    // Debug logging
    
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
    
    // Check if user mentioned a city but no ZIP code was provided
    const cityMention = detectCityMention(content);
    if (cityMention && !zipCode && !detectedLocationData) {
      // User mentioned a city but didn't provide a ZIP code
      const cityName = cityMention.city || 'that area';
      const cityMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I'd love to help you analyze ${cityName}! To get accurate local market data (property taxes, home appreciation rates, and rent growth), I'll need a ZIP code for that area. Could you provide a ZIP code? For example, if you're looking in Los Angeles, you might use 90035 or 90210.`
      };
      setMessages(prev => [...prev, cityMessage]);
      setIsLoading(false);
      return;
    }
    
    // Handle location data if detected
    if (detectedLocationData) {
      setLocationData(detectedLocationData);
      setCurrentZipCode(zipCode); // Store ZIP code for ML predictions
      
      // Check if user also provided custom values in the same message
      const hasCustomValues = newUserData.homePrice || newUserData.downPaymentPercent;
      
      // Check if user provided rent with ZIP (new flow)
      const hasCustomRent = newUserData.monthlyRent && !newUserData.homePrice;
      
      if (hasCustomValues) {
        // PATH 10: NEW FLOW - ZIP + Custom Home Price
        // User provided their own home price + ZIP code
        setUserData(newUserData);
        setLocationData(detectedLocationData);
        setCurrentZipCode(zipCode); // Store ZIP code for ML predictions
        setIsLocationLocked(true);
        setUsingZipData(true);
        
        // Check if we have ALL data - if so, run analysis immediately
        const hasAllDataNow = newUserData.homePrice && newUserData.monthlyRent && newUserData.downPaymentPercent && newUserData.timeHorizonYears;
        
        if (hasAllDataNow) {
          // Run analysis in background
          setTimeout(async () => {
            const inputs = buildScenarioInputs(newUserData, detectedLocationData, null, advancedInputs);
            if (inputs) {
              const result = await runAnalysis(inputs, zipCode);
              setUnifiedAnalysisResult(result.unifiedAnalysis ?? null);
              applyAnalysis(result.analysis);
            }
          }, 100);
        }
        
        const newFlowMessage: Message = {
          id: Date.now().toString(),
      role: 'assistant',
          content: `Perfect! I'll use your $${newUserData.homePrice?.toLocaleString()} home price with the ${detectedLocationData.city}, ${detectedLocationData.state} market data for property taxes and growth rates. What's your current monthly rent, down payment percentage, and how long do you plan to stay in this home?`
        };
        setMessages(prev => [...prev, newFlowMessage]);
        setIsLoading(false);
        return; // Continue with custom rent collection
      }
      
      if (hasCustomRent) {
        // PATH 11: NEW FLOW - ZIP + Custom Rent
        // User provided their own rent + ZIP code
        setUserData(newUserData);
        setLocationData(detectedLocationData);
        setCurrentZipCode(zipCode); // Store ZIP code for ML predictions
        setIsLocationLocked(true);
        setUsingZipData(true);
        
        const newFlowMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Perfect! I'll use your $${newUserData.monthlyRent?.toLocaleString()}/month rent with the ${detectedLocationData.city}, ${detectedLocationData.state} market data for property taxes and growth rates. What home price are you considering, down payment percentage, and how long do you plan to stay in this home?`
        };
        setMessages(prev => [...prev, newFlowMessage]);
        setIsLoading(false);
        return; // Continue with custom home price collection
      }
      
      const summaryText = applyLocalMarketAutoFill(zipCode ?? null, detectedLocationData);
      const autoFillMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: summaryText
      };
      setMessages(prev => [...prev, autoFillMessage]);
      setIsLoading(false);
      return;
    }
    
    // If we get here, no ZIP was detected or user provided custom values
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
    let analysisInputs: ScenarioInputs | null = null;
    let analysisResult: CalculatorOutput | null = null;
    // unifiedAnalysisResult is now a state variable, so we update it instead of creating a local one
    let analysisSource: 'backend' | 'local' | null = null;
    let analysisApplied = false;

    if (hasAllData && dataChanged) {
      setHeatmapData(null);
      setIsAnalyzing(true); // Mark that we're doing full analysis
      setLoadingProgress({ stage: 'Starting analysis...', progress: 0 }); // Reset progress
      
      // Show a message that this may take a moment
      const processingMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Perfect! I'm calculating your analysis. This may take a minute while I crunch every month for the next " + newUserData.timeHorizonYears + " years using the local appreciation, rent growth, and cost assumptions. Thanks for your patience!"
      };
      setMessages(prev => [...prev, processingMessage]);
      const inputs = buildScenarioInputs(newUserData, locationData, unifiedAnalysisResult, advancedInputs);

      if (inputs) {
        analysisInputs = inputs;

        const { analysis, unifiedAnalysis, source } = await runAnalysis(inputs, currentZipCode);
        setLoadingProgress({ stage: 'Complete!', progress: 100 }); // Set to complete
        setIsAnalyzing(false); // Done with analysis
        analysisResult = analysis;
        setUnifiedAnalysisResult(unifiedAnalysis ?? null);
        
        // Generate and show recommendation
        if (unifiedAnalysis && newUserData.timeHorizonYears) {
          const recommendation = generateRecommendation(unifiedAnalysis, newUserData.timeHorizonYears);
          
          // Add recommendation card as a special message in the chat flow
          // Store the recommendation data directly in the message so it persists
          // This will appear right after the analysis completes
          const recommendationMessage: Message = {
            id: `recommendation-${Date.now()}`,
            role: 'assistant',
            content: '', // Empty content, we'll render the card instead
            showRecommendation: true,
            recommendation: recommendation,
            recommendationTimeline: newUserData.timeHorizonYears,
            recommendationLocation: locationData ? `${locationData.city}, ${locationData.state}` : undefined
          };
          setMessages(prev => [...prev, recommendationMessage]);
        }
        
        // Verify it was set correctly
        
        analysisSource = source;
        analysisApplied = true;

        freshChartData = analysis.monthlySnapshots;
        freshMonthlyCosts = {
          buying: analysis.monthlyCosts,
          renting: analysis.rentingCosts
        };
        freshTotalCostData = analysis.totals;

        applyAnalysis(analysis);

        // Skip scenario summary if we're showing a recommendation (recommendation card already has the key info)
        const willShowRecommendation = unifiedAnalysis && newUserData.timeHorizonYears;
        
        // Add scenario summary message (only once per scenario, and only if no recommendation)
        if (!hasShownScenarioSummary && !willShowRecommendation && newUserData.homePrice && newUserData.monthlyRent && newUserData.downPaymentPercent && newUserData.timeHorizonYears) {
          const locationText = locationData 
            ? ` in ${locationData.city}, ${locationData.state}`
            : '';
          
          // Get ML rates from the unifiedAnalysis that was just returned
          const mlHomeRate = unifiedAnalysis ? ((unifiedAnalysis as any)?.home_appreciation_rate ?? unifiedAnalysis?.homeAppreciationRate) : undefined;
          const mlRentRate = unifiedAnalysis ? ((unifiedAnalysis as any)?.rent_growth_rate ?? unifiedAnalysis?.rentGrowthRate) : undefined;
          
          let ratesText = '';
          // Show ML rates if they exist and are valid numbers
          const hasValidMLRates = mlHomeRate !== undefined && mlRentRate !== undefined && 
                                   !isNaN(mlHomeRate) && !isNaN(mlRentRate) &&
                                   mlHomeRate !== 0 && mlRentRate !== 0; // 0 would be suspicious
          
        if (hasValidMLRates) {
          ratesText = `\n• Growth assumptions: ${mlHomeRate.toFixed(2)}% home appreciation, ${mlRentRate.toFixed(2)}% rent growth`;
          } else if (locationData) {
            ratesText = `\n• Using local market data for growth rates`;
          }
          
          const summaryMessage: Message = {
            id: (Date.now() - 1).toString(),
            role: 'assistant',
            content: `Great, here's the scenario I'm analyzing:\n\n• Home: $${newUserData.homePrice.toLocaleString()}${locationText}\n• Rent: $${newUserData.monthlyRent.toLocaleString()}/month\n• Down payment: ${newUserData.downPaymentPercent}%\n• Time horizon: ${newUserData.timeHorizonYears} years${ratesText}`
          };
          
          setMessages(prev => [...prev, summaryMessage]);
          setHasShownScenarioSummary(true);
        }
        
        // Add recommendation card message if we have recommendation (skip scenario summary in this case)
        if (willShowRecommendation) {
          setTimeout(() => {
            if (recommendation && unifiedAnalysis && newUserData.timeHorizonYears) {
              const recommendationMessage: Message = {
                id: `recommendation-${Date.now()}`,
                role: 'assistant',
                content: '', // Empty content, we'll render the card instead
                showRecommendation: true
              };
              setMessages(prev => {
                // Only add if not already present
                if (prev.some(m => m.showRecommendation)) {
                  return prev;
                }
                return [...prev, recommendationMessage];
              });
            }
          }, 100);
          setHasShownScenarioSummary(true); // Mark as shown so we don't show scenario summary later
        }
      }
    }

    if (hasAllData && !analysisApplied) {
      const calcResult = await calculateAndShowChart(newUserData, locationData, advancedInputs);

      if (calcResult) {
        analysisInputs = analysisInputs ?? calcResult.inputs;
        analysisResult = analysisResult ?? calcResult.analysis;
        analysisSource = analysisSource ?? calcResult.source;
        analysisApplied = true;

        freshChartData = calcResult.analysis.monthlySnapshots;
        freshMonthlyCosts = {
          buying: calcResult.analysis.monthlyCosts,
          renting: calcResult.analysis.rentingCosts
        };
        freshTotalCostData = calcResult.analysis.totals;

        // Skip scenario summary if we're showing a recommendation (recommendation card already has the key info)
        const unifiedAnalysis = calcResult.unifiedAnalysis ?? unifiedAnalysisResult;
        const willShowRecommendation = unifiedAnalysis && newUserData.timeHorizonYears;
        
        // Add scenario summary message BEFORE any chart messages (only once per scenario, and only if no recommendation)
        if (!hasShownScenarioSummary && !willShowRecommendation && newUserData.homePrice && newUserData.monthlyRent && newUserData.downPaymentPercent && newUserData.timeHorizonYears) {
          const locationText = locationData 
            ? ` in ${locationData.city}, ${locationData.state}`
            : '';
          
          // Get ML rates from the unifiedAnalysis that was just returned (not from state, which may be stale)
          const mlHomeRate = unifiedAnalysis ? ((unifiedAnalysis as any)?.home_appreciation_rate ?? unifiedAnalysis?.homeAppreciationRate) : undefined;
          const mlRentRate = unifiedAnalysis ? ((unifiedAnalysis as any)?.rent_growth_rate ?? unifiedAnalysis?.rentGrowthRate) : undefined;
          
          let ratesText = '';
          // Show ML rates if they exist and are valid numbers
          const hasValidMLRates = mlHomeRate !== undefined && mlRentRate !== undefined && 
                                   !isNaN(mlHomeRate) && !isNaN(mlRentRate) &&
                                   mlHomeRate !== 0 && mlRentRate !== 0; // 0 would be suspicious
          
        if (hasValidMLRates) {
          ratesText = `\n• Growth assumptions: ${mlHomeRate.toFixed(2)}% home appreciation, ${mlRentRate.toFixed(2)}% rent growth`;
          } else if (locationData) {
            ratesText = `\n• Using local market data for growth rates`;
          }
          
          const summaryMessage: Message = {
            id: (Date.now() - 1).toString(), // Use timestamp - 1 to ensure it appears before the chart message
            role: 'assistant',
            content: `Great, here's the scenario I'm analyzing:\n\n• Home: $${newUserData.homePrice.toLocaleString()}${locationText}\n• Rent: $${newUserData.monthlyRent.toLocaleString()}/month\n• Down payment: ${newUserData.downPaymentPercent}%\n• Time horizon: ${newUserData.timeHorizonYears} years${ratesText}`
          };
          
          setMessages(prev => [...prev, summaryMessage]);
          setHasShownScenarioSummary(true);
        }
        
        // Add recommendation card message if we have recommendation (skip scenario summary in this case)
        if (willShowRecommendation) {
          setTimeout(() => {
            if (recommendation && unifiedAnalysis && newUserData.timeHorizonYears) {
              const recommendationMessage: Message = {
                id: `recommendation-${Date.now()}`,
                role: 'assistant',
                content: '', // Empty content, we'll render the card instead
                showRecommendation: true
              };
              setMessages(prev => {
                // Only add if not already present
                if (prev.some(m => m.showRecommendation)) {
                  return prev;
                }
                return [...prev, recommendationMessage];
              });
            }
          }, 100);
          setHasShownScenarioSummary(true); // Mark as shown so we don't show scenario summary later
        }
      }
    }

    // Check if user is asking for a chart and we already have analysis data
    // If so, skip the slow AI call and go straight to chart detection
    const contentLower = content.toLowerCase();
    const isChartRequest = hasAllData && analysisResult && (
      contentLower.includes('show') || 
      contentLower.includes('chart') || 
      contentLower.includes('graph') ||
      contentLower.includes('net worth') ||
      contentLower.includes('monthly cost') ||
      contentLower.includes('total cost') ||
      contentLower.includes('equity') ||
      contentLower.includes('break even') ||
      contentLower.includes('cash flow') ||
      contentLower.includes('monte carlo') ||
      contentLower.includes('sensitivity') ||
      contentLower.includes('heatmap')
    );
    
    // Get AI response (skip if it's just a chart request and we have data)
    const allMessages = [...messages, userMessage].map(m => ({
      role: m.role,
      content: m.content
    }));
    
    let botResponse: string;
    if (isChartRequest) {
      // For chart requests, use a fast fallback response instead of waiting for AI
      botResponse = "Sure! Let me show you that chart.";
    } else {
      try {
        botResponse = await getAIResponse(allMessages, newUserData);
      } catch (error) {
        console.error('AI response failed, using fallback:', error);
        // Fallback response if AI fails
        if (hasAllData && analysisResult) {
          botResponse = "Perfect! I've calculated your analysis. Want to see how your wealth builds up over time? I can show you your Net Worth Comparison!";
        } else {
          botResponse = "Got it! I'm processing your information. What else would you like to know?";
        }
      }
    }

    // Check if user directly requested a chart (faster than waiting for AI)
    let chartToShow: ChartType | null = null;
    if (isChartRequest && hasAllData && analysisResult) {
      // Direct chart detection from user input
      if (contentLower.includes('net worth')) chartToShow = 'netWorth';
      else if (contentLower.includes('monthly cost')) chartToShow = 'monthlyCost';
      else if (contentLower.includes('total cost')) chartToShow = 'totalCost';
      else if (contentLower.includes('equity')) chartToShow = 'equity';
      else if (contentLower.includes('rent growth') || contentLower.includes('rent growth')) chartToShow = 'rentGrowth';
      else if (contentLower.includes('break even') && contentLower.includes('heatmap')) chartToShow = 'breakEvenHeatmap';
      else if (contentLower.includes('break even')) chartToShow = 'breakEven';
      else if (contentLower.includes('cash flow')) chartToShow = 'cashFlow';
      else if (contentLower.includes('cumulative')) chartToShow = 'cumulativeCost';
      else if (contentLower.includes('liquidity')) chartToShow = 'liquidity';
      else if (contentLower.includes('tax')) chartToShow = 'taxSavings';
      else if (contentLower.includes('monte carlo')) chartToShow = 'monteCarlo';
      else if (contentLower.includes('sensitivity')) chartToShow = 'sensitivity';
      else if (contentLower.includes('scenario')) chartToShow = 'scenarioOverlay';
    }
    
    // If no direct match, check AI response
    if (!chartToShow) {
      chartToShow = shouldShowChart(botResponse);
    }
    let heatmapPointsResult: BreakEvenHeatmapPoint[] | null = null;
    let sensitivityResult: SensitivityResult[] | null = null;
    let scenarioOverlayResult: ScenarioResult[] | null = null;
    
    if (chartToShow === 'breakEvenHeatmap') {
      // Always build fresh inputs from current user data to ensure heatmap uses latest values
      setHeatmapData(null); // Clear old cached data
      const baseInputs = buildScenarioInputs(newUserData, locationData, unifiedAnalysisResult, advancedInputs);
      if (baseInputs) {
        setChartLoading({ type: 'breakEvenHeatmap', progress: 10, message: 'Calculating break-even points...' });
        try {
          heatmapPointsResult = await loadHeatmapData(baseInputs);
          
          // Only mark as complete when data is actually ready
          if (heatmapPointsResult && heatmapPointsResult.length > 0) {
            setChartLoading({ type: 'breakEvenHeatmap', progress: 100, message: 'Complete!' });
            // Update the message's snapshotData with the loaded data
            setMessages(prev => prev.map(msg => 
              msg.chartToShow === 'breakEvenHeatmap' && msg.snapshotData
                ? { ...msg, snapshotData: { ...msg.snapshotData, heatmapPoints: heatmapPointsResult } }
                : msg
            ));
            setTimeout(() => setChartLoading({ type: null, progress: 0, message: '' }), 300);
          } else {
            setChartLoading({ type: null, progress: 0, message: '' });
          }
        } catch (error) {
          setChartLoading({ 
            type: 'breakEvenHeatmap',
            progress: 0,
            message: 'Heatmap data failed to load. Please try again.'
          });
          setTimeout(() => setChartLoading({ type: null, progress: 0, message: '' }), 3000);
          console.error('Failed to load heatmap data:', error);
        }
      }
    }
    
    if (chartToShow === 'monteCarlo') {
      // Load Monte Carlo simulation data using unified analysis endpoint
      // This ensures we get the new HomePricePathSummary format
      const baseInputs = buildScenarioInputs(newUserData, locationData, unifiedAnalysisResult, advancedInputs);
      if (baseInputs) {
        // Use unified chart loading system
        setChartLoading({ type: 'monteCarlo', progress: 5, message: 'Starting Monte Carlo simulation...' });
        startMonteCarloProgress(); // Keep old system for the separate card too
        
        try {
          // Show initial progress
          setChartLoading({ type: 'monteCarlo', progress: 10, message: 'Starting Monte Carlo simulation...' });
          
          // Add timeout wrapper - if it takes more than 2 minutes, show error
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Monte Carlo simulation timed out after 2 minutes. The backend may be overloaded.')), 120000);
          });
          
          // Use unified analysis endpoint with includeMonteCarlo: true
          const analyzePromise = analyzeScenario(baseInputs, false, currentZipCode || undefined, true, DEFAULT_MONTE_CARLO_RUNS);
          
          // Update progress during the wait (but don't go to 100% until data is ready)
          const progressInterval = setInterval(() => {
            setChartLoading(prev => {
              if (prev.type !== 'monteCarlo') return prev;
              // Only go up to 90% - don't hit 100% until data is actually ready
              const increment = Math.random() * 3 + 1;
              const next = Math.min(prev.progress + increment, 90);
              let message = 'Generating random price paths...';
              if (next >= 70) {
                message = 'Summarizing price path percentiles...';
              } else if (next >= 40) {
                message = 'Simulating hundreds of random price paths...';
              }
              return { ...prev, progress: next, message };
            });
          }, 2000); // Update every 2 seconds
          
          const response = await Promise.race([analyzePromise, timeoutPromise]) as Awaited<ReturnType<typeof analyzeScenario>>;
          const mcData = (response.analysis as any)?.monte_carlo_home_prices ?? response.analysis?.monteCarloHomePrices;
          
          clearInterval(progressInterval);
          
          // Only mark as complete when data is actually ready
          if (mcData && (mcData.years || mcData.runs)) {
            // Update unifiedAnalysisResult with Monte Carlo data
            const updatedAnalysis = unifiedAnalysisResult ? {
              ...unifiedAnalysisResult,
              monteCarloHomePrices: mcData
            } : null;
            if (updatedAnalysis) {
              setUnifiedAnalysisResult(updatedAnalysis);
            }
            setChartLoading({ type: 'monteCarlo', progress: 100, message: 'Complete!' });
            // Update the message's snapshotData with the loaded data
            setMessages(prev => prev.map(msg => 
              msg.chartToShow === 'monteCarlo' && msg.snapshotData
                ? { 
                    ...msg, 
                    snapshotData: { 
                      ...msg.snapshotData, 
                      analysis: updatedAnalysis ?? msg.snapshotData.analysis,
                      monteCarlo: mcData
                    } 
                  }
                : msg
            ));
            stopMonteCarloProgress(true);
            setTimeout(() => setChartLoading({ type: null, progress: 0, message: '' }), 300);
          } else {
            console.warn('Monte Carlo data not found in response');
            setChartLoading({ 
              type: 'monteCarlo', 
              progress: 0, 
              message: 'Monte Carlo data not available. Please try again.' 
            });
            stopMonteCarloProgress(false);
            setTimeout(() => setChartLoading({ type: null, progress: 0, message: '' }), 3000);
          }
        } catch (error) {
          console.error('Failed to load Monte Carlo data:', error);
          setChartLoading({ 
            type: 'monteCarlo',
            progress: 0,
            message: 'Monte Carlo simulation failed. Please try again.'
          });
          stopMonteCarloProgress(false);
          // Clear error after 5 seconds
          setTimeout(() => setChartLoading({ type: null, progress: 0, message: '' }), 5000);
        }
      }
    }
    
    if (chartToShow === 'sensitivity') {
      // Load sensitivity analysis data (default deltas: ±1% interest, ±10% price, ±10% rent)
      setSensitivityData(null); // Clear old cached data
      const baseInputs = buildScenarioInputs(newUserData, locationData, unifiedAnalysisResult, advancedInputs);
      if (baseInputs) {
        setChartLoading({ type: 'sensitivity', progress: 10, message: 'Running sensitivity analysis...' });
        try {
          sensitivityResult = await loadSensitivityData(baseInputs, 1.0, 0.1, 0.1);
          
          // Only mark as complete when data is actually ready
          if (sensitivityResult && sensitivityResult.length > 0) {
            setChartLoading({ type: 'sensitivity', progress: 100, message: 'Complete!' });
            // Update the message's snapshotData with the loaded data
            setMessages(prev => prev.map(msg => 
              msg.chartToShow === 'sensitivity' && msg.snapshotData
                ? { ...msg, snapshotData: { ...msg.snapshotData, sensitivity: sensitivityResult } }
                : msg
            ));
            setTimeout(() => setChartLoading({ type: null, progress: 0, message: '' }), 300);
          } else {
            setChartLoading({ type: null, progress: 0, message: '' });
          }
        } catch (error) {
          setChartLoading({ 
            type: 'sensitivity',
            progress: 0,
            message: 'Sensitivity analysis failed. Please try again.'
          });
          setTimeout(() => setChartLoading({ type: null, progress: 0, message: '' }), 3000);
          console.error('Failed to load sensitivity data:', error);
        }
      }
    }
    
    if (chartToShow === 'scenarioOverlay') {
      // Load scenario overlay data (for now, use current scenario as single scenario)
      // TODO: Allow users to specify multiple scenarios
      setScenarioOverlayData(null); // Clear old cached data
      const baseInputs = buildScenarioInputs(newUserData, locationData, unifiedAnalysisResult, advancedInputs);
      if (baseInputs) {
        setChartLoading({ type: 'scenarioOverlay', progress: 10, message: 'Preparing scenario comparison...' });
        try {
          const variants = buildScenarioVariants(baseInputs);
          scenarioOverlayResult = await loadScenarioOverlayData(variants);
          
          // Only mark as complete when data is actually ready
          if (scenarioOverlayResult && scenarioOverlayResult.length > 0) {
            setChartLoading({ type: 'scenarioOverlay', progress: 100, message: 'Complete!' });
            // Update the message's snapshotData with the loaded data
            setMessages(prev => prev.map(msg => 
              msg.chartToShow === 'scenarioOverlay' && msg.snapshotData
                ? { ...msg, snapshotData: { ...msg.snapshotData, scenarioOverlay: scenarioOverlayResult } }
                : msg
            ));
            setTimeout(() => setChartLoading({ type: null, progress: 0, message: '' }), 300);
          } else {
            setChartLoading({ type: null, progress: 0, message: '' });
          }
        } catch (error) {
          setChartLoading({ 
            type: 'scenarioOverlay',
            progress: 0,
            message: 'Scenario comparison failed. Please try again.'
          });
          setTimeout(() => setChartLoading({ type: null, progress: 0, message: '' }), 3000);
          console.error('Failed to load scenario overlay data:', error);
        }
      }
    }
    
    const responseContent = botResponse;
    
    const currentMonteCarloSummary =
      unifiedAnalysisResult?.monteCarloHomePrices ??
      unifiedAnalysisResult?.monte_carlo_home_prices ??
      monteCarloData;

    const snapshotData = analysisResult && analysisInputs
      ? {
          ...buildSnapshotData(analysisResult, analysisInputs, currentMonteCarloSummary),
          analysis: unifiedAnalysisResult ?? undefined,
          cashFlow: advancedMetrics.cashFlow,
          cumulativeCosts: advancedMetrics.cumulativeCosts,
          liquidityTimeline: advancedMetrics.liquidityTimeline,
          taxSavings: advancedMetrics.taxSavings,
          heatmapPoints: heatmapPointsResult ?? heatmapData,
          sensitivity: sensitivityResult ?? sensitivityData,
          scenarioOverlay: scenarioOverlayResult ?? scenarioOverlayData
        }
      : (freshChartData && freshMonthlyCosts && freshTotalCostData && newUserData.homePrice && newUserData.monthlyRent && newUserData.downPaymentPercent
          ? {
              chartData: freshChartData,
              monthlyCosts: freshMonthlyCosts,
              totalCostData: freshTotalCostData,
              cashFlow: advancedMetrics.cashFlow,
              cumulativeCosts: advancedMetrics.cumulativeCosts,
              liquidityTimeline: advancedMetrics.liquidityTimeline,
              taxSavings: advancedMetrics.taxSavings,
              heatmapPoints: heatmapData ?? undefined,
              sensitivity: sensitivityData ?? undefined,
              scenarioOverlay: scenarioOverlayData ?? undefined,
              inputValues: {
                homePrice: newUserData.homePrice,
                monthlyRent: newUserData.monthlyRent,
                downPaymentPercent: newUserData.downPaymentPercent,
                timeHorizonYears: newUserData.timeHorizonYears ?? 0,
              }
            }
          : null);
    
    let assistantMessage: Message;
    if (chartToShow && (chartsReady || hasAllData) && snapshotData) {
      // AI wants to show a chart and we have the data
      // If this is the first chart after showing the scenario summary, add an intro sentence
      let finalResponseContent = responseContent;
      if (chartToShow === 'monteCarlo' && !responseContent.toLowerCase().includes('takes a bit longer')) {
        finalResponseContent = `Heads up, this Monte Carlo simulation runs hundreds of price paths so it takes a bit longer than the other charts. I’ll show it as soon as it’s ready.\n\n${finalResponseContent}`;
      }
      if (
        chartToShow === 'monthlyCost' &&
        hasShownScenarioSummary &&
        analysisApplied &&
        !responseContent.toLowerCase().includes("let's start")
      ) {
        // This is the first chart after summary - add a brief intro if not already present
        finalResponseContent = `Let's start with a simple monthly cost comparison. Then we can look at net worth, equity, and risk.\n\n${responseContent}`;
      }
      
      assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
        content: finalResponseContent,
        chartToShow,
        snapshotData
      };
      
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
        content: responseContent
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
    setIsAnalyzing(false); // Reset analysis flag
    setLoadingProgress({ stage: 'Starting...', progress: 0 }); // Reset progress when done
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      setIsLoading(false);
      setIsAnalyzing(false); // Reset analysis flag on error
      
      // Show error message to user
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I didn't quite catch that. Could you share the home price, monthly rent, down payment %, and timeline you're comparing? Mention a ZIP or city if you want me to refresh the local assumptions."
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

// Handle suggestion chip clicks
const handleChipClick = (message: string) => {
    // Handle chip click as a normal message - let AI handle everything
    handleSendMessage(message);
    
};

  // Converter: Transform new unified AnalysisResult to old CalculatorOutput format for backward compatibility
  // Helper to convert snake_case timeline point to camelCase
  const normalizeTimelinePoint = (point: any): TimelinePoint => {
    return {
      monthIndex: point.month_index ?? point.monthIndex ?? 0,
      year: point.year ?? 0,
      netWorthBuy: point.net_worth_buy ?? point.netWorthBuy ?? 0,
      netWorthRent: point.net_worth_rent ?? point.netWorthRent ?? 0,
      totalCostBuyToDate: point.total_cost_buy_to_date ?? point.totalCostBuyToDate ?? 0,
      totalCostRentToDate: point.total_cost_rent_to_date ?? point.totalCostRentToDate ?? 0,
      buyMonthlyOutflow: point.buy_monthly_outflow ?? point.buyMonthlyOutflow ?? 0,
      rentMonthlyOutflow: point.rent_monthly_outflow ?? point.rentMonthlyOutflow ?? 0,
      mortgagePayment: point.mortgage_payment ?? point.mortgagePayment ?? 0,
      propertyTaxMonthly: point.property_tax_monthly ?? point.propertyTaxMonthly ?? 0,
      insuranceMonthly: point.insurance_monthly ?? point.insuranceMonthly ?? 0,
      maintenanceMonthly: point.maintenance_monthly ?? point.maintenanceMonthly ?? 0,
      hoaMonthly: point.hoa_monthly ?? point.hoaMonthly ?? 0,
      principalPaid: point.principal_paid ?? point.principalPaid ?? 0,
      interestPaid: point.interest_paid ?? point.interestPaid ?? 0,
      remainingBalance: point.remaining_balance ?? point.remainingBalance ?? 0,
      homeValue: point.home_value ?? point.homeValue ?? 0,
      homeEquity: point.home_equity ?? point.homeEquity ?? 0,
      renterInvestmentBalance: point.renter_investment_balance ?? point.renterInvestmentBalance ?? 0,
      buyerCashAccount: point.buyer_cash_account ?? point.buyerCashAccount ?? 0,
    };
  };

  const convertAnalysisResultToCalculatorOutput = (result: AnalysisResult, inputs: ScenarioInputs): CalculatorOutput => {
    // Normalize timeline points (convert snake_case to camelCase)
    const timeline = result.timeline.map(normalizeTimelinePoint);
    const firstPoint = timeline[0];
    const lastPoint = timeline[timeline.length - 1];

    // Convert TimelinePoint[] to MonthlySnapshot[]
    const monthlySnapshots: MonthlySnapshot[] = timeline.map(point => ({
      month: point.monthIndex,
      mortgagePayment: point.mortgagePayment,
      principalPaid: point.principalPaid,
      interestPaid: point.interestPaid,
      remainingBalance: point.remainingBalance,
      homeValue: point.homeValue,
      homeEquity: point.homeEquity,
      monthlyBuyingCosts: point.buyMonthlyOutflow,
      monthlyRent: point.rentMonthlyOutflow,
      monthlyRentingCosts: point.rentMonthlyOutflow,
      investedDownPayment: point.renterInvestmentBalance,
      buyerNetWorth: point.netWorthBuy,
      renterNetWorth: point.netWorthRent,
      netWorthDelta: point.netWorthBuy - point.netWorthRent,
    }));

    // Build monthly costs (first month)
    const monthlyCosts: BuyingCostsBreakdown = {
      mortgage: firstPoint.mortgagePayment,
      propertyTax: firstPoint.propertyTaxMonthly,
      insurance: firstPoint.insuranceMonthly,
      hoa: firstPoint.hoaMonthly,
      maintenance: firstPoint.maintenanceMonthly,
      total: firstPoint.buyMonthlyOutflow,
    };

    // Build renting costs (first month)
    const rentingCosts: RentingCostsBreakdown = {
      rent: firstPoint.rentMonthlyOutflow,
      insurance: 0, // Not in unified structure, use 0 or calculate
      total: firstPoint.rentMonthlyOutflow,
    };

    // Build totals
    const totals: TotalCostSummary = {
      buyerFinalNetWorth: lastPoint.netWorthBuy,
      renterFinalNetWorth: lastPoint.netWorthRent,
      totalBuyingCosts: result.totalBuyCost,
      totalRentingCosts: result.totalRentCost,
      finalHomeValue: lastPoint.homeValue,
      finalInvestmentValue: lastPoint.renterInvestmentBalance,
    };

    // Build summary
    const summary: CalculatorSummary = {
      totalInterestPaid: timeline.reduce((sum, p) => sum + p.interestPaid, 0),
      totalPrincipalPaid: timeline.reduce((sum, p) => sum + p.principalPaid, 0),
      breakevenMonth: result.breakEven?.monthIndex ?? null,
      finalBuyerNetWorth: lastPoint.netWorthBuy,
      finalRenterNetWorth: lastPoint.netWorthRent,
      finalNetWorthDelta: lastPoint.netWorthBuy - lastPoint.netWorthRent,
    };

    // Build advanced metrics from timeline
    const cashFlow: CashFlowPoint[] = timeline.map(p => ({
      month: p.monthIndex,
      homeownerCashFlow: p.rentMonthlyOutflow - p.buyMonthlyOutflow,
      renterCashFlow: p.rentMonthlyOutflow,
    }));

    const cumulativeCosts: CumulativeCostPoint[] = timeline.map(p => {
      if (isNaN(p.totalCostBuyToDate) || isNaN(p.totalCostRentToDate)) {
        console.warn('⚠️ [CONVERT DEBUG] NaN in cumulativeCosts:', {
          month: p.monthIndex,
          totalCostBuyToDate: p.totalCostBuyToDate,
          totalCostRentToDate: p.totalCostRentToDate
        });
      }
      return {
        month: p.monthIndex,
        cumulativeBuying: p.totalCostBuyToDate,
        cumulativeRenting: p.totalCostRentToDate,
      };
    });

    const liquidityTimeline: LiquidityPoint[] = timeline.map(p => {
      if (isNaN(p.buyerCashAccount) || isNaN(p.renterInvestmentBalance)) {
        console.warn('⚠️ [CONVERT DEBUG] NaN in liquidityTimeline:', {
          month: p.monthIndex,
          buyerCashAccount: p.buyerCashAccount,
          renterInvestmentBalance: p.renterInvestmentBalance
        });
      }
      return {
        month: p.monthIndex,
        homeownerCashAccount: p.buyerCashAccount,
        renterInvestmentBalance: p.renterInvestmentBalance,
      };
    });

    // Calculate tax savings: group by year, sum interest + property tax, apply caps and tax bracket
    const taxSavings: TaxSavingsPoint[] = [];
    const DEFAULT_TAX_BRACKET = 0.24; // 24% default tax bracket
    
    // Group timeline points by year
    const pointsByYear = new Map<number, TimelinePoint[]>();
    timeline.forEach(point => {
      const year = point.year;
      if (!pointsByYear.has(year)) {
        pointsByYear.set(year, []);
      }
      pointsByYear.get(year)!.push(point);
    });
    
    // Calculate tax savings for each year
    pointsByYear.forEach((points, year) => {
      // Sum interest paid for the year
      const totalInterest = points.reduce((sum, p) => sum + p.interestPaid, 0);
      
      // Sum property tax for the year (propertyTaxMonthly * 12, but we have monthly values)
      const totalPropertyTax = points.reduce((sum, p) => sum + p.propertyTaxMonthly, 0);
      
      // Apply caps: $750k loan limit for interest deduction, $10k SALT limit for property tax
      const deductibleInterest = Math.min(totalInterest, 750000);
      const deductiblePropertyTax = Math.min(totalPropertyTax, 10000);
      
      // Calculate tax benefit: (deductible interest + deductible property tax) * tax bracket
      const totalTaxBenefit = (deductibleInterest + deductiblePropertyTax) * DEFAULT_TAX_BRACKET;
      
      taxSavings.push({
        year,
        deductibleMortgageInterest: deductibleInterest,
        deductiblePropertyTax: deductiblePropertyTax,
        totalTaxBenefit: totalTaxBenefit,
      });
    });
    
    // Sort by year
    taxSavings.sort((a, b) => a.year - b.year);

    return {
      inputs,
      monthlySnapshots,
      summary,
      monthlyCosts,
      rentingCosts,
      totals,
      cashFlow,
      cumulativeCosts,
      liquidityTimeline,
      taxSavings: taxSavings.length > 0 ? taxSavings : null, // Now properly calculated from timeline
    };
  };

  const runAnalysis = async (inputs: ScenarioInputs, zipCode?: string | null): Promise<{ analysis: CalculatorOutput; unifiedAnalysis?: AnalysisResult; source: 'backend' | 'local'; }> => {
    const includeMonteCarlo = true;
    const MONTE_CARLO_PATHS = DEFAULT_MONTE_CARLO_RUNS;
    
    // Progress indicator
    const progressStages = [
      { stage: 'Loading growth models...', progress: 15 },
      { stage: 'Predicting market rates...', progress: 35 },
      { stage: 'Calculating timeline...', progress: 60 },
      { stage: 'Finalizing analysis...', progress: 85 }
    ];
    
    setLoadingProgress(progressStages[0]); // Start with first stage
    if (includeMonteCarlo) {
      setChartLoading({ type: 'monteCarlo', progress: 10, message: 'Starting Monte Carlo simulation...' });
    }
    let currentStageIndex = 1;
    let progressCounter = 0;
    const progressInterval = setInterval(() => {
      if (currentStageIndex < progressStages.length) {
        setLoadingProgress(progressStages[currentStageIndex]);
        currentStageIndex++;
      } else {
        // Keep updating progress even after all stages, slowly incrementing to 95%
        progressCounter++;
        const baseProgress = progressStages[progressStages.length - 1].progress;
        const increment = Math.min(progressCounter * 0.5, 95 - baseProgress); // Slow increment
        setLoadingProgress({ 
          stage: progressStages[progressStages.length - 1].stage, 
          progress: Math.min(baseProgress + increment, 95) 
        });
      }
      if (includeMonteCarlo) {
        setChartLoading(prev => {
          if (prev.type !== 'monteCarlo') return prev;
          const increment = Math.random() * 4 + 1;
          const next = Math.min(prev.progress + increment, 95);
          let message = 'Generating Monte Carlo price paths...';
          if (next >= 70) {
            message = 'Summarizing percentile bands...';
          } else if (next >= 40) {
            message = 'Simulating hundreds of price paths...';
          }
          return { ...prev, progress: next, message };
        });
      }
    }, 2000); // Update every 2 seconds
    
    try {
      const response = await analyzeScenario(inputs, false, zipCode || undefined, includeMonteCarlo, MONTE_CARLO_PATHS);
      clearInterval(progressInterval);
      setLoadingProgress({ stage: 'Complete!', progress: 100 });
      // Small delay to show 100% before clearing
      setTimeout(() => {
        setLoadingProgress({ stage: 'Starting...', progress: 0 });
      }, 300);
      const { analysis } = response;
      
      // Check for Monte Carlo data in the response
      const mcData = (analysis as any)?.monte_carlo_home_prices ?? analysis?.monteCarloHomePrices;
      setMonteCarloData(mcData || null);
      if (includeMonteCarlo) {
        if (mcData) {
          setChartLoading({ type: 'monteCarlo', progress: 100, message: 'Complete!' });
          setTimeout(() => setChartLoading({ type: null, progress: 0, message: '' }), 500);
        } else {
          setChartLoading({ type: 'monteCarlo', progress: 0, message: 'Monte Carlo data unavailable' });
          setTimeout(() => setChartLoading({ type: null, progress: 0, message: '' }), 2000);
        }
      }
      
      if (!isBackendAvailable) {
        setIsBackendAvailable(true);
      }
      // Convert new unified structure to old format for backward compatibility
      const converted = convertAnalysisResultToCalculatorOutput(analysis, inputs);
      
      return { analysis: converted, unifiedAnalysis: analysis, source: 'backend' };
    } catch (error: any) {
      clearInterval(progressInterval);
      setLoadingProgress({ stage: 'Error occurred', progress: 0 });
      if (includeMonteCarlo) {
        setChartLoading({ type: 'monteCarlo', progress: 0, message: 'Monte Carlo failed' });
        setTimeout(() => setChartLoading({ type: null, progress: 0, message: '' }), 2000);
      }
      console.error('❌ [DEBUG] Failed to analyze scenario via backend:', error);
      
      // Check if it's a timeout error
      if (error?.message?.includes('timed out') || error?.message?.includes('timeout')) {
        console.warn('⚠️ Backend analysis timed out, using local fallback');
        // Don't show error message - just use local calculations silently
        // The user will still get results, just without ML predictions
      }
      
      if (isBackendAvailable) {
        setIsBackendAvailable(false);
      }
      const fallbackAnalysis = buildLocalAnalysis(inputs);
      return { analysis: fallbackAnalysis, source: 'local' };
    }
  };

  const loadHeatmapData = async (inputs: ScenarioInputs) => {
    try {
      const data = await fetchBreakEvenHeatmap({
        base: inputs,
        timelines: DEFAULT_HEATMAP_TIMELINES,
        downPayments: DEFAULT_HEATMAP_DOWN_PAYMENTS
      });
      setHeatmapData(data);
      return data;
    } catch (error) {
      console.error('Failed to load heatmap data:', error);
      return null;
    }
  };

  const loadSensitivityData = async (baseInputs: ScenarioInputs, interestRateDelta = 1.0, homePriceDelta = 0.1, rentDelta = 0.1) => {
    try {
      const data = await fetchSensitivity({
        base: baseInputs,
        interestRateDelta,
        homePriceDelta,
        rentDelta
      });
      setSensitivityData(data);
      return data;
    } catch (error) {
      console.error('Failed to load sensitivity data:', error);
      return null;
    }
  };

  const loadScenarioOverlayData = async (scenarios: ScenarioInputs[]) => {
    try {
      const data = await fetchScenarios({ scenarios });
      setScenarioOverlayData(data);
      return data;
    } catch (error) {
      console.error('Failed to load scenario overlay data:', error);
      return null;
    }
  };

  const calculateAndShowChart = async (
    data: UserData,
    currentLocationData?: FormattedLocationData | null,
    advancedOverride?: AdvancedInputs
  ) => {
    const inputs = buildScenarioInputs(
      data,
      currentLocationData,
      unifiedAnalysisResult ?? null,
      advancedOverride ?? advancedInputs
    );
    if (!inputs) return null;

    const result = await runAnalysis(inputs, currentZipCode);
    applyAnalysis(result.analysis);
    // Update unified analysis result
    if (result.unifiedAnalysis) {
      setUnifiedAnalysisResult(result.unifiedAnalysis);
    }

    return {
      analysis: result.analysis,
      unifiedAnalysis: result.unifiedAnalysis,
      source: result.source,
      inputs
    };
  };
  
  const buildScenarioInputs = (
    data: UserData,
    currentLocationData?: FormattedLocationData | null,
    analysisResult?: AnalysisResult | null,
    overrides?: AdvancedInputs
  ): ScenarioInputs | null => {
    // Safety check - if data is incomplete, return null early
    if (!data || data.homePrice == null || data.monthlyRent == null || 
        data.downPaymentPercent == null || data.timeHorizonYears == null) {
      return null;
    }

    const locationDataToUse = currentLocationData ?? locationData;
    const propertyTaxRate = overrides?.propertyTaxRate ?? (locationDataToUse?.propertyTaxRate
      ? locationDataToUse.propertyTaxRate * 100
      : 1.0);

    // Use rates from analysis result if available (ML predictions), otherwise fall back to ZIP/timeline rates
    let rateSource = locationDataToUse
      ? getZIPBasedRates(locationDataToUse, data.timeHorizonYears)
      : getTimelineBasedRates(data.timeHorizonYears);
    
    // Override with rates from analysis if available (these are the actual rates used in calculations)
    // This ensures frontend display matches backend calculations
    // Backend returns snake_case, so we need to check both formats
    const mlHomeRate = (analysisResult as any)?.home_appreciation_rate ?? analysisResult?.homeAppreciationRate;
    const mlRentRate = (analysisResult as any)?.rent_growth_rate ?? analysisResult?.rentGrowthRate;
    
    if (mlHomeRate !== undefined && mlRentRate !== undefined && rateSource) {
      rateSource = {
        ...rateSource,
        homeAppreciationRate: mlHomeRate,
        rentGrowthRate: mlRentRate
      };
    }

    return {
      homePrice: data.homePrice,
      downPaymentPercent: data.downPaymentPercent,
      interestRate: overrides?.interestRate ?? 7.0,
      loanTermYears: overrides?.loanTermYears ?? 30,
      timeHorizonYears: data.timeHorizonYears,
      monthlyRent: data.monthlyRent,
      propertyTaxRate,
      homeInsuranceAnnual: overrides?.homeInsuranceAnnual ?? 1200,
      hoaMonthly: overrides?.hoaMonthly ?? 150,
      maintenanceRate: overrides?.maintenanceRate ?? 1.0,
      renterInsuranceAnnual: overrides?.renterInsuranceAnnual ?? 240,
      homeAppreciationRate: rateSource.homeAppreciationRate,
      rentGrowthRate: rateSource.rentGrowthRate,
      investmentReturnRate: rateSource.investmentReturnRate
    };
  };

  const buildScenarioVariants = (base: ScenarioInputs): ScenarioInputs[] => {
    const variants: ScenarioInputs[] = [];
    const seen = new Set<string>();
    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

    const pushVariant = (variant: ScenarioInputs) => {
      const key = [
        variant.homePrice,
        variant.monthlyRent,
        variant.downPaymentPercent,
        variant.timeHorizonYears,
        variant.homeAppreciationRate,
        variant.rentGrowthRate,
        variant.investmentReturnRate
      ].join('|');
      if (!seen.has(key)) {
        seen.add(key);
        variants.push(variant);
      }
    };

    const addVariant = (updates: Partial<ScenarioInputs>) => {
      pushVariant({
        ...base,
        ...updates
      });
    };

    pushVariant(base);

    const priceStep = Math.max(20000, Math.round(base.homePrice * 0.1));
    addVariant({ homePrice: Math.max(50000, base.homePrice - priceStep) });
    addVariant({ homePrice: base.homePrice + priceStep });

    const rentStep = Math.max(150, Math.round(base.monthlyRent * 0.1));
    addVariant({ monthlyRent: Math.max(400, base.monthlyRent - rentStep) });
    addVariant({ monthlyRent: base.monthlyRent + rentStep });

    addVariant({ downPaymentPercent: clamp(base.downPaymentPercent + 5, 5, 90) });
    addVariant({ downPaymentPercent: clamp(base.downPaymentPercent - 5, 5, 90) });

    addVariant({ timeHorizonYears: clamp(base.timeHorizonYears + 5, 3, 40) });
    addVariant({ timeHorizonYears: clamp(base.timeHorizonYears - 3, 3, 40) });

    return variants.slice(0, 5);
  };
  
  // Helper function to render chart based on type - uses message's snapshot data
  const renderChart = (chartType: ChartType, snapshotData?: Message['snapshotData']) => {
    // First, declare all variables we need
    const analysis = snapshotData?.analysis;
    const timeline = analysis?.timeline?.map(normalizeTimelinePoint);
    const data = snapshotData?.chartData || chartData;
    const cashFlowSeries = snapshotData?.cashFlow ?? advancedMetrics?.cashFlow ?? null;
    const cumulativeSeries = snapshotData?.cumulativeCosts ?? advancedMetrics?.cumulativeCosts ?? null;
    const liquiditySeries = snapshotData?.liquidityTimeline ?? advancedMetrics?.liquidityTimeline ?? null;
    const taxSeries = snapshotData?.taxSavings ?? advancedMetrics?.taxSavings ?? null;
    const heatmapPoints = snapshotData?.heatmapPoints ?? heatmapData;
    const monteCarlo = snapshotData?.monteCarlo ?? monteCarloData;
    const sensitivity = snapshotData?.sensitivity ?? sensitivityData;
    const scenarioOverlay = snapshotData?.scenarioOverlay ?? scenarioOverlayData;
    
    // 🔍 DEBUG: Log when one of the problematic charts is requested
    if (chartType === 'breakEven' || chartType === 'liquidity' || chartType === 'scenarioOverlay') {
      console.log(`[${chartType.toUpperCase()}] renderChart called`, {
        chartType,
        hasSnapshotData: !!snapshotData,
        snapshotDataKeys: snapshotData ? Object.keys(snapshotData) : [],
        chartLoadingType: chartLoading.type,
        chartLoadingProgress: chartLoading.progress
      });
    }
    
    // Now check if data exists (after variables are declared)
    const hasData = (() => {
      switch (chartType) {
        case 'cashFlow':
          return !!(cashFlowSeries && cashFlowSeries.length > 0);
        case 'cumulativeCost':
          return !!(cumulativeSeries && cumulativeSeries.length > 0);
        case 'taxSavings':
          return !!(taxSeries && taxSeries.length > 0);
        case 'liquidity':
          const liquidityHasData = !!(liquiditySeries && liquiditySeries.length > 0);
          if (chartType === 'liquidity') {
            console.log('[LIQUIDITY] hasData check', {
              liquiditySeriesExists: !!liquiditySeries,
              liquiditySeriesLength: liquiditySeries?.length,
              liquiditySeriesType: typeof liquiditySeries,
              liquiditySeriesIsArray: Array.isArray(liquiditySeries),
              finalHasData: liquidityHasData
            });
          }
          return liquidityHasData;
        case 'monteCarlo':
          return !!(snapshotData?.analysis?.monteCarloHomePrices ?? snapshotData?.monteCarlo ?? monteCarlo);
        case 'sensitivity':
          return !!(sensitivity && sensitivity.length > 0);
        case 'breakEvenHeatmap':
          return !!(heatmapPoints && heatmapPoints.length > 0);
        case 'scenarioOverlay':
          const scenarioOverlayHasData = !!(scenarioOverlay && scenarioOverlay.length > 0);
          if (chartType === 'scenarioOverlay') {
            console.log('[SCENARIO OVERLAY] hasData check', {
              scenarioOverlayExists: !!scenarioOverlay,
              scenarioOverlayLength: scenarioOverlay?.length,
              scenarioOverlayType: typeof scenarioOverlay,
              scenarioOverlayIsArray: Array.isArray(scenarioOverlay),
              finalHasData: scenarioOverlayHasData
            });
          }
          return scenarioOverlayHasData;
        case 'breakEven':
          // Check if we have timeline data (either from analysis.timeline or from chartData)
          const breakEvenHasData = !!(timeline && timeline.length > 0) || !!(data && data.length > 0) || !!(analysis && analysis.timeline && analysis.timeline.length > 0);
          if (chartType === 'breakEven') {
            console.log('[BREAKEVEN] hasData check', {
              timelineExists: !!timeline,
              timelineLength: timeline?.length,
              dataExists: !!data,
              dataLength: data?.length,
              analysisExists: !!analysis,
              analysisTimelineExists: !!analysis?.timeline,
              analysisTimelineLength: analysis?.timeline?.length,
              finalHasData: breakEvenHasData
            });
          }
          return breakEvenHasData;
        case 'rentGrowth':
          return !!(timeline || data);
        case 'totalCost':
          // Need timeline data (totals can be calculated from timeline if needed)
          return !!(timeline && timeline.length > 0) || !!(data && data.length > 0) || !!(analysis && analysis.timeline && analysis.timeline.length > 0);
        default:
          return true; // Other charts don't need special loading checks
      }
    })();
    
    // Only show loading if actively loading AND no data yet
    if (chartLoading.type === chartType && !hasData && chartLoading.progress < 100) {
      if (chartType === 'breakEven' || chartType === 'liquidity' || chartType === 'scenarioOverlay') {
        console.log(`[${chartType.toUpperCase()}] Showing loading indicator`, {
          chartLoadingType: chartLoading.type,
          hasData,
          progress: chartLoading.progress,
          message: chartLoading.message
        });
      }
      return (
        <div className="chart-wrapper">
          <div className="chart-loading-indicator">
            <div className="chart-loading-spinner"></div>
            <p className="chart-loading-message">{chartLoading.message}</p>
            <div className="chart-loading-progress-bar">
              <div 
                className="chart-loading-progress-fill" 
                style={{ width: `${chartLoading.progress}%` }}
              />
            </div>
            <span className="chart-loading-progress-text">{Math.round(chartLoading.progress)}%</span>
          </div>
        </div>
      );
    }
    
    // 🔍 DEBUG: Log if we're past the loading check
    if (chartType === 'breakEven' || chartType === 'liquidity' || chartType === 'scenarioOverlay') {
      console.log(`[${chartType.toUpperCase()}] Past loading check, proceeding to render`, {
        chartLoadingType: chartLoading.type,
        hasData,
        progress: chartLoading.progress,
        willShowLoading: chartLoading.type === chartType && !hasData && chartLoading.progress < 100
      });
    }
    
    // Additional variables needed for specific charts
    const breakEven = analysis?.breakEven ? {
      monthIndex: (analysis.breakEven as any).month_index ?? analysis.breakEven.monthIndex ?? null,
      year: (analysis.breakEven as any).year ?? analysis.breakEven.year ?? null
    } : null;
    const costs = chartType === 'monthlyCost' ? monthlyCosts : (snapshotData?.monthlyCosts || monthlyCosts);
    const totalData = snapshotData?.totalCostData || totalCostData;
    
    // Use new structure if available, otherwise require legacy data
    if (!timeline && !data) return null;
    
    
    switch (chartType) {
      case 'netWorth':
        return timeline ? (
          <div className="chart-wrapper">
            <NetWorthChart timeline={timeline} />
          </div>
        ) : data ? (
          <div className="chart-wrapper">
            <NetWorthChart timeline={data.map(s => ({
              monthIndex: s.month,
              year: Math.ceil(s.month / 12),
              netWorthBuy: s.buyerNetWorth,
              netWorthRent: s.renterNetWorth,
              totalCostBuyToDate: 0,
              totalCostRentToDate: 0,
              buyMonthlyOutflow: s.monthlyBuyingCosts,
              rentMonthlyOutflow: s.monthlyRentingCosts,
              mortgagePayment: s.mortgagePayment,
              propertyTaxMonthly: 0,
              insuranceMonthly: 0,
              maintenanceMonthly: 0,
              hoaMonthly: 0,
              principalPaid: s.principalPaid,
              interestPaid: s.interestPaid,
              remainingBalance: s.remainingBalance,
              homeValue: s.homeValue,
              homeEquity: s.homeEquity,
              renterInvestmentBalance: s.investedDownPayment,
              buyerCashAccount: 0,
            }))} />
          </div>
        ) : null;
      case 'monthlyCost':
        return timeline ? (
          <div className="chart-wrapper">
            <MonthlyCostChart timeline={timeline} />
          </div>
        ) : costs ? (
          <div className="chart-wrapper">
            <MonthlyCostChart timeline={[{
              monthIndex: 1,
              year: 1,
              netWorthBuy: 0,
              netWorthRent: 0,
              totalCostBuyToDate: 0,
              totalCostRentToDate: 0,
              buyMonthlyOutflow: costs.buying.total,
              rentMonthlyOutflow: costs.renting.total,
              mortgagePayment: costs.buying.mortgage,
              propertyTaxMonthly: costs.buying.propertyTax,
              insuranceMonthly: costs.buying.insurance,
              maintenanceMonthly: costs.buying.maintenance,
              hoaMonthly: costs.buying.hoa,
              principalPaid: 0,
              interestPaid: 0,
              remainingBalance: 0,
              homeValue: 0,
              homeEquity: 0,
              renterInvestmentBalance: 0,
              buyerCashAccount: 0,
            }]} />
          </div>
        ) : null;
      case 'totalCost':
        // For totalCost, we need both timeline and totals
        // Normalize analysis if it exists (convert snake_case to camelCase)
        const normalizedAnalysis = analysis ? {
          timeline: timeline || analysis.timeline || [],
          breakEven: breakEven || { monthIndex: null, year: null },
          totalBuyCost: analysis.totalBuyCost ?? (analysis as any).total_buy_cost ?? 0,
          totalRentCost: analysis.totalRentCost ?? (analysis as any).total_rent_cost ?? 0,
        } : null;
        
        // If we have analysis with timeline, use it
        if (normalizedAnalysis && normalizedAnalysis.timeline.length > 0) {
          return (
            <div className="chart-wrapper">
              <TotalCostChart analysis={normalizedAnalysis} />
            </div>
          );
        }
        
        // Fallback: if we have timeline from snapshotData and totalData, construct analysis
        if (timeline && timeline.length > 0 && totalData) {
          return (
            <div className="chart-wrapper">
              <TotalCostChart analysis={{
                timeline: timeline,
                breakEven: breakEven || { monthIndex: null, year: null },
                totalBuyCost: totalData.totalBuyingCosts,
                totalRentCost: totalData.totalRentingCosts,
              }} />
            </div>
          );
        }
        
        // Last resort: if we have totalData but no timeline, we can't render the chart properly
        // But let's try to get timeline from data if available
        if (totalData && data && data.length > 0) {
          const constructedTimeline = data.map(s => ({
            monthIndex: s.month,
            year: Math.ceil(s.month / 12),
            netWorthBuy: s.buyerNetWorth,
            netWorthRent: s.renterNetWorth,
            totalCostBuyToDate: 0,
            totalCostRentToDate: 0,
            buyMonthlyOutflow: s.monthlyBuyingCosts,
            rentMonthlyOutflow: s.monthlyRentingCosts,
            mortgagePayment: s.mortgagePayment,
            propertyTaxMonthly: 0,
            insuranceMonthly: 0,
            maintenanceMonthly: 0,
            hoaMonthly: 0,
            principalPaid: s.principalPaid,
            interestPaid: s.interestPaid,
            remainingBalance: s.remainingBalance,
            homeValue: s.homeValue,
            homeEquity: s.homeEquity,
            renterInvestmentBalance: s.investedDownPayment,
            buyerCashAccount: 0,
          }));
          
          return (
            <div className="chart-wrapper">
              <TotalCostChart analysis={{
                timeline: constructedTimeline,
                breakEven: breakEven || { monthIndex: null, year: null },
                totalBuyCost: totalData.totalBuyingCosts,
                totalRentCost: totalData.totalRentingCosts,
              }} />
            </div>
          );
        }
        
        // No data available
        return null;
      case 'equity':
        return timeline ? (
          <div className="chart-wrapper">
            <EquityBuildupChart timeline={timeline} />
          </div>
        ) : data ? (
          <div className="chart-wrapper">
            <EquityBuildupChart timeline={data.map(s => ({
              monthIndex: s.month,
              year: Math.ceil(s.month / 12),
              netWorthBuy: s.buyerNetWorth,
              netWorthRent: s.renterNetWorth,
              totalCostBuyToDate: 0,
              totalCostRentToDate: 0,
              buyMonthlyOutflow: s.monthlyBuyingCosts,
              rentMonthlyOutflow: s.monthlyRentingCosts,
              mortgagePayment: s.mortgagePayment,
              propertyTaxMonthly: 0,
              insuranceMonthly: 0,
              maintenanceMonthly: 0,
              hoaMonthly: 0,
              principalPaid: s.principalPaid,
              interestPaid: s.interestPaid,
              remainingBalance: s.remainingBalance,
              homeValue: s.homeValue,
              homeEquity: s.homeEquity,
              renterInvestmentBalance: s.investedDownPayment,
              buyerCashAccount: 0,
            }))} />
          </div>
        ) : null;
      case 'rentGrowth':
        return timeline ? (
          <div className="chart-wrapper">
            <RentGrowthChart timeline={timeline} />
          </div>
        ) : (data && costs) ? (
          <div className="chart-wrapper">
            <RentGrowthChart timeline={data.map(s => ({
              monthIndex: s.month,
              year: Math.ceil(s.month / 12),
              netWorthBuy: s.buyerNetWorth,
              netWorthRent: s.renterNetWorth,
              totalCostBuyToDate: 0,
              totalCostRentToDate: 0,
              buyMonthlyOutflow: s.monthlyBuyingCosts,
              rentMonthlyOutflow: s.monthlyRent,
              mortgagePayment: costs.buying.mortgage,
              propertyTaxMonthly: 0,
              insuranceMonthly: 0,
              maintenanceMonthly: 0,
              hoaMonthly: 0,
              principalPaid: s.principalPaid,
              interestPaid: s.interestPaid,
              remainingBalance: s.remainingBalance,
              homeValue: s.homeValue,
              homeEquity: s.homeEquity,
              renterInvestmentBalance: s.investedDownPayment,
              buyerCashAccount: 0,
            }))} />
          </div>
        ) : null;
      case 'breakEven':
        console.log('[BREAKEVEN] Rendering chart', {
          hasAnalysis: !!analysis,
          hasTimeline: !!timeline,
          timelineLength: timeline?.length,
          hasData: !!data,
          dataLength: data?.length,
          breakEven: analysis?.breakEven,
          chartLoadingType: chartLoading.type,
          chartLoadingProgress: chartLoading.progress
        });
        // Normalize analysis if it exists (convert snake_case to camelCase)
        // Must have timeline data to render
        const normalizedBreakEvenAnalysis = analysis && timeline && timeline.length > 0 ? {
          timeline: timeline,
          breakEven: breakEven || { monthIndex: null, year: null },
          totalBuyCost: analysis.totalBuyCost ?? (analysis as any).total_buy_cost ?? 0,
          totalRentCost: analysis.totalRentCost ?? (analysis as any).total_rent_cost ?? 0,
        } : null;
        
        // If we have normalized analysis with timeline, use it
        if (normalizedBreakEvenAnalysis) {
          console.log('[BREAKEVEN] Rendering with normalized analysis');
          return (
            <div className="chart-wrapper">
              <BreakEvenChart analysis={normalizedBreakEvenAnalysis} />
            </div>
          );
        }
        
        // Fallback to data if available
        if (data && data.length > 0) {
          console.log('[BREAKEVEN] Rendering with fallback data');
          return (
            <div className="chart-wrapper">
              <BreakEvenChart analysis={{
              timeline: data.map(s => ({
                monthIndex: s.month,
                year: Math.ceil(s.month / 12),
                netWorthBuy: s.buyerNetWorth,
                netWorthRent: s.renterNetWorth,
                totalCostBuyToDate: 0,
                totalCostRentToDate: 0,
                buyMonthlyOutflow: s.monthlyBuyingCosts,
                rentMonthlyOutflow: s.monthlyRentingCosts,
                mortgagePayment: s.mortgagePayment,
                propertyTaxMonthly: 0,
                insuranceMonthly: 0,
                maintenanceMonthly: 0,
                hoaMonthly: 0,
                principalPaid: s.principalPaid,
                interestPaid: s.interestPaid,
                remainingBalance: s.remainingBalance,
                homeValue: s.homeValue,
                homeEquity: s.homeEquity,
                renterInvestmentBalance: s.investedDownPayment,
                buyerCashAccount: 0,
              })),
              breakEven: { monthIndex: null, year: null },
              totalBuyCost: 0,
              totalRentCost: 0,
              }} />
            </div>
          );
        }
        
        // If no data available, show placeholder or loading
        console.log('[BREAKEVEN] No data available');
        if (chartLoading.type === 'breakEven' && chartLoading.progress < 100) {
          return null; // Loading indicator shown at top
        }
        
        return (
          <div className="chart-wrapper">
            <ChartPlaceholder 
              title="Break-Even Timeline" 
              description="Break-even data is being calculated..."
            />
          </div>
        );
      case 'cashFlow':
        // If no data yet, show loading or placeholder
        if (!cashFlowSeries || cashFlowSeries.length === 0) {
          if (chartLoading.type === 'cashFlow') {
            return null; // Loading indicator shown at top
          }
          return (
            <div className="chart-wrapper">
              <ChartPlaceholder 
                title="Cash Flow Chart" 
                description="Cash flow data is being calculated..."
              />
            </div>
          );
        }
        return (
          <div className="chart-wrapper">
            <CashFlowChart data={cashFlowSeries} />
          </div>
        );
      case 'cumulativeCost':
        // If no data yet, show loading or placeholder
        if (!cumulativeSeries || cumulativeSeries.length === 0) {
          if (chartLoading.type === 'cumulativeCost') {
            return null; // Loading indicator shown at top
          }
          return (
            <div className="chart-wrapper">
              <ChartPlaceholder 
                title="Cumulative Cost Chart" 
                description="Cumulative cost data is being calculated..."
              />
            </div>
          );
        }
        return (
          <div className="chart-wrapper">
            <CumulativeCostChart data={cumulativeSeries} />
          </div>
        );
      case 'liquidity':
        console.log('[LIQUIDITY] Rendering chart', {
          hasLiquiditySeries: !!liquiditySeries,
          liquiditySeriesLength: liquiditySeries?.length,
          liquiditySeriesType: typeof liquiditySeries,
          liquiditySeriesIsArray: Array.isArray(liquiditySeries),
          fromSnapshot: !!snapshotData?.liquidityTimeline,
          fromState: !!advancedMetrics?.liquidityTimeline,
          chartLoadingType: chartLoading.type,
          chartLoadingProgress: chartLoading.progress
        });
        // If no data yet, show loading or placeholder
        if (!liquiditySeries || liquiditySeries.length === 0) {
          console.log('[LIQUIDITY] No data available');
          if (chartLoading.type === 'liquidity' && chartLoading.progress < 100) {
            return null; // Loading indicator shown at top
          }
          return (
            <ChartPlaceholder 
              title="Liquidity Timeline" 
              description="Liquidity data is being calculated..."
            />
          );
        }
        // Liquidity chart component doesn't exist yet, but data is available
        console.log('[LIQUIDITY] Data available, showing placeholder');
        const placeholder = (
          <ChartPlaceholder 
            title="Liquidity Timeline" 
            description="Shows available cash over time. Chart component coming soon."
          />
        );
        return placeholder;
      case 'taxSavings':
        // If no data yet, show loading or placeholder
        if (!taxSeries || taxSeries.length === 0) {
          if (chartLoading.type === 'taxSavings') {
            return null; // Loading indicator shown at top
          }
          return (
            <div className="chart-wrapper">
              <ChartPlaceholder 
                title="Tax Savings Chart" 
                description="Tax savings data is being calculated..."
              />
            </div>
          );
        }
        return (
          <div className="chart-wrapper">
            <TaxSavingsChart data={taxSeries} />
          </div>
        );
      case 'breakEvenHeatmap':
        // If no data yet, show loading or placeholder
        if (!heatmapPoints || heatmapPoints.length === 0) {
          if (chartLoading.type === 'breakEvenHeatmap' && chartLoading.progress < 100) {
            return null; // Loading indicator shown at top
          }
          return (
            <div className="chart-wrapper">
              <ChartPlaceholder 
                title="Break-Even Heatmap" 
                description="Heatmap data is being calculated..."
              />
            </div>
          );
        }
        return (
          <div className="chart-wrapper">
            <BreakEvenHeatmap points={heatmapPoints} />
          </div>
        );
      case 'monteCarlo':
        
        // If loading, the loading indicator is already shown at the top of renderChart
        // But if we have data, show it
        const monteCarloData = analysis?.monteCarloHomePrices ?? (analysis as any)?.monte_carlo_home_prices ?? monteCarlo;
        
        if (monteCarloData) {
          // Handle both HomePricePathSummary format and legacy format
          if (monteCarloData.years && monteCarloData.p10 && monteCarloData.p50 && monteCarloData.p90) {
            // New format (HomePricePathSummary)
            return (
              <div className="chart-wrapper">
                <MonteCarloChart monteCarloHomePrices={monteCarloData} />
              </div>
            );
          } else if (monteCarloData.runs && monteCarloData.summary) {
            // Legacy format - convert to new format if possible
            console.warn('Monte Carlo legacy format detected, may need conversion');
            return (
              <div className="chart-wrapper">
                <ChartPlaceholder 
                  title="Monte Carlo Simulation" 
                  description="Legacy format detected. Please regenerate the analysis."
                />
              </div>
            );
          }
        }
        
        // If we're loading and no data yet, show loading indicator (handled at top of renderChart)
        // Otherwise show placeholder
        if (chartLoading.type === 'monteCarlo' && chartLoading.progress < 100) {
          return null; // Loading indicator already shown at top
        }
        
        return (
          <div className="chart-wrapper">
            <ChartPlaceholder 
              title="Monte Carlo Simulation" 
              description="Monte Carlo data is being generated. This may take 30-60 seconds..."
            />
          </div>
        );
      case 'sensitivity':
        // If no data yet, show loading or placeholder
        if (!sensitivity || sensitivity.length === 0) {
          if (chartLoading.type === 'sensitivity' && chartLoading.progress < 100) {
            return null; // Loading indicator shown at top
          }
          return (
            <div className="chart-wrapper">
              <ChartPlaceholder 
                title="Sensitivity Analysis" 
                description="Sensitivity data is being calculated..."
              />
            </div>
          );
        }
        return (
          <div className="chart-wrapper">
            <SensitivityChart results={sensitivity} />
          </div>
        );
      case 'scenarioOverlay':
        console.log('[SCENARIO OVERLAY] Rendering chart', {
          hasScenarioOverlay: !!scenarioOverlay,
          scenarioOverlayLength: scenarioOverlay?.length,
          scenarioOverlayType: typeof scenarioOverlay,
          scenarioOverlayIsArray: Array.isArray(scenarioOverlay),
          fromSnapshot: !!snapshotData?.scenarioOverlay,
          fromState: !!scenarioOverlayData,
          chartLoadingType: chartLoading.type,
          chartLoadingProgress: chartLoading.progress
        });
        // If no data yet, show loading or placeholder
        if (!scenarioOverlay || scenarioOverlay.length === 0) {
          console.log('[SCENARIO OVERLAY] No data available');
          if (chartLoading.type === 'scenarioOverlay' && chartLoading.progress < 100) {
            return null; // Loading indicator shown at top
          }
          return (
            <div className="chart-wrapper">
              <ChartPlaceholder 
                title="Scenario Overlay" 
                description="Scenario data is being calculated..."
              />
            </div>
          );
        }
        console.log('[SCENARIO OVERLAY] Data available, rendering chart');
        return (
          <div className="chart-wrapper">
            <ScenarioOverlayChart scenarios={scenarioOverlay} />
          </div>
        );
      default:
        return null;
    }
  };
  
  const applyAnalysis = (analysis: CalculatorOutput) => {
    setChartData(analysis.monthlySnapshots);
    setMonthlyCosts({
      buying: analysis.monthlyCosts,
      renting: analysis.rentingCosts
    });
    setTotalCostData(analysis.totals);
    setAdvancedMetrics({
      cashFlow: analysis.cashFlow ?? null,
      cumulativeCosts: analysis.cumulativeCosts ?? null,
      liquidityTimeline: analysis.liquidityTimeline ?? null,
      taxSavings: analysis.taxSavings ?? null
    });
    setChartsReady(true);
  };

  const buildSnapshotData = (
    analysis: CalculatorOutput,
    inputs: ScenarioInputs,
    monteCarloSummary?: HomePricePathSummary | null
  ) => ({
    totalCostData: analysis.totals,
    cashFlow: analysis.cashFlow ?? null,
    cumulativeCosts: analysis.cumulativeCosts ?? null,
    liquidityTimeline: analysis.liquidityTimeline ?? null,
    taxSavings: analysis.taxSavings ?? null,
    monteCarlo: monteCarloSummary ?? null,
    inputValues: {
      homePrice: inputs.homePrice,
      monthlyRent: inputs.monthlyRent,
      downPaymentPercent: inputs.downPaymentPercent,
      timeHorizonYears: inputs.timeHorizonYears,
    }
  });

  // Determine step states
  const hasResults = chartsReady;
  const fallbackTimeHorizonYears = userData.timeHorizonYears ?? 10;
  const chartsTabRates = useMemo(
    () => getZIPBasedRates(locationData, fallbackTimeHorizonYears),
    [locationData, fallbackTimeHorizonYears]
  );
  const assumptionInitialValues: AssumptionValues = useMemo(
    () => ({
    interestRate: 7,
    homeAppreciationRate: (unifiedAnalysisResult as any)?.home_appreciation_rate ?? unifiedAnalysisResult?.homeAppreciationRate ?? chartsTabRates.homeAppreciationRate,
    rentGrowthRate: (unifiedAnalysisResult as any)?.rent_growth_rate ?? unifiedAnalysisResult?.rentGrowthRate ?? chartsTabRates.rentGrowthRate,
    investmentReturnRate: chartsTabRates.investmentReturnRate
    }),
    [
      chartsTabRates,
      unifiedAnalysisResult?.homeAppreciationRate,
      unifiedAnalysisResult?.home_appreciation_rate,
      unifiedAnalysisResult?.rentGrowthRate,
      unifiedAnalysisResult?.rent_growth_rate
    ]
  );
  const [adjustedAssumptions, setAdjustedAssumptions] = useState<AssumptionValues | null>(null);
  useEffect(() => {
    setAdjustedAssumptions(null);
  }, [
    assumptionInitialValues.interestRate,
    assumptionInitialValues.homeAppreciationRate,
    assumptionInitialValues.rentGrowthRate,
    assumptionInitialValues.investmentReturnRate,
    chartsReady
  ]);
  const handleAssumptionControlChange = (values: AssumptionValues) => {
    setAdjustedAssumptions(values);
  };

  const basicValues = {
    homePrice: userData.homePrice,
    monthlyRent: userData.monthlyRent,
    downPaymentPercent: userData.downPaymentPercent,
    timeHorizonYears: userData.timeHorizonYears,
  };

  const resolvedHomeGrowth =
    (unifiedAnalysisResult as any)?.home_appreciation_rate ??
    unifiedAnalysisResult?.homeAppreciationRate ??
    locationData?.homeAppreciationRate ??
    null;

  const resolvedRentGrowth =
    (unifiedAnalysisResult as any)?.rent_growth_rate ??
    unifiedAnalysisResult?.rentGrowthRate ??
    locationData?.rentGrowthRate ??
    null;

  const locationMetrics = [
    {
      label: 'Median home',
      value: locationData ? `$${locationData.medianHomePrice.toLocaleString()}` : 'Awaiting data',
    },
    {
      label: 'Median rent',
      value: locationData?.averageRent ? `$${locationData.averageRent.toLocaleString()}/mo` : 'Awaiting data',
    },
    {
      label: 'Property tax',
      value:
        typeof locationData?.propertyTaxRate === 'number'
          ? `${locationData.propertyTaxRate.toFixed(2)}%`
          : 'Awaiting data',
    },
    {
      label: 'Home appreciation',
      value: resolvedHomeGrowth !== null ? `${resolvedHomeGrowth.toFixed(2)}%/yr` : 'Pending',
    },
    {
      label: 'Rent growth',
      value: resolvedRentGrowth !== null ? `${resolvedRentGrowth.toFixed(2)}%/yr` : 'Pending',
    },
  ];

  const locationCardStyle = {
    background: 'rgba(12, 16, 27, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '18px',
    padding: '20px',
    marginBottom: '20px',
  };

  const phaseLabelStyle = {
    fontSize: '12px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.6)',
  };

  const metricGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginTop: '20px',
  };

  const metricItemStyle = {
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '12px',
    background: 'rgba(255,255,255,0.02)',
  };

  const metricLabelStyle = {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.6)',
  };

  const metricValueStyle = {
    fontSize: '15px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.95)',
    marginTop: '4px',
  };

  const cityBadgeStyle: React.CSSProperties = {
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '14px',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.03)',
    minWidth: '200px',
  };

  const locationDescriptionStyle: React.CSSProperties = {
    marginTop: '8px',
    color: 'rgba(255,255,255,0.65)',
    fontSize: '13px',
    maxWidth: '520px',
  };

  const locationFooterStyle: React.CSSProperties = {
    marginTop: '14px',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.55)',
  };

  return (
    <div className="rvb-layout">
      <OnboardingTour activeTab={activeTab} />
      {/* Step Indicator */}

      <div className="rvb-main">
        {/* Left Column: Inputs (Chat tab only) */}
        {activeTab === 'chat' && (
          <div className="rvb-left">
            <section style={locationCardStyle} data-tour-id="phase-one-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ flex: '1 1 320px' }}>
                  <span style={phaseLabelStyle}>Phase 1 · Local market data</span>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', color: 'rgba(255,255,255,0.92)' }}>
                    Local market snapshot
                  </h3>
                  <p style={locationDescriptionStyle}>
                    I anchor every analysis to real market data. Mention any ZIP code or city in the chat and I’ll refresh these
                    numbers automatically.
                  </p>
                </div>
                <div style={cityBadgeStyle}>
                  <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)' }}>
                    Current focus
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px', color: 'rgba(255,255,255,0.95)' }}>
                    {locationData ? `📍 ${locationData.city}, ${locationData.state}` : '📍 Waiting for a ZIP'}
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '4px', color: 'rgba(255,255,255,0.6)' }}>
                    {currentZipCode ? `ZIP ${currentZipCode}` : 'Share a ZIP in chat to preload data'}
                  </div>
                </div>
              </div>
              {locationData ? (
                <>
                  <div style={metricGridStyle}>
                    {locationMetrics.map((metric) => (
                      <div key={metric.label} style={metricItemStyle}>
                        <span style={metricLabelStyle}>{metric.label}: </span>
                        <span style={metricValueStyle}>{metric.value}</span>
                      </div>
                    ))}
                  </div>
                  <p style={locationFooterStyle}>
                    Want to compare a different neighborhood? Just mention another ZIP or city in the chat.
                  </p>
                </>
              ) : (
                <p style={locationDescriptionStyle}>
                  Tell me a ZIP code like “95125” or say “Analyze Austin” and I’ll pull the local prices, rents, taxes, and growth
                  rates for you.
                </p>
              )}
            </section>

            <BasicInputsCard
              values={basicValues}
              editingValues={editableValues ?? basicValues}
              isEditMode={isEditMode}
              onFieldChange={handleBasicFieldChange}
              onEdit={handleEditValues}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />

            <AdvancedInputsCard
              values={advancedInputs}
              editingValues={editableAdvancedValues ?? advancedInputs}
              isEditMode={isEditMode}
              isExpanded={showAdvancedAssumptions}
              onToggle={() => setShowAdvancedAssumptions(prev => !prev)}
              onFieldChange={handleAdvancedFieldChange}
            />
          </div>
        )}

        {/* Right Column: Chat Container */}
        <div className="rvb-right">
          <div className="chat-container">
      <div className="chat-header">
        <h1 className="app-title">RentVsBuy.ai</h1>
          <div className="header-buttons">
            {/* Tab Buttons */}
            <div className="tab-buttons">
              <button
                className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
                data-tour-id="chat-tab-button"
              >
                💬 Chat & Setup
              </button>
              <button
                className={`tab-button ${activeTab === 'charts' ? 'active' : ''}`}
                onClick={() => setActiveTab('charts')}
                title="View the charts dashboard"
                data-tour-id="charts-tab-button"
              >
                📊 Charts Dashboard
              </button>
            </div>
            {activeTab === 'chat' && (
              <>
                <button 
                  className="save-button"
                  onClick={handleSaveChat}
                  title="Save current chat"
                  data-tour-id="save-button"
                >
                  Save Chat
                </button>
                <button 
                  className="restart-button"
                  onClick={() => setShowRestartModal(true)}
                  title="Start over"
                  data-tour-id="restart-button"
                >
                  Restart
                </button>
              </>
            )}
            {/* Toggle Reference Box Button - Always visible */}
          </div>
      </div>
      
      {activeTab === 'chat' ? (
        <>
      <div className="messages-container" data-tour-id="chat-area">
        {messages.map((message, index) => {
          // Calculate delay based on previous assistant messages' content length
          let delay = 0;
          if (message.role === 'assistant') {
            for (let i = 0; i < index; i++) {
              if (messages[i].role === 'assistant') {
                const wordCount = messages[i].content.split(' ').length;
                delay += 300 + (wordCount * 15); // 300ms base + 15ms per word - slower, more natural
              }
            }
          }
          
          return (
            <div key={message.id} data-message-id={message.id}>
              {/* Only render ChatMessage if there's content or it's not a recommendation message */}
              {message.content || !message.showRecommendation ? (
                <ChatMessage
                  role={message.role}
                  content={message.content}
                  delay={delay}
                />
              ) : null}
              {/* Render recommendation card if this message has the flag */}
              {message.showRecommendation && message.recommendation && message.recommendationTimeline && (
                <RecommendationCard
                  recommendation={message.recommendation}
                  location={message.recommendationLocation}
                  timeline={message.recommendationTimeline}
                  onShowDetails={handleShowDetails}
                  onTryNewScenario={handleTryNewScenario}
                />
              )}
              {/* Render chart right after message if it has one - uses message's snapshot data */}
              {message.chartToShow && (
                <div 
                  key={`chart-${message.id}-${message.chartToShow}`} 
                  data-chart-type={message.chartToShow}
                  style={{ 
                    display: 'block', 
                    visibility: 'visible',
                    width: '100%',
                    marginTop: '20px'
                  }}
                >
                  {renderChart(message.chartToShow, message.snapshotData)}
                </div>
              )}
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
            {isAnalyzing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                <div style={{ 
                  width: '200px', 
                  height: '6px', 
                  backgroundColor: 'rgba(30, 30, 40, 0.6)', 
                  borderRadius: '3px',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  <div style={{
                    width: `${loadingProgress.progress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)',
                    borderRadius: '3px',
                    transition: 'width 0.5s ease'
                  }}></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>{loadingProgress.stage}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)' }}>{loadingProgress.progress}%</span>
                </div>
              </div>
            ) : (
              <span>AI is thinking...</span>
            )}
          </div>
        )}
        
        {/* Scroll target for smooth scrolling to charts */}
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput onSend={handleSendMessage} />
      
      {/* Footer */}
      <div className="chat-footer">
        <span>RentVsBuy.ai v1.0</span>
        <span>•</span>
        <span>Built with AI-powered insights</span>
      </div>
        </>
      ) : (
        <div className="charts-tab-container">
          <div className="charts-grid-wrapper">
            <div className="charts-panel">
              <ChartsGrid
                snapshotData={messages.find(m => m.snapshotData)?.snapshotData || null}
                timeline={unifiedAnalysisResult?.timeline?.map(p => ({
                  monthIndex: (p as any).month_index ?? p.monthIndex ?? 0,
                  year: (p as any).year ?? Math.ceil(((p as any).month_index ?? p.monthIndex ?? 0) / 12),
                  netWorthBuy: (p as any).net_worth_buy ?? p.netWorthBuy ?? 0,
                  netWorthRent: (p as any).net_worth_rent ?? p.netWorthRent ?? 0,
                  totalCostBuyToDate: (p as any).total_cost_buy_to_date ?? p.totalCostBuyToDate ?? 0,
                  totalCostRentToDate: (p as any).total_cost_rent_to_date ?? p.totalCostRentToDate ?? 0,
                  buyMonthlyOutflow: (p as any).buy_monthly_outflow ?? p.buyMonthlyOutflow ?? 0,
                  rentMonthlyOutflow: (p as any).rent_monthly_outflow ?? p.rentMonthlyOutflow ?? 0,
                  mortgagePayment: (p as any).mortgage_payment ?? p.mortgagePayment ?? 0,
                  propertyTaxMonthly: (p as any).property_tax_monthly ?? p.propertyTaxMonthly ?? 0,
                  insuranceMonthly: (p as any).insurance_monthly ?? p.insuranceMonthly ?? 0,
                  maintenanceMonthly: (p as any).maintenance_monthly ?? p.maintenanceMonthly ?? 0,
                  hoaMonthly: (p as any).hoa_monthly ?? p.hoaMonthly ?? 0,
                  principalPaid: (p as any).principal_paid ?? p.principalPaid ?? 0,
                  interestPaid: (p as any).interest_paid ?? p.interestPaid ?? 0,
                  remainingBalance: (p as any).remaining_balance ?? p.remainingBalance ?? 0,
                  homeValue: (p as any).home_value ?? p.homeValue ?? 0,
                  homeEquity: (p as any).home_equity ?? p.homeEquity ?? 0,
                  renterInvestmentBalance: (p as any).renter_investment_balance ?? p.renterInvestmentBalance ?? 0,
                  buyerCashAccount: (p as any).buyer_cash_account ?? p.buyerCashAccount ?? 0,
                })) || undefined}
                data={chartData || undefined}
                monthlyCosts={monthlyCosts || undefined}
                totalCostData={totalCostData || undefined}
                advancedMetrics={advancedMetrics}
                heatmapData={heatmapData || undefined}
                monteCarloData={monteCarloData || undefined}
                sensitivityData={sensitivityData || undefined}
                scenarioOverlayData={scenarioOverlayData || undefined}
                chartsReady={chartsReady}
                chartLoading={chartLoading}
                userData={userData}
                unifiedAnalysisResult={unifiedAnalysisResult}
                adjustedAssumptions={adjustedAssumptions ?? undefined}
              />
            </div>
          </div>
        </div>
      )}
          </div>
        </div>
      </div>

      {/* Charts Area - Full Width Below */}
      <div className="rvb-charts">
        {/* Monte Carlo Progress Card */}
        {isMonteCarloLoading && (
          <div className="monte-carlo-progress-card rvb-fade-in">
            <div className="monte-carlo-progress-header">
              <span>🎲 Running Monte Carlo simulation</span>
              <span>{Math.round(monteCarloProgress)}%</span>
            </div>
            <div className="monte-carlo-progress-bar">
              <div
                className="monte-carlo-progress-fill"
                style={{ width: `${Math.min(monteCarloProgress, 100)}%` }}
              />
            </div>
            <p className="monte-carlo-progress-stage">
              {monteCarloProgressStage || 'Generating random price paths...'}
            </p>
          </div>
        )}
        
        {/* Chart Navigation Buttons - Only visible in Chat & Setup tab */}
        {activeTab === 'chat' && (
        <div 
          className={`chart-nav-bar ${hasResults ? 'rvb-fade-in' : ''}`} 
          data-tour-id="charts-area"
          style={{ 
            opacity: chartsReady ? 1 : 0.6,
            pointerEvents: chartsReady ? 'auto' : 'none'
          }}
        >
          {!chartsReady ? (
            <>
              <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
                <span className="chart-nav-label">📊 Charts:</span>
                <span style={{ marginLeft: '12px', fontSize: '14px' }}>Charts will appear here after you complete your scenario.</span>
              </div>
              {/* Advanced Analysis Section - Always visible for tour, even when charts not ready */}
              <div className="rvb-advanced-section" style={{ marginTop: '16px' }}>
                <button
                  className="rvb-advanced-toggle"
                  onClick={() => chartsReady && setShowAdvancedCharts(prev => !prev)}
                  data-tour-id="advanced-charts-toggle"
                  style={{ 
                    opacity: 0.6,
                    pointerEvents: 'none',
                    cursor: 'default'
                  }}
                >
                  Advanced Analysis (for experts)
                  <span className="rvb-advanced-toggle-indicator">
                    ▸
                  </span>
                </button>
              </div>
            </>
          ) : (
            <>
          <span className="chart-nav-label">📊 Charts:</span>
          
          <div className="rvb-chart-sections">
            {/* Core Charts Section */}
            <div>
              <div className="rvb-core-charts-header">Core charts</div>
              <div className="chart-button-grid core-charts">
                {BASIC_CHART_KEYS.map(chartKey => {
                  const config = chartButtonConfig[chartKey];
                  return (
                    <button
                      key={chartKey}
                      className="chart-button"
                      onClick={() => handleChipClick(config.message)}
                      title={config.title}
                    >
                      <span className="button-icon">{config.label.split(' ')[0]}</span>
                      <span className="button-text">
                        <strong>{config.label.substring(config.label.indexOf(' ') + 1)}</strong>
                        <small>{config.description}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Advanced Analysis Section (Collapsible) */}
            <div className="rvb-advanced-section">
              <button
                className="toggle-button"
                onClick={() => setShowAdvancedCharts(prev => !prev)}
                data-tour-id="advanced-charts-toggle"
              >
                <span>{showAdvancedCharts ? '▼' : '▶'}</span>
                Advanced Analysis
                <small>Market risk, sensitivity, tax implications</small>
              </button>
              
              {showAdvancedCharts && (
                <div className="rvb-advanced-chips">
                  <p style={{ 
                    fontSize: '11px', 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    margin: '0 0 8px 0',
                    lineHeight: '1.4'
                  }}>
                    These charts show risk, volatility, break-even points, and more detailed scenarios. You don't need them to understand the basics, but they're here if you want to go deeper.
                  </p>
                  <div className="chart-button-grid advanced-charts">
                    {ADVANCED_CHART_KEYS.map(chartKey => {
                      const config = chartButtonConfig[chartKey];
                      return (
                        <button
                          key={chartKey}
                          className="chart-button"
                          onClick={() => handleChipClick(config.message)}
                          title={config.title}
                        >
                          <span className="button-icon">{config.label.split(' ')[0]}</span>
                          <span className="button-text">
                            <strong>{config.label.substring(config.label.indexOf(' ') + 1)}</strong>
                            <small>{config.description}</small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
            </>
          )}
        </div>
        )}
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

function buildLocalAnalysis(inputs: ScenarioInputs): CalculatorOutput {
  const monthlySnapshots = calculateNetWorthComparison(inputs);
  const monthlyCosts = calculateBuyingCosts(inputs);
  const rentingCostsRaw = calculateRentingCosts(inputs, 1);
  const rentingCosts: RentingCostsBreakdown = {
    rent: inputs.monthlyRent,
    insurance: rentingCostsRaw.insurance,
    total: rentingCostsRaw.total
  };

  const summary = buildLocalSummary(monthlySnapshots);

  const totalBuyingCosts = monthlySnapshots.reduce((sum, snapshot) => sum + snapshot.monthlyBuyingCosts, 0);
  const totalRentingCosts = monthlySnapshots.reduce((sum, snapshot) => sum + snapshot.monthlyRentingCosts, 0);
  const finalSnapshot = monthlySnapshots[monthlySnapshots.length - 1];

  const totals: TotalCostSummary = {
    buyerFinalNetWorth: finalSnapshot.buyerNetWorth,
    renterFinalNetWorth: finalSnapshot.renterNetWorth,
    totalBuyingCosts,
    totalRentingCosts,
    finalHomeValue: finalSnapshot.homeValue,
    finalInvestmentValue: finalSnapshot.investedDownPayment
  };

  // Calculate tax savings from monthly snapshots (group by year)
  const taxSavings: TaxSavingsPoint[] = [];
  const DEFAULT_TAX_BRACKET = 0.24; // 24% default tax bracket
  
  // Group snapshots by year
  const snapshotsByYear = new Map<number, MonthlySnapshot[]>();
  monthlySnapshots.forEach(snapshot => {
    const year = Math.ceil(snapshot.month / 12);
    if (!snapshotsByYear.has(year)) {
      snapshotsByYear.set(year, []);
    }
    snapshotsByYear.get(year)!.push(snapshot);
  });
  
  // Calculate tax savings for each year
  snapshotsByYear.forEach((snapshots, year) => {
    // Sum interest paid for the year
    const totalInterest = snapshots.reduce((sum, s) => sum + s.interestPaid, 0);
    
    // Calculate property tax for the year (from monthly costs)
    // Property tax monthly = (homePrice * propertyTaxRate / 100) / 12
    const propertyTaxMonthly = (inputs.homePrice * inputs.propertyTaxRate / 100) / 12;
    const totalPropertyTax = snapshots.length * propertyTaxMonthly;
    
    // Apply caps: $750k loan limit for interest deduction, $10k SALT limit for property tax
    const deductibleInterest = Math.min(totalInterest, 750000);
    const deductiblePropertyTax = Math.min(totalPropertyTax, 10000);
    
    // Calculate tax benefit: (deductible interest + deductible property tax) * tax bracket
    const totalTaxBenefit = (deductibleInterest + deductiblePropertyTax) * DEFAULT_TAX_BRACKET;
    
    taxSavings.push({
      year,
      deductibleMortgageInterest: deductibleInterest,
      deductiblePropertyTax: deductiblePropertyTax,
      totalTaxBenefit: totalTaxBenefit,
    });
  });
  
  // Sort by year
  taxSavings.sort((a, b) => a.year - b.year);

  // Calculate cash flow, cumulative costs, and liquidity timeline from monthly snapshots
  const cashFlow: CashFlowPoint[] = monthlySnapshots.map(s => ({
    month: s.month,
    homeownerCashFlow: s.monthlyRentingCosts - s.monthlyBuyingCosts, // Positive = homeowner saves vs renter
    renterCashFlow: s.monthlyRentingCosts
  }));

  let cumulativeBuying = 0;
  let cumulativeRenting = 0;
  const cumulativeCosts: CumulativeCostPoint[] = monthlySnapshots.map(s => {
    cumulativeBuying += s.monthlyBuyingCosts;
    cumulativeRenting += s.monthlyRentingCosts;
    return {
      month: s.month,
      cumulativeBuying,
      cumulativeRenting
    };
  });

  // Calculate liquidity timeline
  // Buyer cash account: starts negative (money spent on down payment + closing), then tracks cash flow
  // Renter investment balance: already in MonthlySnapshot as investedDownPayment
  const downPaymentAmount = inputs.homePrice * (inputs.downPaymentPercent / 100);
  const closingCostsBuy = inputs.homePrice * 0.03; // 3% closing costs
  const monthlyInvestmentReturn = inputs.investmentReturnRate / 100 / 12;
  
  // Start with negative cash (money spent upfront)
  let buyerCashAccount = -downPaymentAmount - closingCostsBuy;
  
  const liquidityTimeline: LiquidityPoint[] = monthlySnapshots.map(s => {
    // Cash flow difference: renter pays rent, buyer pays mortgage + costs
    // Positive cash flow diff = renter pays more = buyer saves cash
    const cashFlowDiff = s.monthlyRentingCosts - s.monthlyBuyingCosts;
    
    // Buyer's cash account: previous balance + cash flow difference, with investment return
    buyerCashAccount = (buyerCashAccount + cashFlowDiff) * (1 + monthlyInvestmentReturn);
    
    return {
      month: s.month,
      homeownerCashAccount: buyerCashAccount,
      renterInvestmentBalance: s.investedDownPayment
    };
  });

  return {
    inputs,
    monthlySnapshots,
    summary,
    monthlyCosts,
    rentingCosts,
    totals,
    taxSavings: taxSavings.length > 0 ? taxSavings : null,
    cashFlow: cashFlow.length > 0 ? cashFlow : null,
    cumulativeCosts: cumulativeCosts.length > 0 ? cumulativeCosts : null,
    liquidityTimeline: liquidityTimeline.length > 0 ? liquidityTimeline : null
  };
}

function buildLocalSummary(snapshots: MonthlySnapshot[]): CalculatorSummary {
  const totalInterestPaid = snapshots.reduce((sum, snapshot) => sum + snapshot.interestPaid, 0);
  const totalPrincipalPaid = snapshots.reduce((sum, snapshot) => sum + snapshot.principalPaid, 0);
  const breakevenMonth = snapshots.find(snapshot => snapshot.netWorthDelta >= 0)?.month ?? null;
  const finalSnapshot = snapshots[snapshots.length - 1];

  return {
    totalInterestPaid,
    totalPrincipalPaid,
    breakevenMonth,
    finalBuyerNetWorth: finalSnapshot.buyerNetWorth,
    finalRenterNetWorth: finalSnapshot.renterNetWorth,
    finalNetWorthDelta: finalSnapshot.netWorthDelta
  };
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
    
    // If message is JUST a ZIP code (or ZIP code + minimal text), skip AI extraction
    // This avoids unnecessary AI API calls that are timing out
    const messageWithoutZip = message.replace(/\b\d{5}\b/g, '').trim();
    const isJustZipCode = messageWithoutZip.length < 10; // Less than 10 chars after removing ZIP
    
    if (isJustZipCode) {
      return { userData: newData, locationData };
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

    const completion = await createChatCompletion(
      [
        {
          role: "system",
          content: "You are a financial data extraction assistant. Extract only the requested financial data and return valid JSON."
        },
        {
          role: "user", 
          content: extractionPrompt
        }
      ],
      {
        temperature: 0.1,
        maxTokens: 200
      }
    );

    const extractedData = JSON.parse(completion || '{}');
    
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
    
    enrichDownPaymentAndTimeline(message, newData);

  } catch (error) {
    console.error('AI extraction failed:', error);
    // Fall back to basic number extraction if AI fails
    return extractUserDataFallback(message, currentData, locationData);
  }
  
  return { userData: newData, locationData };
}

// Fallback extraction for when AI fails
type AssumptionHint = {
  downPayment?: number;
  timeHorizon?: number;
};

function extractAssumptionHints(message: string): AssumptionHint {
  const hint: AssumptionHint = {};
  
  const percentMatch = message.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentMatch) {
    hint.downPayment = parseFloat(percentMatch[1]);
  }
  
  const yearsMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?|yr)/i);
  if (yearsMatch) {
    hint.timeHorizon = parseFloat(yearsMatch[1]);
  }
  
  return hint;
}

function buildAssumptionSentence(hint: AssumptionHint): string {
  const parts: string[] = [];
  if (hint.downPayment !== undefined) {
    parts.push(`down payment ${hint.downPayment}%`);
  }
  if (hint.timeHorizon !== undefined) {
    parts.push(`timeline ${hint.timeHorizon} years`);
  }
  return parts.join(' and ');
}

function enrichDownPaymentAndTimeline(message: string, data: UserData) {
  const percentMatch = message.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentMatch && !data.downPaymentPercent) {
    data.downPaymentPercent = parseFloat(percentMatch[1]);
  }

  const yearsMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?|yr)/i);
  if (yearsMatch && !data.timeHorizonYears) {
    data.timeHorizonYears = parseFloat(yearsMatch[1]);
  }
}

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
  
  enrichDownPaymentAndTimeline(message, newData);

  return { userData: newData, locationData };
}

// Old extractUserData function - replaced with AI-powered extraction
