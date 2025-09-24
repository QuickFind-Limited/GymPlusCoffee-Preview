"""FastAPI dependency helpers for clarification engine."""

from __future__ import annotations

from typing import Optional

from .engine import ClarificationEngine

_engine: Optional[ClarificationEngine] = None


def get_clarification_engine() -> ClarificationEngine:
    global _engine
    if _engine is None:
        _engine = ClarificationEngine()
    return _engine


def refresh_engine() -> None:
    engine = get_clarification_engine()
    engine.refresh()
