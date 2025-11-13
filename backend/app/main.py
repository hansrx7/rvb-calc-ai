"""FastAPI application entrypoint."""

from __future__ import annotations

from typing import List, Literal, Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .config import get_settings
from .finance.calculator import calculate_analysis
from .models import AnalysisRequest, AnalysisResponse, TimelinePoint
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
    analysis = calculate_analysis(request.inputs)

    timeline: Optional[List[TimelinePoint]] = None
    if request.includeTimeline:
        timeline = [
            TimelinePoint(
                month=snapshot.month,
                buyerNetWorth=snapshot.buyerNetWorth,
                renterNetWorth=snapshot.renterNetWorth,
                netWorthDelta=snapshot.netWorthDelta,
            )
            for snapshot in analysis.monthlySnapshots
        ]

    return AnalysisResponse(analysis=analysis, timeline=timeline)


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
