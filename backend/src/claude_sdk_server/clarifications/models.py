"""Pydantic models for the clarification pipeline."""

from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field

SelectorKind = Literal["single_select", "multi_select", "none"]


class SelectorMetadata(BaseModel):
    kind: SelectorKind
    style: Optional[str] = None
    raw: Optional[str] = None


class ClarificationOption(BaseModel):
    value: str
    display_value: str
    links: List[str] = Field(default_factory=list)


class ClarificationRecord(BaseModel):
    question_id: str
    module: str
    user_question: str
    clarification_question: str
    query_id: Optional[str] = None
    live_lookup_field: Optional[str] = None
    sql_query: Optional[str] = None
    selector: SelectorMetadata
    options: List[ClarificationOption] = Field(default_factory=list)
    available_options: List[str] = Field(default_factory=list)
    json_status: Optional[str] = None
    json_row_count: Optional[int] = None
    json_error: Optional[str] = None
    json_details: Optional[Dict[str, Any]] = None
    keyword_hints: List[str] = Field(default_factory=list)
    context_tags: List[str] = Field(default_factory=list)
    defaults: Dict[str, Any] = Field(default_factory=dict)
    sample_payload: Optional[Dict[str, Any]] = None


class ClarificationDataset(BaseModel):
    clarifications: Dict[str, ClarificationRecord]
    source_csv: str
    source_json: str
    generated_at: str


class SystemWideQueryDefinition(BaseModel):
    query_id: str
    section: str
    title: str
    description: str
    sql: str


class SystemWideQueryResult(BaseModel):
    query_id: str
    collected_at: str
    row_count: int
    rows: List[Dict[str, Any]]


class ClarificationRequest(BaseModel):
    user_query: str
    module_hint: Optional[str] = None
    already_provided: Dict[str, Any] = Field(default_factory=dict)


class ClarificationSuggestion(BaseModel):
    question_id: str
    clarification_question: str
    selector: SelectorMetadata
    options: List[ClarificationOption]
    defaults_applied: Dict[str, Any] = Field(default_factory=dict)
    context_tags: List[str] = Field(default_factory=list)
    reason: str


class ClarificationResponse(BaseModel):
    user_query: str
    suggestions: List[ClarificationSuggestion]
    auto_applied: Dict[str, Any] = Field(default_factory=dict)
    evaluated_at: str
    matched_question_ids: List[str] = Field(default_factory=list)
