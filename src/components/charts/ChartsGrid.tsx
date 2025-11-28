// src/components/charts/ChartsGrid.tsx

import { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { NetWorthChart } from './NetWorthChart';
import { MonthlyCostChart } from './MonthlyCostChart';
import { TotalCostChart } from './TotalCostChart';
import { EquityBuildupChart } from './EquityBuildupChart';
import { RentGrowthChart } from './RentGrowthChart';
import { BreakEvenChart } from './BreakEvenChart';
import { BreakEvenHeatmap } from './BreakEvenHeatmap';
import { ScenarioOverlayChart } from './ScenarioOverlayChart';
import { CashFlowChart } from './CashFlowChart';
import { CumulativeCostChart } from './CumulativeCostChart';
import { TaxSavingsChart } from './TaxSavingsChart';
import { MonteCarloChart } from './MonteCarloChart';
import { SensitivityChart } from './SensitivityChart';
import { ChartPlaceholder } from './ChartPlaceholder';
import { ChartInsightPanel } from './ChartInsightPanel';
import { fetchChartInsightStream } from '../../lib/api/finance';
import { calculateNetWorthComparison } from '../../lib/finance/calculator';
import type { AnalysisResult, TimelinePoint, MonthlySnapshot, TotalCostSummary, CashFlowPoint, CumulativeCostPoint, LiquidityPoint, TaxSavingsPoint, BreakEvenHeatmapPoint, HomePricePathSummary, SensitivityResult, ScenarioResult, ScenarioInputs } from '../../types/calculator';
import './ChartsGrid.css';

const MAX_TIMELINE_POINTS = 150;
const MAX_GENERIC_POINTS = 200;

const downsample = <T,>(values: T[], maxPoints: number): T[] => {
  if (!values || values.length <= maxPoints) {
    return values;
  }
  const step = Math.ceil(values.length / maxPoints);
  const trimmed: T[] = [];
  for (let i = 0; i < values.length; i += step) {
    trimmed.push(values[i]);
  }
  if (values.length % step !== 0 && trimmed[trimmed.length - 1] !== values[values.length - 1]) {
    trimmed.push(values[values.length - 1]);
  }
  return trimmed;
};

const serializeForSignature = (payload: unknown): string => {
  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
};

const hashString = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(16);
};

interface ChartsGridProps {
  snapshotData: {
    analysis?: AnalysisResult;
    chartData?: MonthlySnapshot[];
    monthlyCosts?: { buying: any; renting: any };
    totalCostData?: TotalCostSummary;
    cashFlow?: CashFlowPoint[] | null;
    cumulativeCosts?: CumulativeCostPoint[] | null;
    liquidityTimeline?: LiquidityPoint[] | null;
    taxSavings?: TaxSavingsPoint[] | null;
    heatmapPoints?: BreakEvenHeatmapPoint[] | null;
    monteCarlo?: HomePricePathSummary | null;
    sensitivity?: SensitivityResult[] | null;
    scenarioOverlay?: ScenarioResult[] | null;
    inputValues?: {
      homePrice: number;
      monthlyRent: number;
      downPaymentPercent: number;
      timeHorizonYears: number;
    };
  } | null;
  timeline?: TimelinePoint[];
  data?: MonthlySnapshot[];
  monthlyCosts?: { buying: any; renting: any };
  totalCostData?: TotalCostSummary;
  advancedMetrics?: {
    cashFlow?: CashFlowPoint[] | null;
    cumulativeCosts?: CumulativeCostPoint[] | null;
    liquidityTimeline?: LiquidityPoint[] | null;
    taxSavings?: TaxSavingsPoint[] | null;
  };
  heatmapData?: BreakEvenHeatmapPoint[] | null;
  monteCarloData?: HomePricePathSummary | null;
  sensitivityData?: SensitivityResult[] | null;
  scenarioOverlayData?: ScenarioResult[] | null;
  chartsReady?: boolean;
  chartLoading?: {
    type: string | null;
    progress: number;
    message: string;
  };
  // Fallback props for when snapshotData is null
  userData?: {
    homePrice: number | null;
    monthlyRent: number | null;
    downPaymentPercent: number | null;
    timeHorizonYears: number | null;
  };
  unifiedAnalysisResult?: AnalysisResult | null;
  // Assumption controls props
  adjustedAssumptions?: {
    interestRate: number;
    homeAppreciationRate: number;
    rentGrowthRate: number;
    investmentReturnRate: number;
  };
}

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

// Row 1: 4 core charts
const ROW_1_CHARTS: ChartType[] = ['monthlyCost', 'netWorth', 'equity', 'totalCost'];

