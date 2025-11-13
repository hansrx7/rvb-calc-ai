"""Finance calculator logic mirrored from the TypeScript implementation."""

from __future__ import annotations

from dataclasses import dataclass
from math import pow
from typing import Iterable, List

from ..models import (
    CalculatorOutput,
    CalculatorSummary,
    MonthlyCosts,
    MonthlySnapshot,
    RentingCosts,
    ScenarioInputs,
    TotalCostSummary,
)


@dataclass
class AmortizationMonth:
    month: int
    payment: float
    principal_paid: float
    interest_paid: float
    remaining_balance: float


def get_timeline_multiplier(time_horizon_years: int) -> float:
    if time_horizon_years <= 3:
        return 0.1
    if time_horizon_years <= 7:
        return 0.5
    return 1.0


def get_timeline_based_rates(time_horizon_years: int) -> dict[str, float]:
    if time_horizon_years <= 3:
        return {
            "homeAppreciationRate": 0.5,
            "rentGrowthRate": 2.0,
            "investmentReturnRate": 4.0,
        }
    if time_horizon_years <= 7:
        return {
            "homeAppreciationRate": 1.5,
            "rentGrowthRate": 3.0,
            "investmentReturnRate": 6.0,
        }
    return {
        "homeAppreciationRate": 2.5,
        "rentGrowthRate": 3.5,
        "investmentReturnRate": 7.0,
    }


def calculate_monthly_payment(principal: float, annual_interest_rate: float, loan_term_years: int) -> float:
    if principal <= 0:
        return 0.0

    if annual_interest_rate == 0:
        return principal / (loan_term_years * 12)

    monthly_rate = annual_interest_rate / 100 / 12
    num_payments = loan_term_years * 12
    factor = pow(1 + monthly_rate, num_payments)
    numerator = monthly_rate * factor
    denominator = factor - 1
    if denominator == 0:
        return 0.0
    return principal * (numerator / denominator)


def generate_amortization_schedule(
    principal: float, annual_interest_rate: float, loan_term_years: int
) -> List[AmortizationMonth]:
    schedule: List[AmortizationMonth] = []
    monthly_payment = calculate_monthly_payment(principal, annual_interest_rate, loan_term_years)
    monthly_rate = annual_interest_rate / 100 / 12
    num_payments = loan_term_years * 12
    remaining_balance = principal

    for month in range(1, num_payments + 1):
        interest_paid = remaining_balance * monthly_rate if monthly_rate > 0 else 0.0
        principal_paid = monthly_payment - interest_paid
        if principal_paid < 0:
            principal_paid = 0.0
        remaining_balance = max(0.0, remaining_balance - principal_paid)
        schedule.append(
            AmortizationMonth(
                month=month,
                payment=monthly_payment,
                principal_paid=principal_paid,
                interest_paid=interest_paid,
                remaining_balance=remaining_balance,
            )
        )

    return schedule


def calculate_buying_costs(inputs: ScenarioInputs) -> MonthlyCosts:
    down_payment_amount = inputs.homePrice * (inputs.downPaymentPercent / 100)
    loan_amount = max(0.0, inputs.homePrice - down_payment_amount)

    mortgage = calculate_monthly_payment(loan_amount, inputs.interestRate, inputs.loanTermYears)
    property_tax = (inputs.homePrice * (inputs.propertyTaxRate / 100)) / 12
    insurance = inputs.homeInsuranceAnnual / 12
    hoa = inputs.hoaMonthly
    maintenance = (inputs.homePrice * (inputs.maintenanceRate / 100)) / 12
    total = mortgage + property_tax + insurance + hoa + maintenance

    return MonthlyCosts(
        mortgage=mortgage,
        propertyTax=property_tax,
        insurance=insurance,
        hoa=hoa,
        maintenance=maintenance,
        total=total,
    )


def calculate_renting_costs(inputs: ScenarioInputs, month: int) -> RentingCosts:
    if month < 1:
        raise ValueError("month must be >= 1")

    year = (month - 1) // 12
    growth_multiplier = pow(1 + inputs.rentGrowthRate / 100, year)
    monthly_rent = inputs.monthlyRent * growth_multiplier
    insurance = inputs.renterInsuranceAnnual / 12
    total = monthly_rent + insurance

    return RentingCosts(rent=monthly_rent, insurance=insurance, total=total)


def _calculate_pmi(loan_amount: float) -> float:
    return (loan_amount * 0.005) / 12


