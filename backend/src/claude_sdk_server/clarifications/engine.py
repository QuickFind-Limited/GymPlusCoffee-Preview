"""Clarification inference engine built on top of the curated dataset."""

from __future__ import annotations

import difflib
from collections import Counter
from datetime import datetime, timezone
from typing import Dict, List, Tuple

from .data_loader import load_clarification_dataset
from .models import (
    ClarificationDataset,
    ClarificationRecord,
    ClarificationRequest,
    ClarificationResponse,
    ClarificationSuggestion,
)
from .system_defaults import load_system_default_results


class ClarificationEngine:
    """Runs deterministic + lightweight semantic matching for clarifications."""

    def __init__(self) -> None:
        self.dataset: ClarificationDataset = load_clarification_dataset()
        self.system_defaults = load_system_default_results()
        self._token_cache: Dict[str, List[str]] = {}
        self._embedding_index: Dict[str, Counter[str]] = self._build_embedding_index()

    # ---------------------------------------------------------------------
    # Data refresh helpers
    # ---------------------------------------------------------------------
    def refresh(self) -> None:
        self.dataset = load_clarification_dataset()
        self.system_defaults = load_system_default_results()
        self._token_cache.clear()
        self._embedding_index = self._build_embedding_index()

    # ---------------------------------------------------------------------
    # Public API
    # ---------------------------------------------------------------------
    def evaluate(self, request: ClarificationRequest) -> ClarificationResponse:
        matches = self._score_candidates(request)

        suggestions: List[ClarificationSuggestion] = []
        seen_keys: set[tuple[str, tuple[str, ...]]] = set()
        auto_applied: Dict[str, str] = {}
        matched_ids: List[str] = []

        for _, record in matches:
            matched_ids.append(record.question_id)
            defaults = self._suggest_defaults(record)
            context_key = record.context_tags[0] if record.context_tags else record.query_id

            is_satisfied = self._context_already_satisfied(
                record,
                user_query=request.user_query,
                defaults=defaults,
                provided=request.already_provided,
            )

            if is_satisfied and context_key and defaults.get(context_key):
                auto_applied[context_key] = str(defaults[context_key])
                continue

            if record.selector.kind == "none":
                auto_applied.update(defaults)
                continue

            dedupe_context = tuple(sorted(record.context_tags)) if record.context_tags else ()
            dedupe_key = (record.selector.kind, dedupe_context)
            if dedupe_key in seen_keys:
                continue
            seen_keys.add(dedupe_key)

            reason = self._build_reason(record, defaults)
            suggestions.append(
                ClarificationSuggestion(
                    question_id=record.question_id,
                    clarification_question=record.clarification_question,
                    selector=record.selector,
                    options=record.options,
                    defaults_applied=defaults,
                    context_tags=record.context_tags,
                    reason=reason,
                )
            )

        evaluated_at = datetime.now(timezone.utc).isoformat()
        return ClarificationResponse(
            user_query=request.user_query,
            suggestions=suggestions,
            auto_applied=auto_applied,
            evaluated_at=evaluated_at,
            matched_question_ids=matched_ids,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _score_candidates(
        self, request: ClarificationRequest
    ) -> List[Tuple[int, ClarificationRecord]]:
        scored: List[Tuple[int, ClarificationRecord]] = []
        query_tokens = self._tokens_for(request.user_query)
        module_hint = (request.module_hint or "").lower()

        for record in self.dataset.clarifications.values():
            score = 0
            if module_hint and module_hint in record.module.lower():
                score += 4

            similarity = difflib.SequenceMatcher(
                None,
                record.user_question.lower(),
                request.user_query.lower(),
            ).ratio()
            if similarity > 0.45:
                score += int(similarity * 10)

            keyword_hits = sum(1 for hint in record.keyword_hints if hint in query_tokens)
            score += keyword_hits * 2

            context_hits = sum(1 for tag in record.context_tags if tag in query_tokens)
            score += context_hits

            option_hits = self._option_hits(record, request.user_query)
            score += option_hits

            embedding_similarity = self._embedding_similarity(query_tokens, record.question_id)
            score += int(embedding_similarity * 10)

            if score >= 5:
                scored.append((score, record))

        scored.sort(key=lambda item: item[0], reverse=True)
        return scored[:10]

    def _tokens_for(self, text: str) -> List[str]:
        if text in self._token_cache:
            return self._token_cache[text]
        tokens = [tok for tok in re_split(text.lower()) if len(tok) > 2]
        self._token_cache[text] = tokens
        return tokens

    def _option_hits(self, record: ClarificationRecord, user_query: str) -> int:
        lowered = user_query.lower()
        hits = 0
        for option in record.options:
            if option.display_value.lower() in lowered or option.value.lower() in lowered:
                hits += 3
        return hits

    def _build_embedding_index(self) -> Dict[str, Counter[str]]:
        index: Dict[str, Counter[str]] = {}
        for qid, record in self.dataset.clarifications.items():
            index[qid] = Counter(self._tokens_for(record.user_question))
        return index

    def _embedding_similarity(self, query_tokens: List[str], question_id: str) -> float:
        if not query_tokens:
            return 0.0
        query_counter = Counter(query_tokens)
        target = self._embedding_index.get(question_id)
        if not target:
            return 0.0
        intersection = sum((query_counter & target).values())
        union = sum((query_counter | target).values()) or 1
        return intersection / union

    def _build_reason(self, record: ClarificationRecord, defaults: Dict[str, str]) -> str:
        if defaults:
            default_bits = ", ".join(f"{k}={v}" for k, v in defaults.items())
            return f"Default suggestion available ({default_bits})."
        return "Matches module and keyword patterns from the curated dataset."

    def _context_already_satisfied(
        self,
        record: ClarificationRecord,
        user_query: str,
        defaults: Dict[str, str],
        provided: Dict[str, str],
    ) -> bool:
        lowered = user_query.lower()
        for tag in record.context_tags:
            if tag in provided:
                return True
            if tag and tag in defaults and defaults[tag].lower() in lowered:
                return True
        if self._option_hits(record, user_query) > 0:
            return True
        return False

    def _suggest_defaults(self, record: ClarificationRecord) -> Dict[str, str]:
        defaults: Dict[str, str] = {}
        for tag in record.context_tags:
            value = self._default_from_system_data(tag, record)
            if value:
                defaults[tag] = value
        return defaults

    def _default_from_system_data(self, tag: str, record: ClarificationRecord) -> str | None:
        if not self.system_defaults:
            return None
        if tag == "subsidiary":
            dataset = self.system_defaults.get("txn_subsidiary_volume")
            if dataset and dataset.rows:
                top = max(dataset.rows, key=lambda row: row.get("transaction_count", 0))
                name = top.get("subsidiary_name") or top.get("subsidiary")
                if name:
                    return str(name)
        if tag in {"department", "location"}:
            dataset = self.system_defaults.get("txn_department_location")
            if dataset and dataset.rows:
                top = max(dataset.rows, key=lambda row: row.get("transaction_count", 0))
                name = top.get(tag)
                if name:
                    return str(name)
        if tag == "account":
            dataset = self.system_defaults.get("master_chart_of_accounts")
            if dataset and dataset.rows:
                top = next((row for row in dataset.rows if row.get("accttype")), None)
                if top:
                    return str(top.get("accttype"))
        if tag == "currency":
            dataset = self.system_defaults.get("config_currencies")
            if dataset and dataset.rows:
                base = next((row for row in dataset.rows if row.get("isbasecurrency") == 'T'), None)
                if base:
                    return str(base.get("symbol") or base.get("name"))
        if tag == "status":
            dataset = self.system_defaults.get("txn_status_distribution")
            if dataset and dataset.rows:
                top = max(dataset.rows, key=lambda row: row.get("count", 0))
                status = top.get("status")
                if status:
                    return str(status)
        if tag == "type":
            dataset = self.system_defaults.get("txn_type_usage")
            if dataset and dataset.rows:
                top = max(dataset.rows, key=lambda row: row.get("usage_count", 0))
                if top.get("type"):
                    return str(top["type"])
        if tag == "role":
            dataset = self.system_defaults.get("config_roles_permissions")
            if dataset and dataset.rows:
                top = max(dataset.rows, key=lambda row: row.get("employee_count", 0))
                if top.get("name"):
                    return str(top["name"])
        if record.available_options:
            return record.available_options[0]
        if record.options:
            return record.options[0].display_value
        return None


def re_split(text: str) -> List[str]:
    import re

    return [token for token in re.split(r"[^a-z0-9]+", text) if token]

