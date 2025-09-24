"""Utilities for building the in-memory clarification dataset."""

from __future__ import annotations

import csv
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List

from .config import COMPILED_DATASET_PATH, CSV_SOURCE, JSON_RESULTS_SOURCE
from .models import (
    ClarificationDataset,
    ClarificationOption,
    ClarificationRecord,
    SelectorMetadata,
)

_MULTI_SELECT_STYLES = {
    "Checkbox Multi-Select": "checkbox",
    "Dropdown Multi-Select": "dropdown",
    "Scrollable Multi-Select": "list",
}

_CONTEXT_KEYWORDS = {
    "subsidi": "subsidiary",
    "account": "account",
    "department": "department",
    "location": "location",
    "vendor": "vendor",
    "customer": "customer",
    "period": "period",
    "date": "date",
    "currency": "currency",
    "status": "status",
    "role": "role",
    "permission": "permissions",
    "employee": "employee",
    "class": "class",
    "type": "type",
    "book": "accounting_book",
}

_WORD_SPLIT_RE = re.compile(r"[^a-z0-9]+")


def _normalize_selector(value: str) -> SelectorMetadata:
    value = value.strip()
    if value in _MULTI_SELECT_STYLES:
        return SelectorMetadata(kind="multi_select", style=_MULTI_SELECT_STYLES[value], raw=value)
    if value.lower() == "radio buttons":
        return SelectorMetadata(kind="single_select", style="radio", raw=value)
    if value.lower() == "not applicable":
        return SelectorMetadata(kind="none", style=None, raw=value)
    return SelectorMetadata(kind="single_select", style="dropdown", raw=value)


def _clean_json_field(value: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        return ""
    if cleaned.startswith("\"") and cleaned.endswith("\""):
        cleaned = cleaned[1:-1]
    return cleaned.replace('""', '"')


def _parse_options(raw_options: str, fallback: Iterable[str]) -> List[ClarificationOption]:
    cleaned = _clean_json_field(raw_options)
    if not cleaned:
        return [ClarificationOption(value=opt.strip(), display_value=opt.strip()) for opt in fallback if opt]
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        data = []
    options: List[ClarificationOption] = []
    for item in data:
        if not isinstance(item, dict):
            continue
        value = str(item.get("value", "")).strip()
        display = str(item.get("display_value", value)).strip()
        links = item.get("links") or []
        options.append(ClarificationOption(value=value, display_value=display, links=list(links)))
    if not options:
        options = [ClarificationOption(value=opt.strip(), display_value=opt.strip()) for opt in fallback if opt]
    return options


def _derive_keywords(*snippets: str) -> List[str]:
    tokens = []
    for snippet in snippets:
        for token in _WORD_SPLIT_RE.split(snippet.lower()):
            if len(token) < 3:
                continue
            tokens.append(token)
    return sorted(set(tokens))


def _derive_context_tags(*snippets: str) -> List[str]:
    lowered = " ".join(snippets).lower()
    tags = {
        tag for key, tag in _CONTEXT_KEYWORDS.items() if key in lowered
    }
    return sorted(tags)


def _load_json_results(path: Path) -> Dict[str, dict]:
    if not path.exists():
        return {}
    with path.open() as handle:
        payload = json.load(handle)
    results = {}
    for entry in payload.get("results", []):
        qid = entry.get("questionId")
        if qid:
            results[qid] = entry
    return results


def load_clarification_dataset(
    csv_path: Path | None = None,
    json_results_path: Path | None = None,
) -> ClarificationDataset:
    csv_source = csv_path or CSV_SOURCE
    json_source = json_results_path or JSON_RESULTS_SOURCE

    json_results = _load_json_results(json_source)

    clarifications: Dict[str, ClarificationRecord] = {}

    with csv_source.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            question_id = row["Question ID"].strip()
            selector = _normalize_selector(row["Selector Type"])  # type: ignore[index]

            available_options = [opt.strip() for opt in row.get("Available Options", "").split(",") if opt.strip()]
            options = _parse_options(row.get("JSON Items", ""), available_options)

            json_result = json_results.get(question_id)
            sample_payload = None
            if json_result:
                sample_payload = {
                    "rowCount": json_result.get("rowCount"),
                    "items": json_result.get("items", []),
                }
                if json_result.get("items") and selector.kind != "none":
                    options = [
                        ClarificationOption(
                            value=str(item.get("value", "")),
                            display_value=str(item.get("display_value", item.get("value", ""))),
                            links=list(item.get("links") or []),
                        )
                        for item in json_result.get("items", [])
                    ]

            keyword_hints = _derive_keywords(
                row.get("Clarification Question", ""),
                row.get("Live Lookup Field", ""),
                row.get("Query ID", ""),
                " ".join(available_options),
            )

            context_tags = _derive_context_tags(
                row.get("Clarification Question", ""),
                row.get("Live Lookup Field", ""),
                row.get("Query ID", ""),
            )

            json_row_count = row.get("JSON Row Count", "")
            try:
                json_row_count_value = int(json_row_count) if json_row_count else None
            except ValueError:
                json_row_count_value = None

            details_raw = row.get("JSON Details", "")
            details_cleaned = _clean_json_field(details_raw)
            json_details = None
            if details_cleaned:
                try:
                    json_details = json.loads(details_cleaned)
                except json.JSONDecodeError:
                    json_details = {"raw": details_raw}

            record = ClarificationRecord(
                question_id=question_id,
                module=row.get("NetSuite Module", "").strip(),
                user_question=row.get("User Question", "").strip(),
                clarification_question=row.get("Clarification Question", "").strip(),
                query_id=row.get("Query ID", "").strip() or None,
                live_lookup_field=row.get("Live Lookup Field", "").strip() or None,
                sql_query=row.get("SQL Query", "").strip() or None,
                selector=selector,
                options=options,
                available_options=available_options,
                json_status=row.get("JSON Status", "").strip() or None,
                json_row_count=json_row_count_value,
                json_error=row.get("JSON Error", "").strip() or None,
                json_details=json_details,
                keyword_hints=keyword_hints,
                context_tags=context_tags,
                sample_payload=sample_payload,
            )

            clarifications[question_id] = record

    dataset = ClarificationDataset(
        clarifications=clarifications,
        source_csv=str(csv_source),
        source_json=str(json_source),
        generated_at=datetime.now(timezone.utc).isoformat(),
    )
    return dataset


def write_compiled_dataset(
    output_path: Path | None = None,
    csv_path: Path | None = None,
    json_results_path: Path | None = None,
) -> Path:
    dataset = load_clarification_dataset(csv_path=csv_path, json_results_path=json_results_path)
    target = output_path or COMPILED_DATASET_PATH
    with target.open("w", encoding="utf-8") as handle:
        json.dump(dataset.model_dump(mode="json"), handle, indent=2)
    return target
