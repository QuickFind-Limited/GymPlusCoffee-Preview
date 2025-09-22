"""
NetSuite Helper Module - Simple Authentication Wrapper for Claude Code SDK

This module ONLY provides authentication and query execution.
Claude Code SDK writes all the business logic and SQL queries.
"""

import os
import json
import requests
from requests_oauthlib import OAuth1
from typing import Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class NetSuiteClient:
    """Simple NetSuite client that ONLY handles authentication and query execution."""

    def __init__(self):
        """Initialize NetSuite client with credentials from environment."""
        self.auth = OAuth1(
            client_key=os.getenv("GYM_PLUS_COFFEE_CONSUMER_ID"),
            client_secret=os.getenv("GYM_PLUS_COFFEE_CONSUMER_SECRET"),
            resource_owner_key=os.getenv("GYM_PLUS_COFFEE_TOKEN_ID"),
            resource_owner_secret=os.getenv("GYM_PLUS_COFFEE_TOKEN_SECRET"),
            signature_method="HMAC-SHA256",
            realm=os.getenv("NETSUITE_ACCOUNT_ID", "7326096_SB1")
        )

        url_account = os.getenv("NETSUITE_URL_ACCOUNT", "7326096-sb1")
        self.base_url = f"https://{url_account}.suitetalk.api.netsuite.com"
        self.suiteql_url = f"{self.base_url}/services/rest/query/v1/suiteql"

        self.headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Prefer": "transient"
        }

    def query(self, sql: str, timeout: int = 30) -> Dict[str, Any]:
        """
        Execute a SuiteQL query. That's it. No business logic.

        Claude Code SDK writes the SQL queries based on what it needs.

        Args:
            sql: The SuiteQL query to execute
            timeout: Request timeout in seconds

        Returns:
            Query results as a dictionary
        """
        payload = {"q": sql}

        try:
            response = requests.post(
                self.suiteql_url,
                auth=self.auth,
                headers=self.headers,
                json=payload,
                timeout=timeout
            )

            if response.status_code == 200:
                return response.json()
            else:
                return {
                    "error": f"Query failed with status {response.status_code}",
                    "details": response.text,
                    "query": sql
                }
        except requests.exceptions.Timeout:
            return {
                "error": "Query timed out",
                "query": sql,
                "hint": "Try adding ROWNUM limit or simplifying the query"
            }
        except Exception as e:
            return {
                "error": f"Query failed: {str(e)}",
                "query": sql
            }


# Simple convenience function for Claude to import and use
def run_query(sql: str) -> Dict[str, Any]:
    """
    Execute a NetSuite SuiteQL query.

    This is what Claude Code SDK should use:

    import netsuite_helper
    result = netsuite_helper.run_query("SELECT * FROM item WHERE displayname LIKE '%snap%'")

    Claude writes the SQL based on the business need.
    """
    client = NetSuiteClient()
    return client.query(sql)


# Test function to verify connection works
def test_connection() -> Dict[str, Any]:
    """Test NetSuite connection with a simple query."""
    result = run_query("SELECT COUNT(*) as count FROM item WHERE ROWNUM <= 1")

    if "error" in result:
        return {
            "success": False,
            "error": result["error"],
            "details": result.get("details", "")
        }
    else:
        return {
            "success": True,
            "message": "NetSuite connection successful",
            "result": result
        }


# That's it! No business logic. Claude Code SDK handles everything else.
# No find_items(), no analyze_purchase_order(), no hardcoded vendor logic.
# Just authentication and query execution.

if __name__ == "__main__":
    print("NetSuite Helper - Simple Authentication Wrapper")
    print("=" * 50)
    print("\nTesting connection...")
    test_result = test_connection()
    print(json.dumps(test_result, indent=2))

    if test_result["success"]:
        print("\n✅ Connection successful!")
        print("\nClaude Code SDK can now use:")
        print("  import netsuite_helper")
        print("  result = netsuite_helper.run_query('YOUR SQL HERE')")
        print("\nClaude writes all the business logic and SQL queries.")