def calculate_net_worth_comparison(inputs: ScenarioInputs) -> List[MonthlySnapshot]:
    down_payment_amount = inputs.homePrice * (inputs.downPaymentPercent / 100)
    loan_amount = max(0.0, inputs.homePrice - down_payment_amount)

    amortization = generate_amortization_schedule(loan_amount, inputs.interestRate, 30)
    timeline_months = inputs.timeHorizonYears * 12

    monthly_investment_return = inputs.investmentReturnRate / 100 / 12
    monthly_home_appreciation = inputs.homeAppreciationRate / 100 / 12
    monthly_rent_growth = inputs.rentGrowthRate / 100 / 12

    home_value = inputs.homePrice
    remaining_balance = loan_amount
    rent = inputs.monthlyRent

    closing_costs_buy = inputs.homePrice * 0.03
    closing_costs_sell_rate = 0.08

    buyer_cash_account = -down_payment_amount - closing_costs_buy
    buyer_equity = down_payment_amount
    renter_portfolio = down_payment_amount

    snapshots: List[MonthlySnapshot] = []

    for month in range(1, timeline_months + 1):
        amort_month = amortization[month - 1]

        home_value *= 1 + monthly_home_appreciation
        rent *= 1 + monthly_rent_growth

        interest_paid = remaining_balance * (inputs.interestRate / 100 / 12)
        principal_paid = amort_month.payment - interest_paid
        if principal_paid < 0:
            principal_paid = 0.0
        remaining_balance = max(0.0, remaining_balance - principal_paid)
        buyer_equity = home_value - remaining_balance

        property_tax_monthly = (inputs.propertyTaxRate / 100 * home_value) / 12
        insurance_monthly = inputs.homeInsuranceAnnual / 12
        maintenance_monthly = (inputs.maintenanceRate / 100 * home_value) / 12
        hoa_monthly = inputs.hoaMonthly

        has_pmi = remaining_balance / home_value > 0.80 if home_value > 0 else False
        pmi_monthly = _calculate_pmi(loan_amount) if has_pmi else 0.0

        owner_monthly_cost = (
            interest_paid
            + property_tax_monthly
            + insurance_monthly
            + maintenance_monthly
            + hoa_monthly
            + pmi_monthly
        )

        renter_monthly_cost = rent
        cash_flow_diff = renter_monthly_cost - owner_monthly_cost

        if cash_flow_diff > 0:
            renter_portfolio = (renter_portfolio + cash_flow_diff) * (1 + monthly_investment_return)
        else:
            buyer_cash_account = (buyer_cash_account + (-cash_flow_diff)) * (1 + monthly_investment_return)

        is_final_month = month == timeline_months
        selling_costs = home_value * closing_costs_sell_rate if is_final_month else 0.0

        buyer_net_worth = (buyer_equity - selling_costs) + buyer_cash_account
        renter_net_worth = renter_portfolio
        net_worth_delta = buyer_net_worth - renter_net_worth

        snapshots.append(
            MonthlySnapshot(
                month=month,
                mortgagePayment=amort_month.payment,
                principalPaid=principal_paid,
                interestPaid=interest_paid,
                remainingBalance=remaining_balance,
                homeValue=home_value,
                homeEquity=buyer_equity,
                monthlyBuyingCosts=owner_monthly_cost,
                monthlyRent=rent,
                monthlyRentingCosts=renter_monthly_cost,
                investedDownPayment=renter_portfolio,
                buyerNetWorth=buyer_net_worth,
                renterNetWorth=renter_net_worth,
                netWorthDelta=net_worth_delta,
            )
        )

    return snapshots


def _compute_summary(snapshots: Iterable[MonthlySnapshot]) -> CalculatorSummary:
    snapshots_list = list(snapshots)
    total_interest_paid = sum(s.interestPaid for s in snapshots_list)
    total_principal_paid = sum(s.principalPaid for s in snapshots_list)

    breakeven_month = None
    for snapshot in snapshots_list:
        if snapshot.netWorthDelta >= 0:
            breakeven_month = snapshot.month
            break

    final_snapshot = snapshots_list[-1]

    return CalculatorSummary(
        totalInterestPaid=total_interest_paid,
        totalPrincipalPaid=total_principal_paid,
        breakevenMonth=breakeven_month,
        finalBuyerNetWorth=final_snapshot.buyerNetWorth,
        finalRenterNetWorth=final_snapshot.renterNetWorth,
        finalNetWorthDelta=final_snapshot.netWorthDelta,
    )


def calculate_analysis(inputs: ScenarioInputs) -> CalculatorOutput:
    snapshots = calculate_net_worth_comparison(inputs)

    buying_costs = calculate_buying_costs(inputs)
    renting_costs_month_one = calculate_renting_costs(inputs, 1)

    summary = _compute_summary(snapshots)

    total_buying_costs = sum(s.monthlyBuyingCosts for s in snapshots)
    total_renting_costs = sum(s.monthlyRentingCosts for s in snapshots)
    final_snapshot = snapshots[-1]

    totals = TotalCostSummary(
        buyerFinalNetWorth=final_snapshot.buyerNetWorth,
        renterFinalNetWorth=final_snapshot.renterNetWorth,
        totalBuyingCosts=total_buying_costs,
        totalRentingCosts=total_renting_costs,
        finalHomeValue=final_snapshot.homeValue,
        finalInvestmentValue=final_snapshot.investedDownPayment,
    )

    return CalculatorOutput(
        inputs=inputs,
        monthlySnapshots=snapshots,
        summary=summary,
        monthlyCosts=buying_costs,
        rentingCosts=renting_costs_month_one,
        totals=totals,
    )