// Row 2: 4 advanced charts
const ROW_2_CHARTS: ChartType[] = ['monteCarlo', 'breakEven', 'cashFlow', 'cumulativeCost'];

// Row 3: 2 larger charts (heatmap and scenario overlay)
const ROW_3_CHARTS: ChartType[] = ['breakEvenHeatmap', 'scenarioOverlay'];

// Remaining charts (can be added to row 2 or shown separately)
const REMAINING_CHARTS: ChartType[] = ['liquidity', 'rentGrowth', 'taxSavings', 'sensitivity'];

const chartTitles: Record<ChartType, string> = {
  monthlyCost: 'Monthly Cost Breakdown',
  netWorth: 'Net Worth Comparison',
  equity: 'Equity Buildup',
  totalCost: 'Total Cost Comparison',
  monteCarlo: 'Monte Carlo Simulation',
  breakEven: 'Break-Even Timeline',
  breakEvenHeatmap: 'Break-Even Heatmap',
  cashFlow: 'Cash Flow Timeline',
  cumulativeCost: 'Cumulative Cost Comparison',
  liquidity: 'Liquidity Timeline',
  rentGrowth: 'Rent Growth vs Mortgage',
  taxSavings: 'Tax Savings Timeline',
  scenarioOverlay: 'Scenario Overlay',
  sensitivity: 'Sensitivity Analysis',
};

