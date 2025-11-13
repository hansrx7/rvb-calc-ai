"""Pydantic models for finance analysis inputs and outputs."""

from typing import List, Optional

from pydantic import BaseModel, Field


class ScenarioInputs(BaseModel):
    """User-provided scenario inputs."""

    homePrice: float = Field(..., gt=0)
    downPaymentPercent: float = Field(..., ge=0, le=100)
    interestRate: float = Field(..., ge=0)
    loanTermYears: int = Field(..., gt=0)
    timeHorizonYears: int = Field(..., gt=0)
    monthlyRent: float = Field(..., ge=0)
    propertyTaxRate: float = Field(..., ge=0)
    homeInsuranceAnnual: float = Field(..., ge=0)
    hoaMonthly: float = Field(..., ge=0)
    maintenanceRate: float = Field(..., ge=0)
    renterInsuranceAnnual: float = Field(..., ge=0)
    homeAppreciationRate: float = Field(..., ge=-100)
    rentGrowthRate: float = Field(..., ge=-100)
    investmentReturnRate: float = Field(..., ge=-100)


class MonthlySnapshot(BaseModel):
    month: int
    mortgagePayment: float
    principalPaid: float
    interestPaid: float
    remainingBalance: float
    homeValue: float
    homeEquity: float
    monthlyBuyingCosts: float
    monthlyRent: float
    monthlyRentingCosts: float
    investedDownPayment: float
    buyerNetWorth: float
    renterNetWorth: float
    netWorthDelta: float


class MonthlyCosts(BaseModel):
    mortgage: float
    propertyTax: float
    insurance: float
    hoa: float
    maintenance: float
    total: float


class RentingCosts(BaseModel):
    rent: float
    insurance: float
    total: float


class TotalCostSummary(BaseModel):
    buyerFinalNetWorth: float
    renterFinalNetWorth: float
    totalBuyingCosts: float
    totalRentingCosts: float
    finalHomeValue: float
    finalInvestmentValue: float


class CalculatorSummary(BaseModel):
    totalInterestPaid: float
    totalPrincipalPaid: float
    breakevenMonth: Optional[int]
    finalBuyerNetWorth: float
    finalRenterNetWorth: float
    finalNetWorthDelta: float


class CalculatorOutput(BaseModel):
    inputs: ScenarioInputs
    monthlySnapshots: List[MonthlySnapshot]
    summary: CalculatorSummary
    monthlyCosts: MonthlyCosts
    rentingCosts: RentingCosts
    totals: TotalCostSummary


class AnalysisRequest(BaseModel):
    inputs: ScenarioInputs
    includeTimeline: bool = False


class TimelinePoint(BaseModel):
    month: int
    buyerNetWorth: float
    renterNetWorth: float
    netWorthDelta: float


class AnalysisResponse(BaseModel):
    analysis: CalculatorOutput
    timeline: Optional[List[TimelinePoint]] = None
