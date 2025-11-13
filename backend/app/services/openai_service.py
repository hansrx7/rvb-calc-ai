"""Wrapper around the OpenAI client for chat completions."""

from __future__ import annotations

from typing import List, Optional

from openai import OpenAI

from ..config import get_settings


class OpenAIService:
    def __init__(self) -> None:
        settings = get_settings()
        api_key = settings.openai_api_key

        self._client: Optional[OpenAI] = None
        self._is_mock_mode = False

        if api_key:
            self._client = OpenAI(api_key=api_key)
        else:
            # Fall back to a lightweight mock so the app still runs without a key
            self._is_mock_mode = True

    def _mock_response(self, messages: List[dict]) -> str:
        last_user_message = next(
            (m["content"] for m in reversed(messages) if m.get("role") == "user"),
            "",
        )

        preface = (
            "(Mock AI) I'm running in local demo mode because an OpenAI API key isn't set."
        )

        if last_user_message:
            return (
                f'{preface} I heard you say: "{last_user_message}". '
                "Charts and calculations will still update with your numbers."
            )
        return (
            f"{preface} Ask me about your home price, rent, down payment, and timeline and I'll keep the analysis flowing."
        )

    def chat_completion(self, model: str, messages: List[dict], temperature: float = 0.7, max_tokens: int = 200) -> str:
        if self._is_mock_mode or self._client is None:
            return self._mock_response(messages)

        try:
            completion = self._client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return completion.choices[0].message.content or "I'm having trouble responding right now. Can you try again?"
        except Exception as exc:  # broad fallback to keep the chat responsive
            # Fall back to mock response so the UI keeps working
            print(f"[OpenAIService] Falling back to mock response due to error: {exc}")
            return self._mock_response(messages)