export function ChartsGrid({
  snapshotData,
  timeline,
  data,
  monthlyCosts,
  totalCostData,
  advancedMetrics,
  heatmapData,
  monteCarloData,
  sensitivityData,
  scenarioOverlayData,
  chartsReady = false,
  chartLoading,
  userData,
  unifiedAnalysisResult,
  adjustedAssumptions,
}: ChartsGridProps) {
  // Extract original input values from snapshotData, or fallback to userData
  const inputValues = snapshotData?.inputValues || (userData?.homePrice && userData?.monthlyRent && userData?.downPaymentPercent && userData?.timeHorizonYears ? {
    homePrice: userData.homePrice,
    monthlyRent: userData.monthlyRent,
    downPaymentPercent: userData.downPaymentPercent,
    timeHorizonYears: userData.timeHorizonYears,
  } : undefined);
  
  // Extract current assumption values from analysis (snapshotData or unifiedAnalysisResult)
  const analysis = snapshotData?.analysis || unifiedAnalysisResult;
  
  // Use provided adjustedAssumptions or fallback to defaults
  const assumptions = adjustedAssumptions || {
    interestRate: (analysis as any)?.interest_rate ?? (analysis as any)?.interestRate ?? 7.0,
    homeAppreciationRate: (analysis as any)?.home_appreciation_rate ?? (analysis as any)?.homeAppreciationRate ?? 2.5,
    rentGrowthRate: (analysis as any)?.rent_growth_rate ?? (analysis as any)?.rentGrowthRate ?? 3.5,
    investmentReturnRate: (analysis as any)?.investment_return_rate ?? (analysis as any)?.investmentReturnRate ?? 7.0,
  };

  const [selectedChart, setSelectedChart] = useState<ChartType | null>(null);
  const [insightAnswer, setInsightAnswer] = useState<string | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightConversation, setInsightConversation] = useState<Array<{ question: string; answer: string }>>([]);
  const [insightConversationSaved, setInsightConversationSaved] = useState(false);
  const insightCacheRef = useRef<Map<string, string>>(new Map());

  // Recalculate timeline when assumptions change
  const recalculatedTimeline = useMemo(() => {
    if (!inputValues || !chartsReady || !assumptions) {
      return null;
    }

    try {
      const inputs: ScenarioInputs = {
        homePrice: inputValues.homePrice,
        downPaymentPercent: inputValues.downPaymentPercent,
        interestRate: assumptions.interestRate,
        loanTermYears: 30,
        timeHorizonYears: inputValues.timeHorizonYears || 10,
        monthlyRent: inputValues.monthlyRent,
        propertyTaxRate: (analysis as any)?.property_tax_rate ?? 1.0,
        homeInsuranceAnnual: 1200,
        hoaMonthly: 150,
        maintenanceRate: 1.0,
        renterInsuranceAnnual: 240,
        homeAppreciationRate: assumptions.homeAppreciationRate,
        rentGrowthRate: assumptions.rentGrowthRate,
        investmentReturnRate: assumptions.investmentReturnRate,
      };

      const snapshots = calculateNetWorthComparison(inputs);
      
      // Convert MonthlySnapshot[] to TimelinePoint[]
      return snapshots.map((s) => {
        const snapshot = s as any;
        return {
          monthIndex: s.month,
          year: Math.ceil(s.month / 12),
          netWorthBuy: s.buyerNetWorth,
          netWorthRent: s.renterNetWorth,
          totalCostBuyToDate: snapshot.totalBuyingCosts ?? snapshot.cumulativeBuying ?? 0,
          totalCostRentToDate: snapshot.totalRentingCosts ?? snapshot.cumulativeRenting ?? 0,
          buyMonthlyOutflow: s.monthlyBuyingCosts,
          rentMonthlyOutflow: s.monthlyRentingCosts,
          mortgagePayment: s.mortgagePayment,
          propertyTaxMonthly: snapshot.propertyTax ?? snapshot.propertyTaxMonthly ?? 0,
          insuranceMonthly: snapshot.homeInsurance ?? snapshot.insuranceMonthly ?? 0,
          maintenanceMonthly: snapshot.maintenance ?? snapshot.maintenanceMonthly ?? 0,
          hoaMonthly: snapshot.hoa ?? snapshot.hoaMonthly ?? 0,
          principalPaid: s.principalPaid,
          interestPaid: s.interestPaid,
          remainingBalance: s.remainingBalance,
          homeValue: s.homeValue,
          homeEquity: s.homeEquity,
          renterInvestmentBalance: snapshot.renterInvestmentBalance ?? s.investedDownPayment,
          buyerCashAccount: snapshot.buyerCashAccount ?? 0,
        };
      });
    } catch (error) {
      console.error('Error recalculating timeline:', error);
      return null;
    }
  }, [inputValues, assumptions, chartsReady, analysis]);

  // Normalize timeline points helper
  const normalizeTimelinePoint = (point: any): TimelinePoint => ({
    monthIndex: point.month_index ?? point.monthIndex ?? 0,
    year: point.year ?? Math.ceil((point.month_index ?? point.monthIndex ?? 0) / 12),
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
  });

  // Get data from snapshotData or props
  // Use recalculated timeline if available, otherwise use original
  const normalizedTimeline = recalculatedTimeline || timeline || analysis?.timeline?.map(normalizeTimelinePoint) || [];
  const chartData = snapshotData?.chartData || data || [];
  const costs = snapshotData?.monthlyCosts || monthlyCosts;
  const totalData = snapshotData?.totalCostData || totalCostData;
  const cashFlowSeries = snapshotData?.cashFlow ?? advancedMetrics?.cashFlow ?? null;
  const cumulativeSeries = snapshotData?.cumulativeCosts ?? advancedMetrics?.cumulativeCosts ?? null;
  const liquiditySeries = snapshotData?.liquidityTimeline ?? advancedMetrics?.liquidityTimeline ?? null;
  const taxSeries = snapshotData?.taxSavings ?? advancedMetrics?.taxSavings ?? null;
  const heatmapPoints = snapshotData?.heatmapPoints ?? heatmapData;
  const monteCarlo = snapshotData?.monteCarlo ?? monteCarloData;
  const sensitivity = snapshotData?.sensitivity ?? sensitivityData;
  const scenarioOverlay = snapshotData?.scenarioOverlay ?? scenarioOverlayData;

  const fallbackTimeline = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return [];
    }
    return chartData.map((s) => ({
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
  }, [chartData]);

  const timelineForCharts = normalizedTimeline.length > 0 ? normalizedTimeline : fallbackTimeline;

  const liquidityChartSeries = useMemo(() => {
    if (!liquiditySeries) {
      return null;
    }
    return liquiditySeries.map(p => ({
      month: p.month,
      homeownerCashFlow: p.homeownerCashAccount,
      renterCashFlow: p.renterInvestmentBalance,
    }));
  }, [liquiditySeries]);

  const breakEven = analysis?.breakEven ? {
    monthIndex: (analysis.breakEven as any).month_index ?? analysis.breakEven.monthIndex ?? null,
    year: (analysis.breakEven as any).year ?? analysis.breakEven.year ?? null,
  } : null;

  const monteCarloSummary = analysis?.monteCarloHomePrices ?? (analysis as any)?.monte_carlo_home_prices ?? monteCarlo;

  const breakEvenAnalysis = useMemo(() => {
    if (analysis && normalizedTimeline.length > 0) {
      return {
        timeline: normalizedTimeline,
        breakEven: breakEven || { monthIndex: null, year: null },
        totalBuyCost: analysis.totalBuyCost ?? (analysis as any)?.total_buy_cost ?? 0,
        totalRentCost: analysis.totalRentCost ?? (analysis as any)?.total_rent_cost ?? 0,
      };
    }
    if (fallbackTimeline.length > 0) {
      return {
        timeline: fallbackTimeline,
        breakEven: breakEven || { monthIndex: null, year: null },
        totalBuyCost: 0,
        totalRentCost: 0,
      };
    }
    return null;
  }, [analysis, normalizedTimeline, fallbackTimeline, breakEven]);

  const totalCostAnalysis = useMemo(() => {
    if (analysis && normalizedTimeline.length > 0) {
      return {
        timeline: normalizedTimeline,
        breakEven: breakEven || { monthIndex: null, year: null },
        totalBuyCost: analysis.totalBuyCost ?? (analysis as any)?.total_buy_cost ?? 0,
        totalRentCost: analysis.totalRentCost ?? (analysis as any)?.total_rent_cost ?? 0,
      };
    }
    if (timelineForCharts.length > 0 && totalData) {
      return {
        timeline: timelineForCharts,
        breakEven: breakEven || { monthIndex: null, year: null },
        totalBuyCost: totalData.totalBuyingCosts,
        totalRentCost: totalData.totalRentingCosts,
      };
    }
    return null;
  }, [analysis, normalizedTimeline, timelineForCharts, totalData, breakEven]);

  // Check if chart has data
  const hasChartData = (chartType: ChartType): boolean => {
    switch (chartType) {
      case 'netWorth':
      case 'equity':
      case 'rentGrowth':
      case 'breakEven':
        return normalizedTimeline.length > 0 || chartData.length > 0;
      case 'monthlyCost':
        return normalizedTimeline.length > 0 || !!costs;
      case 'totalCost':
        return (normalizedTimeline.length > 0 && (!!analysis || !!totalData)) || (chartData.length > 0 && !!totalData);
      case 'cashFlow':
        return !!(cashFlowSeries && cashFlowSeries.length > 0);
      case 'cumulativeCost':
        return !!(cumulativeSeries && cumulativeSeries.length > 0);
      case 'liquidity':
        return !!(liquiditySeries && liquiditySeries.length > 0);
      case 'taxSavings':
        return !!(taxSeries && taxSeries.length > 0);
      case 'breakEvenHeatmap':
        return !!(heatmapPoints && heatmapPoints.length > 0);
      case 'monteCarlo':
        return !!monteCarlo;
      case 'sensitivity':
        return !!(sensitivity && sensitivity.length > 0);
      case 'scenarioOverlay':
        return !!(scenarioOverlay && scenarioOverlay.length > 0);
      default:
        return false;
    }
  };

  // Get progress for a specific chart
  const getChartProgress = (chartType: ChartType): number => {
    // If actively loading this specific chart, use its progress
    if (chartLoading?.type === chartType) {
      return chartLoading.progress;
    }
    // If chart has data, it's complete
    if (hasChartData(chartType)) {
      return 100;
    }
    // If charts are ready but this one doesn't have data yet, show 0% (will show progress bar)
    if (chartsReady) {
      return 0;
    }
    // If charts aren't ready yet, return 0 (will show placeholder)
    return 0;
  };

  // Render individual chart with progress/placeholder logic
  const renderChart = (chartType: ChartType) => {
    const hasData = hasChartData(chartType);
    const progress = getChartProgress(chartType);
    const isLoading = chartLoading?.type === chartType && progress < 100;
    
    // Show placeholder if no data and not ready
    if (!chartsReady) {
      return (
        <div className="chart-grid-placeholder">
          <div className="chart-grid-placeholder-icon">📊</div>
          <h4>{chartTitles[chartType]}</h4>
          <p>Chart will start generating once all the data is provided</p>
        </div>
      );
    }

    // Show progress bar if charts are ready but this chart doesn't have data yet, or if actively loading
    if (chartsReady && (!hasData || isLoading)) {
      return (
        <div className="chart-grid-loading">
          <div className="chart-grid-loading-header">
            <h4>{chartTitles[chartType]}</h4>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="chart-grid-progress-bar">
            <div 
              className="chart-grid-progress-fill" 
              style={{ width: `${Math.max(progress, 5)}%` }}
            />
          </div>
          <p className="chart-grid-loading-message">
            {isLoading && chartLoading?.message ? chartLoading.message : 'Generating chart...'}
          </p>
        </div>
      );
    }

    // Render actual chart - only reaches here if hasData is true
    switch (chartType) {
      case 'netWorth':
        if (normalizedTimeline.length > 0) {
          return <NetWorthChart timeline={normalizedTimeline} />;
        }
        if (fallbackTimeline.length > 0) {
          return <NetWorthChart timeline={fallbackTimeline} />;
        }
        return <ChartPlaceholder title={chartTitles.netWorth} description="Net worth data not available" />;

      case 'monthlyCost':
        if (timelineForCharts.length > 0) {
          return <MonthlyCostChart timeline={timelineForCharts} />;
        }
        if (costs) {
          return (
            <MonthlyCostChart
              timeline={[{
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
              }]}
            />
          );
        }
        return <ChartPlaceholder title={chartTitles.monthlyCost} description="Monthly cost data not available" />;

      case 'totalCost':
        if (totalCostAnalysis && totalCostAnalysis.timeline.length > 0) {
          return <TotalCostChart analysis={totalCostAnalysis} />;
        }
        return <ChartPlaceholder title={chartTitles.totalCost} description="Total cost data not available" />;

      case 'equity':
        if (normalizedTimeline.length > 0) {
          return <EquityBuildupChart timeline={normalizedTimeline} />;
        }
        if (fallbackTimeline.length > 0) {
          return <EquityBuildupChart timeline={fallbackTimeline} />;
        }
        return <ChartPlaceholder title={chartTitles.equity} description="Equity data not available" />;

      case 'rentGrowth':
        if (normalizedTimeline.length > 0) {
          return <RentGrowthChart timeline={normalizedTimeline} />;
        }
        if (fallbackTimeline.length > 0) {
          return <RentGrowthChart timeline={fallbackTimeline} />;
        }
        return <ChartPlaceholder title={chartTitles.rentGrowth} description="Rent growth data not available" />;

      case 'breakEven':
        if (breakEvenAnalysis) {
          return (
            <div className="chart-wrapper">
              <BreakEvenChart analysis={breakEvenAnalysis as AnalysisResult} />
            </div>
          );
        }

        return (
          <div className="chart-wrapper">
            <ChartPlaceholder title={chartTitles.breakEven} description="Break-even data not available" />
          </div>
        );

      case 'cashFlow':
        return cashFlowSeries && cashFlowSeries.length > 0 ? (
          <CashFlowChart data={cashFlowSeries} />
        ) : (
          <ChartPlaceholder title={chartTitles.cashFlow} description="Cash flow data not available" />
        );

      case 'cumulativeCost':
        return cumulativeSeries && cumulativeSeries.length > 0 ? (
          <CumulativeCostChart data={cumulativeSeries} />
        ) : (
          <ChartPlaceholder title={chartTitles.cumulativeCost} description="Cumulative cost data not available" />
        );

      case 'liquidity':
        return liquidityChartSeries && liquidityChartSeries.length > 0 ? (
          <CashFlowChart data={liquidityChartSeries} />
        ) : (
          <ChartPlaceholder title={chartTitles.liquidity} description="Liquidity data not available" />
        );

      case 'taxSavings':
        return taxSeries && taxSeries.length > 0 ? (
          <TaxSavingsChart data={taxSeries} />
        ) : (
          <ChartPlaceholder title={chartTitles.taxSavings} description="Tax savings data not available" />
        );

      case 'breakEvenHeatmap':
        if (heatmapPoints && heatmapPoints.length > 0) {
          return (
            <div className="chart-wrapper">
              <BreakEvenHeatmap points={heatmapPoints} />
            </div>
          );
        }
        return (
          <div className="chart-wrapper">
            <ChartPlaceholder title={chartTitles.breakEvenHeatmap} description="Break-even heatmap data not available" />
          </div>
        );

      case 'monteCarlo':
        if (monteCarloSummary && monteCarloSummary.years && monteCarloSummary.p10 && monteCarloSummary.p50 && monteCarloSummary.p90) {
          return (
            <div className="chart-wrapper">
              <MonteCarloChart monteCarloHomePrices={monteCarloSummary} />
            </div>
          );
        }
        return (
          <div className="chart-wrapper">
            <ChartPlaceholder title={chartTitles.monteCarlo} description="Monte Carlo data not available" />
          </div>
        );

      case 'sensitivity':
        return sensitivity && sensitivity.length > 0 ? (
          <SensitivityChart results={sensitivity} />
        ) : (
          <ChartPlaceholder title={chartTitles.sensitivity} description="Sensitivity analysis data not available" />
        );

      case 'scenarioOverlay':
        if (scenarioOverlay && scenarioOverlay.length > 0) {
          return (
            <div className="chart-wrapper">
              <ScenarioOverlayChart scenarios={scenarioOverlay} />
            </div>
          );
        }
        return (
          <div className="chart-wrapper">
            <ChartPlaceholder title={chartTitles.scenarioOverlay} description="Scenario overlay data not available" />
          </div>
        );

      default:
        return <ChartPlaceholder title="Chart" description="Chart not available" />;
    }
  };

  const buildChartInsightPayload = (chartType: ChartType): { payload: unknown; signature: string } | null => {
    let payload: unknown = null;
    switch (chartType) {
      case 'netWorth':
      case 'equity':
      case 'rentGrowth':
        if (timelineForCharts.length === 0) {
          return null;
        }
        payload = {
          timeline: downsample(
            timelineForCharts.map(point => ({
              year: point.year,
              netWorthBuy: point.netWorthBuy,
              netWorthRent: point.netWorthRent,
              buyMonthlyOutflow: point.buyMonthlyOutflow,
              rentMonthlyOutflow: point.rentMonthlyOutflow,
              totalCostBuyToDate: point.totalCostBuyToDate,
              totalCostRentToDate: point.totalCostRentToDate,
            })),
            MAX_TIMELINE_POINTS,
          ),
        };
        break;
      case 'monthlyCost':
        if (timelineForCharts.length === 0 && !costs) {
          return null;
        }
        payload = {
          snapshot: timelineForCharts.length > 0
            ? {
                year: timelineForCharts[0].year,
                buyMonthlyOutflow: timelineForCharts[0].buyMonthlyOutflow,
                rentMonthlyOutflow: timelineForCharts[0].rentMonthlyOutflow,
              }
            : null,
          monthlyCosts: costs,
        };
        break;
      case 'totalCost':
        if (!totalCostAnalysis) {
          return null;
        }
        payload = {
          breakEven: totalCostAnalysis.breakEven,
          totals: {
            totalBuyCost: totalCostAnalysis.totalBuyCost,
            totalRentCost: totalCostAnalysis.totalRentCost,
          },
          timeline: downsample(
            totalCostAnalysis.timeline.map(point => ({
              year: point.year,
              totalCostBuyToDate: point.totalCostBuyToDate,
              totalCostRentToDate: point.totalCostRentToDate,
            })),
            MAX_TIMELINE_POINTS,
          ),
        };
        break;
      case 'breakEven':
        if (!breakEvenAnalysis) {
          return null;
        }
        payload = {
          breakEven: breakEvenAnalysis.breakEven,
          timeline: downsample(
            breakEvenAnalysis.timeline.map(point => ({
              year: point.year,
              netWorthBuy: point.netWorthBuy,
              netWorthRent: point.netWorthRent,
            })),
            MAX_TIMELINE_POINTS,
          ),
        };
        break;
      case 'cashFlow':
        if (!cashFlowSeries || cashFlowSeries.length === 0) {
          return null;
        }
        payload = downsample(cashFlowSeries, MAX_GENERIC_POINTS);
        break;
      case 'cumulativeCost':
        if (!cumulativeSeries || cumulativeSeries.length === 0) {
          return null;
        }
        payload = downsample(cumulativeSeries, MAX_GENERIC_POINTS);
        break;
      case 'liquidity':
        if (!liquiditySeries || !liquidityChartSeries) {
          return null;
        }
        payload = {
          liquidityTimeline: downsample(liquiditySeries, MAX_GENERIC_POINTS),
          chartSeries: downsample(liquidityChartSeries, MAX_GENERIC_POINTS),
        };
        break;
      case 'taxSavings':
        if (!taxSeries || taxSeries.length === 0) {
          return null;
        }
        payload = downsample(taxSeries, MAX_GENERIC_POINTS);
        break;
      case 'breakEvenHeatmap':
        if (!heatmapPoints || heatmapPoints.length === 0) {
          return null;
        }
        payload = downsample(heatmapPoints, 100);
        break;
      case 'monteCarlo':
        if (!monteCarloSummary) {
          return null;
        }
        const sampledIndexes = downsample(
          monteCarloSummary.years.map((_, index) => index),
          40,
        );
        payload = {
          years: sampledIndexes.map(index => monteCarloSummary.years[index]),
          p10: sampledIndexes.map(index => monteCarloSummary.p10[index]),
          p50: sampledIndexes.map(index => monteCarloSummary.p50[index]),
          p90: sampledIndexes.map(index => monteCarloSummary.p90[index]),
        };
        break;
      case 'sensitivity':
        if (!sensitivity || sensitivity.length === 0) {
          return null;
        }
        payload = sensitivity.map(result => ({
          variant: result.variant,
          finalBuyerNetWorth: result.output.summary.finalBuyerNetWorth,
          finalRenterNetWorth: result.output.summary.finalRenterNetWorth,
          breakevenMonth: result.output.summary.breakevenMonth,
        }));
        break;
      case 'scenarioOverlay':
        if (!scenarioOverlay || scenarioOverlay.length === 0) {
          return null;
        }
        payload = scenarioOverlay.map(entry => ({
          loanTermYears: entry.scenario.loanTermYears,
          homePrice: entry.scenario.homePrice,
          monthlyRent: entry.scenario.monthlyRent,
          downPaymentPercent: entry.scenario.downPaymentPercent,
          finalBuyerNetWorth: entry.output.summary.finalBuyerNetWorth,
          finalRenterNetWorth: entry.output.summary.finalRenterNetWorth,
        }));
        break;
      default:
        return null;
    }
    const signature = hashString(`${chartType}:${serializeForSignature(payload)}`);
    return { payload, signature };
  };

  const handleChartClick = (chartType: ChartType) => {
    if (!hasChartData(chartType)) {
      return;
    }
    setSelectedChart(chartType);
    setInsightAnswer(null);
    setInsightError(null);
    setInsightConversation([]);
    setInsightConversationSaved(false);
  };

  const handleCloseInsight = async () => {
    // Check if there's unsaved conversation (only if not already saved)
    if (insightConversation.length > 0 && selectedChart && !insightConversationSaved) {
      const shouldSave = window.confirm(
        'You have an unsaved conversation. Would you like to save it before closing?'
      );
      
      if (shouldSave) {
        try {
          await handleSaveChartInsight(selectedChart);
        } catch (error) {
          console.error('Error saving before close:', error);
          // Still close even if save fails
        }
      }
    }
    
    setSelectedChart(null);
    setInsightError(null);
    setInsightConversation([]);
    setInsightAnswer(null);
    setInsightConversationSaved(false);
  };

  useEffect(() => {
    if (!selectedChart) {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseInsight();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedChart]);

  const handleInsightSubmit = async (question: string) => {
    if (!selectedChart) {
      return;
    }
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setInsightError('Add a question first.');
      return;
    }
    if (insightLoading) {
      return;
    }
    // Mark conversation as unsaved when a new question is asked
    setInsightConversationSaved(false);
    const payloadInfo = buildChartInsightPayload(selectedChart);
    if (!payloadInfo) {
      setInsightError('Chart data is still loading. Try again in a moment.');
      return;
    }
    const { payload: chartPayload, signature } = payloadInfo;
    const cacheKey = `${selectedChart}:${signature}:${trimmedQuestion}`;
    if (insightCacheRef.current.has(cacheKey)) {
      setInsightAnswer(insightCacheRef.current.get(cacheKey) ?? null);
      setInsightError(null);
      return;
    }

    try {
      setInsightLoading(true);
      setInsightError(null);
      setInsightAnswer('');
      
      let fullAnswer = '';
      const abortStream = fetchChartInsightStream(
        {
          chartName: chartTitles[selectedChart],
          chartData: chartPayload,
          question: trimmedQuestion,
          conversation: insightConversation.length > 0 ? insightConversation : undefined,
        },
        (chunk) => {
          fullAnswer += chunk;
          setInsightAnswer(fullAnswer);
        },
        (error) => {
          setInsightError(error.message ?? 'Unable to fetch insight.');
          setInsightLoading(false);
        },
        () => {
          insightCacheRef.current.set(cacheKey, fullAnswer);
          setInsightConversation([...insightConversation, { question: trimmedQuestion, answer: fullAnswer }]);
          setInsightAnswer(null);
          setInsightLoading(false);
        }
      );
      
      // Store abort function for cleanup if needed
      (handleInsightSubmit as any).abort = abortStream;
    } catch (error: any) {
      setInsightError(error.message ?? 'Unable to fetch insight.');
      setInsightLoading(false);
    }
  };

  const handleSaveChartInsight = async (chartType: ChartType) => {
    if (!chartType || insightConversation.length === 0) {
      return;
    }

    try {
      // Find the chart element in the modal
      const chartElement = document.querySelector('.chart-insight-modal-chart');
      if (!chartElement) {
        alert('Unable to capture chart. Please try again.');
        return;
      }

      // Wait a bit to ensure chart is fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture chart as image with white background for PDF
      const chartCanvas = await html2canvas(chartElement as HTMLElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
        removeContainer: false,
        allowTaint: false,
        onclone: (clonedDoc) => {
          // Set white background on the cloned element for better PDF visibility
          const clonedElement = clonedDoc.querySelector('.chart-insight-modal-chart') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.backgroundColor = '#ffffff';
            clonedElement.style.background = '#ffffff';
            // Also update any child chart containers
            const chartContainers = clonedElement.querySelectorAll('.chart-container, .chart-wrapper');
            chartContainers.forEach((container: Element) => {
              (container as HTMLElement).style.backgroundColor = '#ffffff';
              (container as HTMLElement).style.background = '#ffffff';
            });
          }
        },
      });
      
      const chartImgData = chartCanvas.toDataURL('image/png', 1.0);

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;

      // Add title
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      pdf.text(chartTitles[chartType], margin, margin + 10);
      
      // Add date
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      const dateStr = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      pdf.text(dateStr, margin, margin + 18);

      let yPos = margin + 30;

      // Add chart image
      const chartAspectRatio = chartCanvas.height / chartCanvas.width;
      const chartWidth = contentWidth;
      const chartHeight = chartWidth * chartAspectRatio;
      
      if (yPos + chartHeight > pageHeight - margin) {
        pdf.addPage();
        yPos = margin;
      }
      
      pdf.addImage(chartImgData, 'PNG', margin, yPos, chartWidth, chartHeight);
      yPos += chartHeight + 15;

      // Add conversation
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Chart Insights Conversation', margin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      insightConversation.forEach((msg, idx) => {
        // Check if we need a new page
        if (yPos > pageHeight - margin - 30) {
          pdf.addPage();
          yPos = margin;
        }

        // Question
        pdf.setFontSize(11);
        pdf.setTextColor(59, 130, 246);
        pdf.text(`Q${idx + 1}: ${msg.question}`, margin, yPos);
        yPos += 7;

        // Answer
        pdf.setFontSize(10);
        pdf.setTextColor(50, 50, 50);
        const answerLines = pdf.splitTextToSize(msg.answer, contentWidth);
        pdf.text(answerLines, margin, yPos);
        yPos += answerLines.length * 5 + 10;
      });

      // Save PDF
      const fileName = `chart-insight-${chartTitles[chartType].toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      pdf.save(fileName);
      
      // Mark conversation as saved
      setInsightConversationSaved(true);
    } catch (error: any) {
      console.error('Error saving chart insight:', error);
      alert('Failed to save chart insight. Please try again.');
      // Don't mark as saved if save failed
    }
  };

  const renderChartCard = (chartType: ChartType, options: { large?: boolean } = {}) => {
    const isSelected = selectedChart === chartType;
    const interactive = hasChartData(chartType);
    const classNames = [
      'chart-grid-item',
      options.large ? 'chart-grid-item-large' : '',
      interactive ? 'chart-grid-item-clickable' : '',
      isSelected ? 'chart-grid-item-selected' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        key={chartType}
        className={classNames}
        onClick={interactive ? () => handleChartClick(chartType) : undefined}
        onKeyDown={
          interactive
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleChartClick(chartType);
                }
              }
            : undefined
        }
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
      >
        <div className="chart-grid-item-header">
          <h3>{chartTitles[chartType]}</h3>
        </div>
        <div className="chart-grid-item-content">{renderChart(chartType)}</div>
      </div>
    );
  };

  // Always show the grid, even if no data yet
  return (
    <div className="charts-grid-container">
      {/* Row 1: 4 charts */}
      <div className="charts-grid-row">
        <div className="charts-grid">
          {ROW_1_CHARTS.map(chartType => renderChartCard(chartType))}
        </div>
      </div>

      {/* Row 2: 4 charts */}
      <div className="charts-grid-row">
        <div className="charts-grid">
          {ROW_2_CHARTS.map(chartType => renderChartCard(chartType))}
        </div>
      </div>

      {/* Row 3: 2 larger charts (heatmap and scenario overlay) */}
      <div className="charts-grid-row charts-grid-row-large">
        <div className="charts-grid charts-grid-large">
          {ROW_3_CHARTS.map(chartType => renderChartCard(chartType, { large: true }))}
        </div>
      </div>

      {/* Remaining charts row (4 charts) */}
      <div className="charts-grid-row">
        <div className="charts-grid">
          {REMAINING_CHARTS.map(chartType => renderChartCard(chartType))}
        </div>
      </div>

      {selectedChart && (
        <div
          className="chart-insight-modal-overlay"
          onClick={handleCloseInsight}
        >
          <div
            className="chart-insight-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="chart-insight-modal-header">
              <div>
                <span className="chart-insight-modal-label">Chart Insight Mode</span>
                <h2>{chartTitles[selectedChart]}</h2>
              </div>
              <button
                className="chart-insight-close"
                onClick={handleCloseInsight}
                aria-label="Close chart insight"
              >
                ×
              </button>
            </div>
            <div className="chart-insight-modal-body">
              <div className="chart-insight-modal-chart">
                {renderChart(selectedChart)}
              </div>
              <ChartInsightPanel
                key={selectedChart}
                chartName={chartTitles[selectedChart]}
                answer={insightAnswer}
                error={insightError}
                isLoading={insightLoading}
                conversation={insightConversation}
                onSubmit={handleInsightSubmit}
                onSave={() => handleSaveChartInsight(selectedChart)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

