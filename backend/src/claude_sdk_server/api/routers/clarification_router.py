"""Clarification API routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from src.claude_sdk_server.clarifications import get_clarification_engine
from src.claude_sdk_server.clarifications.models import (
    ClarificationRequest,
    ClarificationResponse,
)
from src.claude_sdk_server.clarifications.service import refresh_engine
from src.claude_sdk_server.dependencies import require_auth
from src.claude_sdk_server.utils.logging_config import get_logger
from src.claude_sdk_server.clarifications.system_defaults import (
    SYSTEM_WIDE_QUERY_DEFINITIONS,
    load_system_default_results,
)

logger = get_logger(__name__)

router = APIRouter(
    prefix="/api/v1/clarifications",
    tags=["clarifications"],
    dependencies=[Depends(require_auth)],
)


@router.post("/suggest", response_model=ClarificationResponse)
async def suggest_clarifications(
    payload: ClarificationRequest,
):
    """Return clarification suggestions for the given user query."""
    engine = get_clarification_engine()
    logger.info("Evaluating clarification suggestions")
    return engine.evaluate(payload)


@router.post("/refresh")
async def refresh_clarification_data():
    """Reload clarification datasets from source files."""
    refresh_engine()
    return {"status": "ok"}


@router.get("/system-defaults")
async def list_system_defaults():
    """Return system-wide query definitions and cached results."""
    definitions = [definition.model_dump() for definition in SYSTEM_WIDE_QUERY_DEFINITIONS]
    results = {
        key: value.model_dump() for key, value in load_system_default_results().items()
    }
    return {"definitions": definitions, "results": results}
