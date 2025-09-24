"""Utilities for calling Anthropic's embedding API."""

from __future__ import annotations

import json
import os
from functools import lru_cache
from typing import Dict, List

import httpx

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/embeddings"
DEFAULT_EMBEDDING_MODEL = os.environ.get(
    "ANTHROPIC_EMBEDDING_MODEL", "claude-3-haiku-20240307"
)
EMBEDDING_TIMEOUT = float(os.environ.get("ANTHROPIC_EMBEDDING_TIMEOUT", "15"))


class EmbeddingError(RuntimeError):
    """Raised when the embedding API returns an unexpected payload."""


def _anthropic_headers() -> Dict[str, str]:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is required for clarification semantic logging"
        )
    return {
        "x-api-key": api_key,
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
    }


@lru_cache(maxsize=2048)
def embed_text(text: str) -> List[float]:
    """Return the embedding vector for ``text`` using Anthropic's API."""

    payload = {
        "model": DEFAULT_EMBEDDING_MODEL,
        "input": text,
    }

    with httpx.Client(timeout=EMBEDDING_TIMEOUT) as client:
        response = client.post(
            ANTHROPIC_API_URL,
            headers=_anthropic_headers(),
            content=json.dumps(payload),
        )
        response.raise_for_status()

    data = response.json()

    embedding = data.get("embedding")
    if embedding is None:
        data_list = data.get("data")
        if isinstance(data_list, list) and data_list:
            embedding = data_list[0].get("embedding")

    if not isinstance(embedding, list):
        raise EmbeddingError("Unexpected embedding response format from Anthropic")

    return [float(x) for x in embedding]
