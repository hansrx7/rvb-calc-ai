"""FastAPI application entrypoint."""

from __future__ import annotations

from typing import List, Literal, Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .config import get_settings
from .finance.calculator import (
    calculate_analysis, calculate_cash_flow, calculate_cumulative_costs, calculate_liquidity_timeline,
    calculate_tax_savings, calculate_sensitivity, calculate_scenarios, calculate_heatmap, calculate_monte_carlo)
from .models import (
    AnalysisRequest, AnalysisResponse, TimelinePoint, ScenarioRequest, SensitivityRequest, HeatmapRequest, MonteCarloRequest, HomePricePathSummary
)
from .services.openai_service import OpenAIService

settings = get_settings()

app = FastAPI(title="Rent vs Buy AI Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str = "gpt-4o-mini"
    temperature: float = 0.7
    max_tokens: int = 200


def get_openai_service() -> OpenAIService:
    try:
        return OpenAIService()
    except ValueError as exc:  # pragma: no cover - configuration issue
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@app.post(f"{settings.api_prefix}/finance/analyze", response_model=AnalysisResponse)
def analyze_finance(request: AnalysisRequest) -> AnalysisResponse:
    """Unified analysis endpoint - returns single AnalysisResult with all data."""
    from .finance.calculator import calculate_unified_analysis
    
    # Apply ML predictions if ZIP code is provided
    inputs = request.inputs
    ml_rates_used = None  # Initialize
    if request.zipCode:
        try:
            from .ml.growth_model import load_models, predict_zip_growth
            
            # Store fallback rates (original percentage values)
            fallback_home = inputs.homeAppreciationRate
            fallback_rent = inputs.rentGrowthRate
            
            # Ensure models are loaded
            load_models()
            
            # Get ML predictions (returns as decimals, e.g., 0.03 = 3%)
            ml_home, ml_rent = predict_zip_growth(
                request.zipCode,
                fallback_home / 100.0,  # Convert to decimal for fallback
                fallback_rent / 100.0   # Convert to decimal for fallback
            )
            
            # Convert ML predictions from decimal to percentage
            # ML returns 0.03 (3%), calculator expects 3.0 (percentage)
            ml_home_pct = ml_home * 100.0
            ml_rent_pct = ml_rent * 100.0
            
            # Debug log
            print(
                f"[ML DEBUG] ZIP={request.zipCode} "
                f"fallback_home={fallback_home:.3f}%, fallback_rent={fallback_rent:.3f}% "
                f"-> ml_home={ml_home_pct:.3f}%, ml_rent={ml_rent_pct:.3f}%"
            )
            
            # Override rates with ML predictions
            homeAppreciationRate = ml_home_pct
            rentGrowthRate = ml_rent_pct
            
            # Create new inputs with ML-predicted rates
            inputs_dict = inputs.model_dump()
            inputs_dict['homeAppreciationRate'] = homeAppreciationRate
            inputs_dict['rentGrowthRate'] = rentGrowthRate
            inputs = type(inputs)(**inputs_dict)
            
            # Store ML-predicted rates for response
            ml_rates_used = {
                'home_appreciation_rate': homeAppreciationRate,
                'rent_growth_rate': rentGrowthRate
            }
        except Exception as e:
            # Debug log for errors
            print(f"[ML DEBUG] Error using ML growth model for ZIP={getattr(request, 'zipCode', None)}: {e}")
            # Log warning but continue with original rates
            import logging
            logging.warning(f"ML prediction failed for ZIP {request.zipCode}: {e}. Using original rates.")
            ml_rates_used = None
    
    analysis = calculate_unified_analysis(inputs)
    
    # Add the rates that were actually used to the response
    if ml_rates_used:
        analysis.home_appreciation_rate = ml_rates_used['home_appreciation_rate']
        analysis.rent_growth_rate = ml_rates_used['rent_growth_rate']
    else:
        # Use the rates from inputs (fallback rates)
        analysis.home_appreciation_rate = inputs.homeAppreciationRate
        analysis.rent_growth_rate = inputs.rentGrowthRate
    
    # Monte Carlo home price path simulation
    print(f"[MC DEBUG] ========== Starting Monte Carlo Simulation ==========")
    try:
        from .finance.monte_carlo import simulate_home_price_paths, summarize_paths
        from .ml.growth_model import get_zip_home_volatility
        
        # Get the starting home value (same as used in projections)
        initial_price = inputs.homePrice
        print(f"[MC DEBUG] Initial price: ${initial_price:,.2f}")
        
        # Get the projection horizon in years (same as used in other charts)
        years = inputs.timeHorizonYears
        print(f"[MC DEBUG] Time horizon: {years} years")
        
        # Get the home appreciation rate in decimal form (already includes ML override if ZIP provided)
        home_appreciation_rate_pct = analysis.home_appreciation_rate
        mu = home_appreciation_rate_pct / 100.0
        print(f"[MC DEBUG] Home appreciation rate: {home_appreciation_rate_pct:.4f}% (mu={mu:.6f} decimal)")
        
        # Define fallback volatility (15% annual)
        fallback_sigma = 0.15
        
        # Get ZIP-specific volatility if ZIP code is provided
        if request.zipCode:
            print(f"[MC DEBUG] ZIP code provided: {request.zipCode}, looking up volatility...")
            sigma = get_zip_home_volatility(request.zipCode, fallback_sigma)
            print(f"[MC DEBUG] ZIP={request.zipCode} -> sigma={sigma:.4f} ({sigma*100:.2f}% annual volatility, fallback={fallback_sigma:.4f})")
        else:
            sigma = fallback_sigma
            print(f"[MC DEBUG] No ZIP code -> using fallback sigma={sigma:.4f} ({sigma*100:.2f}% annual volatility)")
        
        # Run Monte Carlo simulation
        print(f"[MC DEBUG] Running Monte Carlo simulation with {500} paths...")
        paths = simulate_home_price_paths(
            initial_price=initial_price,
            annual_mu=mu,
            annual_sigma=sigma,
            years=years,
            n_paths=500,
        )
        print(f"[MC DEBUG] Generated {len(paths)} price paths, each with {len(paths[0]) if paths else 0} time steps")
        
        # Summarize paths
        print(f"[MC DEBUG] Summarizing paths to compute percentiles...")
        summary = summarize_paths(paths)
        print(f"[MC DEBUG] Summary computed: {len(summary['years'])} years, p10/p50/p90 arrays all length {len(summary['p10'])}")
        
        # Show sample values
        if len(summary['years']) > 0:
            print(f"[MC DEBUG] Sample values (Year {summary['years'][0]}): p10=${summary['p10'][0]:,.2f}, p50=${summary['p50'][0]:,.2f}, p90=${summary['p90'][0]:,.2f}")
            if len(summary['years']) > 1:
                final_idx = len(summary['years']) - 1
                print(f"[MC DEBUG] Final values (Year {summary['years'][final_idx]}): p10=${summary['p10'][final_idx]:,.2f}, p50=${summary['p50'][final_idx]:,.2f}, p90=${summary['p90'][final_idx]:,.2f}")
        
        # Convert to Pydantic model
        analysis.monte_carlo_home_prices = HomePricePathSummary(
            years=summary["years"],
            p10=summary["p10"],
            p50=summary["p50"],
            p90=summary["p90"]
        )
        
        print(f"[MC DEBUG] ✅ Monte Carlo simulation complete and attached to analysis result")
        print(f"[MC DEBUG] ========== Monte Carlo Simulation Complete ==========")
        
    except Exception as e:
        # Log warning but don't break the analysis
        import logging
        import traceback
        logging.warning(f"Monte Carlo simulation failed: {e}. Continuing without Monte Carlo data.")
        print(f"[MC DEBUG] ❌ Error in Monte Carlo simulation: {e}")
        print(f"[MC DEBUG] Traceback: {traceback.format_exc()}")
        print(f"[MC DEBUG] ========== Monte Carlo Simulation Failed ==========")
        # Leave monte_carlo_home_prices as None (already default)
    
    return AnalysisResponse(analysis=analysis)


@app.post(f"{settings.api_prefix}/finance/heatmap")
def break_even_heatmap(req: HeatmapRequest) -> list:
    return calculate_heatmap(req.timelines, req.downPayments, req.base)

@app.post(f"{settings.api_prefix}/finance/scenarios")
def scenario_overlay_chart(req: ScenarioRequest) -> list:
    return calculate_scenarios(req.scenarios)

@app.post(f"{settings.api_prefix}/finance/sensitivity")
def sensitivity_chart(req: SensitivityRequest) -> list:
    return calculate_sensitivity(
        req.base,
        interest_rate_delta=req.interestRateDelta,
        home_price_delta=req.homePriceDelta,
        rent_delta=req.rentDelta
    )

@app.post(f"{settings.api_prefix}/finance/tax-savings")
def tax_savings(inputs: dict) -> list:
    # expects inputs matching ScenarioInputs + optional income/tax_bracket
    from .models import ScenarioInputs
    scenario = ScenarioInputs(**inputs)
    analysis = calculate_analysis(scenario)
    # Allow POST with optional income, tax_bracket
    income = inputs.get('income', 100000)
    bracket = inputs.get('taxBracket', 0.24)
    return calculate_tax_savings(scenario, analysis.monthlySnapshots, income, bracket)

@app.post(f"{settings.api_prefix}/finance/monte-carlo")
def monte_carlo_endpoint(req: MonteCarloRequest) -> dict:
    return calculate_monte_carlo(req.inputs, req.runs)

@app.post(f"{settings.api_prefix}/ai/chat")
def chat_completion(
    request: ChatRequest, openai_service: OpenAIService = Depends(get_openai_service)
) -> dict[str, str]:
    response_text = openai_service.chat_completion(
        model=request.model,
        messages=[message.model_dump() for message in request.messages],
        temperature=request.temperature,
        max_tokens=request.max_tokens,
    )
    return {"response": response_text}
