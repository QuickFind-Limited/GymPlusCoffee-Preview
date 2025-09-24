"""Clarification API routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from src.claude_sdk_server.clarifications.models import (
    ClarificationAnswerRequest,
    ClarificationRequest,
    ClarificationSessionState,
)
from src.claude_sdk_server.clarifications.service import (
    evaluate_request,
    get_session_state,
    refresh_engine,
    submit_answers,
)
from src.claude_sdk_server.clarifications.system_defaults import (
    SYSTEM_WIDE_QUERY_DEFINITIONS,
    load_system_default_results,
)
from src.claude_sdk_server.dependencies import require_auth
from src.claude_sdk_server.utils.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(
    prefix="/api/v1/clarifications",
    tags=["clarifications"],
    dependencies=[Depends(require_auth)],
)


@router.post("/suggest", response_model=ClarificationSessionState)
async def suggest_clarifications(payload: ClarificationRequest) -> ClarificationSessionState:
    """Return clarification suggestions and session state for the given query."""
    state = evaluate_request(payload)
    logger.structured(
        "clarification_suggest_response",
        session_id=state.session_id,
        pending=len(state.pending),
    )
    return state


@router.post("/respond", response_model=ClarificationSessionState)
async def respond_to_clarifications(
    payload: ClarificationAnswerRequest,
) -> ClarificationSessionState:
    """Persist user answers/decisions and return the updated session state."""
    try:
        state = submit_answers(payload)
        logger.structured(
            "clarification_respond",
            session_id=state.session_id,
            pending=len(state.pending),
            status=state.status,
        )
        return state
    except KeyError as exc:  # session not found
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/session/{session_id}", response_model=ClarificationSessionState)
async def get_clarification_session(session_id: str) -> ClarificationSessionState:
    """Return the current state of a clarification session."""
    try:
        return get_session_state(session_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


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


@router.get("/health")
async def clarification_health():
    """Basic health report for clarification data."""
    from src.claude_sdk_server.clarifications import get_clarification_engine

    engine = get_clarification_engine()
    dataset_size = len(engine.dataset.clarifications)
    defaults_size = len(engine.system_defaults or {})
    status = "ok" if dataset_size and defaults_size else "degraded"
    return {
        "status": status,
        "clarifications": dataset_size,
        "system_defaults": defaults_size,
    }
