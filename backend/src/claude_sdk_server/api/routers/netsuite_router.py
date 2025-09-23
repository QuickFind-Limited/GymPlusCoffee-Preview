"""NetSuite integration router for Claude Code SDK."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

from src.claude_sdk_server.models.dto import QueryRequest
from src.claude_sdk_server.services.claude_service import ClaudeService, get_claude_service
from src.claude_sdk_server.utils.logging_config import get_logger
from src.claude_sdk_server.dependencies import require_auth

logger = get_logger(__name__)
router = APIRouter(
    prefix="/api/v1/netsuite",
    tags=["netsuite"],
    dependencies=[Depends(require_auth)],
)

class NetSuiteRequest(BaseModel):
    """Request model for NetSuite queries."""
    query: str
    session_id: Optional[str] = None
    include_thinking: bool = False
    max_turns: int = 15

class NetSuiteResponse(BaseModel):
    """Response model for NetSuite queries."""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    session_id: Optional[str] = None
    timestamp: str

# System prompt that teaches Claude Code SDK about NetSuite
NETSUITE_SYSTEM_PROMPT = """You are a NetSuite ERP assistant helping users with purchase orders and inventory.

## AVAILABLE TOOLS:

You have MCP NetSuite tools available:
- mcp__netsuite_mcp__execute_suiteql: Run any SQL query
- mcp__netsuite_mcp__get_table_schema: Explore data structures
- Other NetSuite operations for creating or updating records

## YOUR APPROACH:

1. Stay focused on the specific business question or item the user mentions.
2. Ask concise follow-up questions when critical details are missing (transaction type, subsidiary, currency, date range, product variants, vendor preference).
3. Use transaction history, inventory posture, and vendor performance to support recommendations and flag anomalies.
4. Return structured JSON responses that summarize findings, assumptions, and recommended next steps.

## KEY INSIGHTS:
- Items are in the transactionline table, not directly in transaction
- Vendor history: JOIN transaction t, transactionline tl WHERE t.entity = vendor_id
- Snap Collar Varsity items exist but only in Black color
- Santic (ID: 589) is a known apparel supplier
- IMPORTANT: Always check for gender distinctions (Mens/Womens/Unisex) in item names
- Look for patterns like 'W Venice', 'Unisex Varsity', gender prefixes in displayname

## Available Credentials (in environment variables for netsuite_helper):
- GYM_PLUS_COFFEE_CONSUMER_ID
- GYM_PLUS_COFFEE_CONSUMER_SECRET
- GYM_PLUS_COFFEE_TOKEN_ID
- GYM_PLUS_COFFEE_TOKEN_SECRET

## NetSuite Configuration:
- Account ID: 7326096_SB1
- API URL: https://7326096-sb1.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql

## NetSuite Table Reference (discover these yourself):
- **item**: Products table (try: SELECT * FROM item WHERE ROWNUM = 1)
- **vendor**: Suppliers (explore the structure)
- **customer**: Buyers
- **transaction**: Headers for orders/invoices
- **transactionline**: Line items (items are here, not in transaction!)
- **Note**: Items link to transactions through transactionline table

## Example Workflow:
1. Search for the product or metric the user mentioned using SuiteQL.
2. If multiple options exist (variants, vendors, subsidiaries), confirm the correct dimension with the user before proceeding.
3. Use MCP tools to gather supporting data (sales history, on-hand inventory, vendor performance).
4. Summarize the findings and recommend the next business action.

Remember: YOU write the SQL. YOU discover the data structure. YOU adapt when queries fail.
"""

@router.post("/execute", response_model=NetSuiteResponse)
async def execute_action(
    request: NetSuiteRequest,
    service: ClaudeService = Depends(get_claude_service),
):
    """
    Execute a NetSuite action (create PO, update inventory, etc).

    Claude Code SDK will validate and execute the requested action.
    """
    logger.info(f"Executing NetSuite action: {request.query[:100]}...")

    try:
        prompt = f"""
        User request: {request.query}

        IMPORTANT: Now use your MCP server tools to EXECUTE the action (not netsuite_helper).

        Execute the requested NetSuite action:
        1. Use MCP tools to validate the data
        2. Use MCP tools to create the purchase order or perform the action
        3. Return confirmation of what was done

        The MCP server has tools for:
        - Creating purchase orders
        - Updating inventory
        - Managing transactions
        - Other NetSuite operations

        For purchase orders:
        - Use MCP to verify final items and vendor
        - Use MCP to calculate quantities correctly
        - Use MCP to create the actual PO

        Be cautious - only execute if you're certain it's correct.
        USE MCP TOOLS for this execution step, NOT netsuite_helper.
        """

        response = await service.query(
            request=QueryRequest(
                prompt=prompt,
                session_id=request.session_id,
                max_turns=request.max_turns,
                model="claude-sonnet-4-20250514",
                system_prompt=NETSUITE_SYSTEM_PROMPT + "\n\nYou may execute write operations if validated and safe."
            )
        )

        return NetSuiteResponse(
            success=True,
            data={"response": response.response, "action_taken": True},
            session_id=response.session_id,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"NetSuite execution error: {str(e)}")
        return NetSuiteResponse(
            success=False,
            error=str(e),
            timestamp=datetime.now().isoformat()
        )

@router.get("/test")
async def test_netsuite_connection(
    service: ClaudeService = Depends(get_claude_service),
):
    """Test NetSuite connection and credentials."""

    logger.info("Testing NetSuite connection...")

    prompt = """
    Test the NetSuite connection by:
    1. Loading the credentials from environment variables
    2. Making a simple query to verify authentication works
    3. Report the status

    Try: SELECT COUNT(*) as count FROM item WHERE ROWNUM <= 1

    This will verify credentials and basic connectivity.
    """

    try:
        response = await service.query(
            request=QueryRequest(
                prompt=prompt,
                max_turns=5,
                model="claude-sonnet-4-20250514",
                system_prompt=NETSUITE_SYSTEM_PROMPT
            )
        )

        return {
            "success": True,
            "message": "NetSuite connection test completed",
            "details": response.response,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@router.get("/health")
async def health_check():
    """Check if NetSuite integration is healthy."""
    return {
        "status": "healthy",
        "service": "NetSuite Integration",
        "timestamp": datetime.now().isoformat()
    }
