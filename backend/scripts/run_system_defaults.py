#!/usr/bin/env python3
"""
Execute all SuiteQL queries from system_defaults.py and write the results
to backend/data/system_defaults_results.json without skipping failures.
"""

import base64
import hashlib
import hmac
import json
import os
import secrets
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable
from urllib.parse import quote

import requests

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.claude_sdk_server.clarifications.system_defaults import (
    SYSTEM_WIDE_QUERY_DEFINITIONS,
)

# NetSuite credentials (must be set in environment)
ACCOUNT_ID = os.getenv("NETSUITE_ACCOUNT_ID")
CONSUMER_KEY = os.getenv("NETSUITE_CONSUMER_KEY")
CONSUMER_SECRET = os.getenv("NETSUITE_CONSUMER_SECRET")
TOKEN_ID = os.getenv("NETSUITE_TOKEN_ID")
TOKEN_SECRET = os.getenv("NETSUITE_TOKEN_SECRET")

if not all([ACCOUNT_ID, CONSUMER_KEY, CONSUMER_SECRET, TOKEN_ID, TOKEN_SECRET]):
    raise SystemExit(
        "Missing NetSuite credentials. Set NETSUITE_ACCOUNT_ID, NETSUITE_CONSUMER_KEY, "
        "NETSUITE_CONSUMER_SECRET, NETSUITE_TOKEN_ID, and NETSUITE_TOKEN_SECRET."
    )

BASE_URL = f"https://{ACCOUNT_ID.lower()}.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql"
PAGE_SIZE = 1000  # bump above the SuiteQL default
OUTPUT_PATH = Path("data/system_defaults_results.json")


def get_oauth_header(method, url):
    """Generate OAuth 1.0a header for NetSuite"""
    timestamp = str(int(time.time()))
    nonce = secrets.token_hex(16)

    oauth_params = {
        'oauth_consumer_key': CONSUMER_KEY,
        'oauth_nonce': nonce,
        'oauth_signature_method': 'HMAC-SHA256',
        'oauth_timestamp': timestamp,
        'oauth_token': TOKEN_ID,
        'oauth_version': '1.0'
    }

    # Create parameter string
    param_string = '&'.join([f'{k}={quote(v, safe="")}' for k, v in sorted(oauth_params.items())])

    # Create base string
    base_string = '&'.join([method, quote(url, safe=''), quote(param_string, safe='')])

    # Create signing key
    signing_key = f'{CONSUMER_SECRET}&{TOKEN_SECRET}'

    # Generate signature
    signature = base64.b64encode(
        hmac.new(signing_key.encode(), base_string.encode(), hashlib.sha256).digest()
    ).decode()

    oauth_params['oauth_signature'] = signature

    # Build Authorization header
    header = f'OAuth realm="{ACCOUNT_ID}"'
    for k in sorted(oauth_params.keys()):
        header += f', {k}="{quote(oauth_params[k], safe="")}"'

    return header


def execute_suiteql(sql: str) -> list:
    """Run SuiteQL without pagination - NetSuite handles large results internally."""
    # Clean SQL - remove trailing semicolon if present
    clean_sql = sql.strip().rstrip(";")

    # NetSuite doesn't support OFFSET/LIMIT, but we can use FETCH NEXT if needed
    # For now, let's just execute the query as-is and see if it returns all rows

    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'transient',
        'Authorization': get_oauth_header('POST', BASE_URL)
    }

    try:
        response = requests.post(
            BASE_URL,
            json={"q": clean_sql},
            headers=headers,
            timeout=180
        )

        # Check for errors
        if response.status_code != 200:
            error_detail = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
            print(f"    Error {response.status_code}: {str(error_detail)[:500]}")

        response.raise_for_status()
        data = response.json()
        items = data.get("items", [])

        # Check if we hit a limit (NetSuite typically returns hasMore flag)
        if data.get("hasMore", False):
            print(f"    Warning: Query returned partial results. Consider adding 'FETCH FIRST {PAGE_SIZE} ROWS ONLY' to the query.")

        return items

    except requests.exceptions.RequestException as e:
        raise


def run_all(definitions: Iterable):
    """Execute all query definitions and save results."""
    timestamp = datetime.now(timezone.utc).isoformat()
    results = []

    print("=" * 60)
    print("Executing System Default Queries from system_defaults.py")
    print("=" * 60)

    # Convert to list to get count
    definitions_list = list(definitions)
    total_queries = len(definitions_list)
    successful = 0
    failed = 0

    for definition in definitions_list:
        try:
            print(f"\nExecuting {definition.query_id}...")
            print(f"  Section: {definition.section}")
            print(f"  Title: {definition.title}")

            rows = execute_suiteql(definition.sql)
            results.append(
                {
                    "query_id": definition.query_id,
                    "section": definition.section,
                    "title": definition.title,
                    "description": definition.description,
                    "collected_at": timestamp,
                    "row_count": len(rows),
                    "rows": rows,
                }
            )
            print(f"  ✓ Success: {len(rows)} rows retrieved")
            successful += 1

        except Exception as exc:
            print(f"  ✗ Failed: {exc}")
            results.append(
                {
                    "query_id": definition.query_id,
                    "section": definition.section,
                    "title": definition.title,
                    "description": definition.description,
                    "collected_at": timestamp,
                    "row_count": 0,
                    "rows": [],
                    "error": str(exc),
                }
            )
            failed += 1

    # Create output directory and write results
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(results, indent=2))

    print("\n" + "=" * 60)
    print(f"✓ Results written to: {OUTPUT_PATH.resolve()}")
    print(f"  Total queries: {total_queries}")
    print(f"  Successful: {successful}")
    print(f"  Failed: {failed}")

    if failed > 0:
        print(f"\n⚠ {failed} queries failed. Check the output file for error details.")
        print("  Common issues:")
        print("  - Missing SuiteAnalytics permission on the integration role")
        print("  - Field unavailable in your account (e.g., Revenue Recognition)")
        print("  - Typo in the SuiteQL (check error messages)")

        # Show queries with errors using jq-like output
        print("\nTo view failed queries:")
        print(f"  cat {OUTPUT_PATH} | python3 -m json.tool | grep -B3 '\"error\"'")

    print("=" * 60)


if __name__ == "__main__":
    run_all(SYSTEM_WIDE_QUERY_DEFINITIONS)
