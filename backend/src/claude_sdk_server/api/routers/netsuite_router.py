"""NetSuite integration router for Claude Code SDK."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

from src.claude_sdk_server.models.dto import QueryRequest
from src.claude_sdk_server.services.claude_service import ClaudeService
from src.claude_sdk_server.utils.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/v1/netsuite", tags=["netsuite"])

# Initialize Claude service
claude_service = ClaudeService()

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
    clarifications: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None
    session_id: Optional[str] = None
    timestamp: str

# System prompt that teaches Claude Code SDK about NetSuite
NETSUITE_SYSTEM_PROMPT = """You are a NetSuite ERP assistant helping users with purchase orders and inventory.

## AVAILABLE TOOLS:

You have MCP NetSuite tools available:
- mcp__netsuite_mcp__execute_suiteql: Run any SQL query
- mcp__netsuite_mcp__get_table_schema: Explore table structures
- Other MCP NetSuite operations for creating/updating records

## YOUR APPROACH:

1. Be FOCUSED - Don't explore unnecessarily
2. Query for SPECIFIC items the user mentions
3. Check vendor history using transactionline table (items are there, not in transaction)
4. Generate CLEAR clarification questions
5. Return STRUCTURED JSON responses

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

## Key Discovery:
```sql
-- Items are in transactionline, not directly in transaction
SELECT tl.item, i.displayname
FROM transactionline tl
JOIN transaction t ON t.id = tl.transaction
JOIN item i ON i.id = tl.item
WHERE t.entity = <vendor_id>
```

## Example Query Pattern:
```python
import netsuite_helper

# 1. Search for items
sql = "SELECT id, displayname FROM item WHERE UPPER(displayname) LIKE '%SNAP%COLLAR%VARSITY%'"
items = netsuite_helper.run_query(sql)

if items.get('items'):
    print(f"Found {len(items['items'])} items")

    # 2. Get item IDs
    item_ids = [str(item['id']) for item in items['items']]

    # 3. Find vendors (remembering items are in transactionline!)
    sql = f'''
        SELECT DISTINCT v.companyname, COUNT(*) as orders
        FROM vendor v
        JOIN transaction t ON t.entity = v.id
        JOIN transactionline tl ON tl.transaction = t.id
        WHERE tl.item IN ({','.join(item_ids)})
        GROUP BY v.companyname
    '''
    vendors = netsuite_helper.run_query(sql)

    # 4. Generate clarifications based on ACTUAL data
```

Remember: YOU write the SQL. YOU discover the data structure. YOU adapt when queries fail.
"""

@router.post("/clarify", response_model=NetSuiteResponse)
async def clarify_request(request: NetSuiteRequest):
    """
    Process a NetSuite request and return clarifications.

    Claude Code SDK will write and execute code to:
    1. Query NetSuite for relevant data
    2. Analyze the results
    3. Generate clarifying questions
    """
    logger.info(f"Processing NetSuite clarification request: {request.query[:100]}...")

    try:
        # Prepare the prompt for Claude Code SDK
        prompt = f"""
        User request: {request.query}

        Analyze this NetSuite request and generate clarification questions.

        You have access to MCP NetSuite tools - use them! They're great for:
        - execute_suiteql: Run SQL queries
        - get_table_schema: Explore table structures
        - Other NetSuite operations

        IMPORTANT: Be focused and efficient:
        1. Query for the specific items mentioned
        2. Check for gender distinctions (Mens/Womens/Unisex) in item names
        3. Check if vendors have supplied them
        4. Look at inventory if relevant
        5. Generate clarifications based on what you find, including gender if applicable

        Return a structured JSON response with:
        {{
            "items_found": <number>,
            "clarifications": [
                {{
                    "field": "vendor",
                    "question": "Which vendor should supply?",
                    "options": ["Vendor A", "Vendor B"]
                }},
                {{
                    "field": "quantity",
                    "question": "How to distribute 200 units?",
                    "options": {{"item1": 100, "item2": 100}}
                }}
            ]
        }}
        """

        # Let Claude Code SDK handle everything
        response = await claude_service.query(
            request=QueryRequest(
                prompt=prompt,
                session_id=request.session_id,
                max_turns=request.max_turns,
                model="claude-sonnet-4-20250514",
                max_thinking_tokens=8000 if request.include_thinking else 0,
                system_prompt=NETSUITE_SYSTEM_PROMPT
            )
        )

        # Extract clarifications from response if present
        clarifications = None
        if "clarifications" in response.response.lower():
            # Claude should return structured data we can parse
            try:
                import json
                import re
                # Look for JSON blocks - try both with and without ```json markers
                json_match = re.search(r'```json\n(.*?)\n```', response.response, re.DOTALL)
                if not json_match:
                    # Try to find JSON object directly
                    json_match = re.search(r'(\{[^}]*"clarifications"[^}]*\})', response.response, re.DOTALL)
                    if json_match:
                        # Find the complete JSON object
                        start_idx = response.response.find(json_match.group(0))
                        bracket_count = 0
                        end_idx = start_idx
                        for i, char in enumerate(response.response[start_idx:], start_idx):
                            if char == '{':
                                bracket_count += 1
                            elif char == '}':
                                bracket_count -= 1
                            if bracket_count == 0:
                                end_idx = i + 1
                                break
                        json_str = response.response[start_idx:end_idx]
                        parsed_json = json.loads(json_str)
                    else:
                        parsed_json = None
                else:
                    parsed_json = json.loads(json_match.group(1))

                # Extract clarifications list from parsed JSON
                if parsed_json and isinstance(parsed_json, dict) and 'clarifications' in parsed_json:
                    clarifications = parsed_json['clarifications']
                elif isinstance(parsed_json, list):
                    clarifications = parsed_json
            except Exception as e:
                logger.warning(f"Failed to parse clarifications: {e}")

        return NetSuiteResponse(
            success=True,
            data={"response": response.response},
            clarifications=clarifications,
            session_id=response.session_id,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"NetSuite clarification error: {str(e)}")
        return NetSuiteResponse(
            success=False,
            error=str(e),
            timestamp=datetime.now().isoformat()
        )

@router.post("/execute", response_model=NetSuiteResponse)
async def execute_action(request: NetSuiteRequest):
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

        response = await claude_service.query(
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
async def test_netsuite_connection():
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
        response = await claude_service.query(
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
