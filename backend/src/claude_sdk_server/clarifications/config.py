"""Configuration for clarification data inputs and outputs."""

from __future__ import annotations

import os
from pathlib import Path

# Resolve project roots dynamically so both local runs and containers work
_CURRENT_FILE = Path(__file__).resolve()

_BACKEND_ROOT: Path | None = None
for parent in _CURRENT_FILE.parents:
    if parent.name == "backend":
        _BACKEND_ROOT = parent
        break

if _BACKEND_ROOT is None:
    # Container fallback (e.g. /app/src/claude_sdk_server/...)
    _BACKEND_ROOT = _CURRENT_FILE.parents[2]

_REPO_ROOT = _BACKEND_ROOT.parent if _BACKEND_ROOT.name == "backend" else _BACKEND_ROOT

_DEFAULT_DATA_DIR = _BACKEND_ROOT / "data"

def _resolve_existing_path(*candidates: Path | str) -> Path | None:
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return path
    return None

_DEFAULT_CSV = _resolve_existing_path(
    _REPO_ROOT / "netsuite_query_comparison-2.csv",
    _BACKEND_ROOT / "netsuite_query_comparison-2.csv",
    Path("/app/netsuite_query_comparison-2.csv"),
)

_DEFAULT_JSON_RESULTS = _resolve_existing_path(
    _REPO_ROOT / "netsuite_query_results.json",
    _BACKEND_ROOT / "netsuite_query_results.json",
    Path("/app/netsuite_query_results.json"),
)

_DATA_DIR_ENV = os.getenv("CLARIFICATION_DATA_DIR")
DATA_DIR = Path(_DATA_DIR_ENV) if _DATA_DIR_ENV else _DEFAULT_DATA_DIR

_CSV_ENV = os.getenv("CLARIFICATION_CSV_PATH")
if _CSV_ENV:
    CSV_SOURCE = Path(_CSV_ENV)
elif _DEFAULT_CSV is not None:
    CSV_SOURCE = _DEFAULT_CSV
else:
    CSV_SOURCE = DATA_DIR / "netsuite_query_comparison-2.csv"

_JSON_RESULTS_ENV = os.getenv("CLARIFICATION_RESULTS_PATH")
if _JSON_RESULTS_ENV:
    JSON_RESULTS_SOURCE = Path(_JSON_RESULTS_ENV)
elif _DEFAULT_JSON_RESULTS is not None:
    JSON_RESULTS_SOURCE = _DEFAULT_JSON_RESULTS
else:
    JSON_RESULTS_SOURCE = DATA_DIR / "netsuite_query_results.json"
SYSTEM_DEFAULTS_RESULTS = Path(
    os.getenv(
        "SYSTEM_DEFAULTS_RESULTS_PATH",
        str(DATA_DIR / "system_defaults_results.json"),
    )
)
COMPILED_DATASET_PATH = Path(
    os.getenv(
        "CLARIFICATION_COMPILED_DATA_PATH",
        str(DATA_DIR / "clarifications_compiled.json"),
    )
)

DATA_DIR.mkdir(parents=True, exist_ok=True)
