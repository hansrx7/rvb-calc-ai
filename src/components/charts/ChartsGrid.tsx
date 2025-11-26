// src/components/charts/ChartsGrid.tsx

import { useState, useEffect, useMemo } from 'react';
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
import { AssumptionControls } from './AssumptionControls';
import { calculateNetWorthComparison } from '../../lib/finance/calculator';
import type { AnalysisResult, TimelinePoint, MonthlySnapshot, TotalCostSummary, CashFlowPoint, CumulativeCostPoint, LiquidityPoint, TaxSavingsPoint, BreakEvenHeatmapPoint, HomePricePathSummary, SensitivityResult, ScenarioResult, ScenarioInputs } from '../../types/calculator';
import './ChartsGrid.css';

interface ChartsGridProps {
  snapshotData: {
    analysis?: AnalysisResult;
    chartData?: MonthlySnapshot[];
    monthlyCosts?: { buying: any; renting: any };
    totalCostData?: TotalCostSummary;
    cashFlow?: CashFlowPoint[];
    cumulativeCosts?: CumulativeCostPoint[];
    liquidityTimeline?: LiquidityPoint[];
    taxSavings?: TaxSavingsPoint[];
    heatmapPoints?: BreakEvenHeatmapPoint[];
    monteCarlo?: HomePricePathSummary | null;
    sensitivity?: SensitivityResult[];
    scenarioOverlay?: ScenarioResult[];
  } | null;
  timeline?: TimelinePoint[];
  data?: MonthlySnapshot[];
  monthlyCosts?: { buying: any; renting: any };
  totalCostData?: TotalCostSummary;
  advancedMetrics?: {
    cashFlow?: CashFlowPoint[];
    cumulativeCosts?: CumulativeCostPoint[];
    liquidityTimeline?: LiquidityPoint[];
    taxSavings?: TaxSavingsPoint[];
  };
  heatmapData?: BreakEvenHeatmapPoint[];
  monteCarloData?: HomePricePathSummary | null;
  sensitivityData?: SensitivityResult[];
  scenarioOverlayData?: ScenarioResult[];
  chartsReady?: boolean;
  chartLoading?: {
    type: string | null;
    progress: number;
    message: string;
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

const BASIC_CHARTS: ChartType[] = ['monthlyCost', 'netWorth', 'equity', 'totalCost'];
const ADVANCED_CHARTS: ChartType[] = ['monteCarlo', 'breakEven', 'breakEvenHeatmap', 'cashFlow', 'cumulativeCost', 'liquidity', 'rentGrowth', 'taxSavings', 'scenarioOverlay', 'sensitivity'];

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
}: ChartsGridProps) {
  // Extract original input values from snapshotData
  const inputValues = snapshotData?.inputValues;
  
  // Extract current assumption values from analysis
  const analysis = snapshotData?.analysis;
  const initialAssumptions = useMemo(() => {
    if (analysis) {
      return {
        interestRate: (analysis as any).interest_rate ?? 7.0,
        homeAppreciationRate: (analysis as any).home_appreciation_rate ?? analysis.homeAppreciationRate ?? 2.5,
        rentGrowthRate: (analysis as any).rent_growth_rate ?? analysis.rentGrowthRate ?? 3.5,
        investmentReturnRate: (analysis as any).investment_return_rate ?? analysis.investmentReturnRate ?? 7.0,
      };
    }
    // Fallback defaults
    return {
      interestRate: 7.0,
      homeAppreciationRate: 2.5,
      rentGrowthRate: 3.5,
      investmentReturnRate: 7.0,
    };
  }, [analysis]);

  // State for adjusted assumptions
  const [adjustedAssumptions, setAdjustedAssumptions] = useState(initialAssumptions);

  // Recalculate timeline when assumptions change
  const recalculatedTimeline = useMemo(() => {
    if (!inputValues || !chartsReady) {
      return null;
    }

    try {
      const inputs: ScenarioInputs = {
        homePrice: inputValues.homePrice,
        downPaymentPercent: inputValues.downPaymentPercent,
        interestRate: adjustedAssumptions.interestRate,
        loanTermYears: 30,
        timeHorizonYears: inputValues.timeHorizonYears || 10,
        monthlyRent: inputValues.monthlyRent,
        propertyTaxRate: (analysis as any)?.property_tax_rate ?? 1.0,
        homeInsuranceAnnual: 1200,
        hoaMonthly: 150,
        maintenanceRate: 1.0,
        renterInsuranceAnnual: 240,
        homeAppreciationRate: adjustedAssumptions.homeAppreciationRate,
        rentGrowthRate: adjustedAssumptions.rentGrowthRate,
        investmentReturnRate: adjustedAssumptions.investmentReturnRate,
      };

      const snapshots = calculateNetWorthComparison(inputs);
      
      // Convert MonthlySnapshot[] to TimelinePoint[]
      return snapshots.map((s, index) => ({
        monthIndex: s.month,
        year: Math.ceil(s.month / 12),
        netWorthBuy: s.buyerNetWorth,
        netWorthRent: s.renterNetWorth,
        totalCostBuyToDate: s.totalBuyingCosts,
        totalCostRentToDate: s.totalRentingCosts,
        buyMonthlyOutflow: s.monthlyBuyingCosts,
        rentMonthlyOutflow: s.monthlyRentingCosts,
        mortgagePayment: s.mortgagePayment,
        propertyTaxMonthly: s.propertyTax,
        insuranceMonthly: s.homeInsurance,
        maintenanceMonthly: s.maintenance,
        hoaMonthly: s.hoa,
        principalPaid: s.principalPaid,
        interestPaid: s.interestPaid,
        remainingBalance: s.remainingBalance,
        homeValue: s.homeValue,
        homeEquity: s.homeEquity,
        renterInvestmentBalance: s.investedDownPayment,
        buyerCashAccount: s.buyerCashAccount,
      }));
    } catch (error) {
      console.error('Error recalculating timeline:', error);
      return null;
    }
  }, [inputValues, adjustedAssumptions, chartsReady, analysis]);

  // Update assumptions when initial values change
  useEffect(() => {
    setAdjustedAssumptions(initialAssumptions);
  }, [initialAssumptions]);

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

  const breakEven = analysis?.breakEven ? {
    monthIndex: (analysis.breakEven as any).month_index ?? analysis.breakEven.monthIndex ?? null,
    year: (analysis.breakEven as any).year ?? analysis.breakEven.year ?? null,
  } : null;

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
        return normalizedTimeline.length > 0 ? (
          <NetWorthChart timeline={normalizedTimeline} />
        ) : chartData.length > 0 ? (
          <NetWorthChart timeline={chartData.map(s => ({
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
        ) : (
          <ChartPlaceholder title={chartTitles.netWorth} description="Net worth data not available" />
        );

      case 'monthlyCost':
        return normalizedTimeline.length > 0 ? (
          <MonthlyCostChart timeline={normalizedTimeline} />
        ) : costs ? (
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
        ) : (
          <ChartPlaceholder title={chartTitles.monthlyCost} description="Monthly cost data not available" />
        );

      case 'totalCost':
        const normalizedAnalysis = analysis ? {
          timeline: normalizedTimeline,
          breakEven: breakEven || { monthIndex: null, year: null },
          totalBuyCost: analysis.totalBuyCost ?? (analysis as any).total_buy_cost ?? 0,
          totalRentCost: analysis.totalRentCost ?? (analysis as any).total_rent_cost ?? 0,
        } : null;

        if (normalizedAnalysis && normalizedAnalysis.timeline.length > 0) {
          return <TotalCostChart analysis={normalizedAnalysis} />;
        }
        if (normalizedTimeline.length > 0 && totalData) {
          return <TotalCostChart analysis={{
            timeline: normalizedTimeline,
            breakEven: breakEven || { monthIndex: null, year: null },
            totalBuyCost: totalData.totalBuyingCosts,
            totalRentCost: totalData.totalRentingCosts,
          }} />;
        }
        return <ChartPlaceholder title={chartTitles.totalCost} description="Total cost data not available" />;

      case 'equity':
        return normalizedTimeline.length > 0 ? (
          <EquityBuildupChart timeline={normalizedTimeline} />
        ) : chartData.length > 0 ? (
          <EquityBuildupChart timeline={chartData.map(s => ({
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
        ) : (
          <ChartPlaceholder title={chartTitles.equity} description="Equity data not available" />
        );

      case 'rentGrowth':
        return normalizedTimeline.length > 0 ? (
          <RentGrowthChart timeline={normalizedTimeline} />
        ) : chartData.length > 0 ? (
          <RentGrowthChart timeline={chartData.map(s => ({
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
        ) : (
          <ChartPlaceholder title={chartTitles.rentGrowth} description="Rent growth data not available" />
        );

      case 'breakEven':
        const normalizedBreakEvenAnalysis =
          normalizedTimeline.length > 0 && analysis
            ? {
                timeline: normalizedTimeline,
                breakEven: breakEven || { monthIndex: null, year: null },
                totalBuyCost: analysis.totalBuyCost ?? (analysis as any).total_buy_cost ?? 0,
                totalRentCost: analysis.totalRentCost ?? (analysis as any).total_rent_cost ?? 0,
              }
            : null;

        if (normalizedBreakEvenAnalysis) {
          return (
            <div className="chart-wrapper">
              <BreakEvenChart analysis={normalizedBreakEvenAnalysis} />
            </div>
          );
        }

        if (chartData.length > 0) {
          const legacyAnalysis = {
            timeline: chartData.map(s => ({
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
            breakEven: breakEven || { monthIndex: null, year: null },
            totalBuyCost: 0,
            totalRentCost: 0,
          };

          return (
            <div className="chart-wrapper">
              <BreakEvenChart analysis={legacyAnalysis as AnalysisResult} />
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
        return liquiditySeries && liquiditySeries.length > 0 ? (
          <CashFlowChart
            data={liquiditySeries.map(p => ({
              month: p.month,
              homeownerCashFlow: p.homeownerCashAccount,
              renterCashFlow: p.renterInvestmentBalance,
            }))}
          />
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
        const monteCarloSummary = analysis?.monteCarloHomePrices ?? (analysis as any)?.monte_carlo_home_prices ?? monteCarlo;
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

  // Always show the grid, even if no data yet
  return (
    <div className="charts-grid-container">
      {/* Assumption Controls */}
      {chartsReady && inputValues && (
        <AssumptionControls
          initialValues={initialAssumptions}
          onAssumptionsChange={setAdjustedAssumptions}
        />
      )}

      <div className="charts-grid-section">
        <h2 className="charts-grid-section-title">Core Charts</h2>
        <div className="charts-grid">
          {BASIC_CHARTS.map(chartType => (
            <div key={chartType} className="chart-grid-item">
              <div className="chart-grid-item-header">
                <h3>{chartTitles[chartType]}</h3>
              </div>
              <div className="chart-grid-item-content">
                {renderChart(chartType)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="charts-grid-section">
        <h2 className="charts-grid-section-title">Advanced Analysis</h2>
        <div className="charts-grid">
          {ADVANCED_CHARTS.map(chartType => (
            <div key={chartType} className="chart-grid-item">
              <div className="chart-grid-item-header">
                <h3>{chartTitles[chartType]}</h3>
              </div>
              <div className="chart-grid-item-content">
                {renderChart(chartType)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

