"""Clarification engine orchestration and dependency helpers."""

from __future__ import annotations

from typing import Dict, List, Optional
from uuid import uuid4

from src.claude_sdk_server.utils.logging_config import get_logger

from .engine import ClarificationEngine
from .models import (
    ClarificationAnswer,
    ClarificationAnswerRequest,
    ClarificationRequest,
    ClarificationResponse,
    ClarificationSessionState,
)
from .session_store import ClarificationSession, SESSION_STORE

logger = get_logger(__name__)

_engine: Optional[ClarificationEngine] = None


def get_clarification_engine() -> ClarificationEngine:
    global _engine
    if _engine is None:
        _engine = ClarificationEngine()
    return _engine


def refresh_engine() -> None:
    engine = get_clarification_engine()
    engine.refresh()
    logger.info("Clarification engine cache refreshed")


def _context_tags_for(engine: ClarificationEngine, question_id: str) -> List[str]:
    record = engine.dataset.clarifications.get(question_id)
    if record and record.context_tags:
        return record.context_tags
    return []


def _build_context_lookup(engine: ClarificationEngine, suggestions: List) -> Dict[str, List[str]]:
    lookup: Dict[str, List[str]] = {}
    for suggestion in suggestions:
        tags = getattr(suggestion, "context_tags", None) or _context_tags_for(
            engine, suggestion.question_id
        )
        lookup[suggestion.question_id] = tags or [suggestion.question_id]
    return lookup


def _normalize_answers(
    engine: ClarificationEngine, answers: List[ClarificationAnswer]
) -> List[ClarificationAnswer]:
    normalized: List[ClarificationAnswer] = []
    for answer in answers:
        record = engine.dataset.clarifications.get(answer.question_id)
        display_values: List[str] = []
        if record:
            for raw in answer.selected_values:
                match = next(
                    (
                        option.display_value
                        for option in record.options
                        if option.value == raw or option.display_value == raw
                    ),
                    raw,
                )
                display_values.append(match)
        else:
            display_values = answer.selected_values
        normalized.append(
            ClarificationAnswer(
                question_id=answer.question_id,
                selected_values=display_values,
            )
        )
    return normalized


def evaluate_request(request: ClarificationRequest) -> ClarificationSessionState:
    """Evaluate a clarification request and persist session state."""

    engine = get_clarification_engine()
    response: ClarificationResponse = engine.evaluate(request)

    session_id = request.session_id or uuid4().hex
    response.session_id = session_id

    context_lookup = _build_context_lookup(engine, response.suggestions)

    session: Optional[ClarificationSession] = SESSION_STORE.get(session_id)
    if session:
        session.apply_pending(response.suggestions, response.auto_applied, context_lookup)
        logger.structured(
            "clarification_session_updated",
            session_id=session.session_id,
            pending=len(session.pending),
        )
    else:
        session = SESSION_STORE.create(response, context_lookup)
        logger.structured(
            "clarification_session_created",
            session_id=session.session_id,
            pending=len(session.pending),
        )

    session.matched_question_ids = list({*session.matched_question_ids, *response.matched_question_ids})

    return session.to_state()


def submit_answers(payload: ClarificationAnswerRequest) -> ClarificationSessionState:
    """Persist user answers and return the updated session state."""

    engine = get_clarification_engine()
    session = SESSION_STORE.ensure(payload.session_id)

    normalized_answers = _normalize_answers(engine, payload.answers)
    if normalized_answers:
        answer_lookup = {
            answer.question_id: _context_tags_for(engine, answer.question_id)
            for answer in normalized_answers
        }
        session.record_answers(normalized_answers, answer_lookup)

    if payload.accept_defaults and not normalized_answers:
        session.pending = []
        logger.structured(
            "clarification_defaults_accepted", session_id=session.session_id
        )
        return session.to_state()

    provided_context = session.build_context()

    response = engine.evaluate(
        ClarificationRequest(
            user_query=session.original_query,
            already_provided=provided_context,
            session_id=session.session_id,
        )
    )
    response.session_id = session.session_id

    context_lookup = _build_context_lookup(engine, response.suggestions)
    session.apply_pending(response.suggestions, response.auto_applied, context_lookup)
    session.matched_question_ids = list({*session.matched_question_ids, *response.matched_question_ids})

    logger.structured(
        "clarification_session_progress",
        session_id=session.session_id,
        pending=len(session.pending),
        answers=len(session.answers),
    )

    return session.to_state()


def get_session_state(session_id: str) -> ClarificationSessionState:
    session = SESSION_STORE.ensure(session_id)
    return session.to_state()
