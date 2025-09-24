
"""In-memory store for clarification sessions."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from .models import (
    ClarificationAnswer,
    ClarificationResponse,
    ClarificationSessionState,
    ClarificationSuggestion,
)


class ClarificationSession:
    """Tracks the lifecycle of a clarification exchange for a single query."""

    def __init__(self, response: ClarificationResponse, context_lookup: Dict[str, List[str]]) -> None:
        self.session_id = response.session_id or uuid.uuid4().hex
        self.original_query = response.user_query
        self.auto_applied = dict(response.auto_applied)
        self.pending: List[ClarificationSuggestion] = list(response.suggestions)
        self.matched_question_ids = list(response.matched_question_ids)
        self.answers: Dict[str, List[str]] = {}
        self.resolved_context: Dict[str, str] = {}
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = self.created_at
        self.context_lookup: Dict[str, List[str]] = dict(context_lookup)

    def record_answers(
        self, answers: List[ClarificationAnswer], context_lookup: Dict[str, List[str]]
    ) -> None:
        for answer in answers:
            self.answers[answer.question_id] = answer.selected_values
            if context_lookup.get(answer.question_id):
                tags = context_lookup[answer.question_id]
                self.context_lookup[answer.question_id] = tags
                for tag in tags:
                    self.auto_applied.pop(tag, None)
        self.updated_at = datetime.now(timezone.utc)

    def apply_pending(
        self,
        suggestions: List[ClarificationSuggestion],
        auto: Dict[str, str],
        context_lookup: Dict[str, List[str]],
    ) -> None:
        self.pending = suggestions
        self.matched_question_ids = list({*self.matched_question_ids, *[s.question_id for s in suggestions]})
        # merge auto defaults, but user answers override later
        self.auto_applied = auto
        self.context_lookup.update(context_lookup)
        self.updated_at = datetime.now(timezone.utc)

    def build_context(self) -> Dict[str, str]:
        context: Dict[str, str] = dict(self.auto_applied)
        for question_id, values in self.answers.items():
            tags = self.context_lookup.get(question_id) or [question_id]
            if not values:
                continue
            context_value = ", ".join(values)
            for tag in tags:
                context[tag] = context_value
        self.resolved_context = context
        self.updated_at = datetime.now(timezone.utc)
        return context

    @property
    def status(self) -> str:
        return "ready" if not self.pending else "pending"

    def to_state(self) -> ClarificationSessionState:
        context = self.build_context()
        # map answers for response payload
        answer_map = {
            qid: values for qid, values in self.answers.items()
        }
        return ClarificationSessionState(
            session_id=self.session_id,
            original_query=self.original_query,
            auto_applied=self.auto_applied,
            answers=answer_map,
            pending=self.pending,
            matched_question_ids=self.matched_question_ids,
            resolved_context=context,
            status=self.status,
            updated_at=self.updated_at.isoformat(),
        )


class ClarificationSessionStore:
    """Simple in-memory session cache. Suitable for single-process deployments."""

    def __init__(self) -> None:
        self._sessions: Dict[str, ClarificationSession] = {}

    def create(
        self,
        response: ClarificationResponse,
        context_lookup: Dict[str, List[str]],
    ) -> ClarificationSession:
        session = ClarificationSession(response, context_lookup)
        self._sessions[session.session_id] = session
        return session

    def get(self, session_id: str) -> Optional[ClarificationSession]:
        return self._sessions.get(session_id)

    def ensure(self, session_id: str) -> ClarificationSession:
        session = self.get(session_id)
        if not session:
            raise KeyError(f"Unknown clarification session: {session_id}")
        return session

    def clear(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)


SESSION_STORE = ClarificationSessionStore()
