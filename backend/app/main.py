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
    AnalysisRequest, AnalysisResponse, TimelinePoint, ScenarioRequest, SensitivityRequest, HeatmapRequest, MonteCarloRequest
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
    
    analysis = calculate_unified_analysis(request.inputs)
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
