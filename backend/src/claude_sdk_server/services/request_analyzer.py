"""Request analyzer to automatically detect and route NetSuite requests."""

import re
from typing import Dict, Any, Optional

class RequestAnalyzer:
    """Analyzes user requests to determine if they need special handling."""

    # NetSuite-related keywords and patterns
    NETSUITE_PATTERNS = [
        r'\bpurchase order\b',
        r'\bPO\b',
        r'\breplenishment\b',
        r'\binventory\b',
        r'\bvendor\b',
        r'\bsupplier\b',
        r'\bNetSuite\b',
        r'\bsnap collar\b',
        r'\bvarsity\b',
        r'\bsweatshirt\b',
        r'\border.*units\b',
        r'\bcreate.*order\b',
    ]

    @classmethod
    def is_netsuite_request(cls, prompt: str) -> bool:
        """Check if the request is NetSuite-related."""
        prompt_lower = prompt.lower()

        for pattern in cls.NETSUITE_PATTERNS:
            if re.search(pattern, prompt_lower, re.IGNORECASE):
                return True
        return False

    @classmethod
    def analyze_request(cls, prompt: str) -> Dict[str, Any]:
        """Analyze a request and return routing information."""

        result = {
            "is_netsuite": False,
            "needs_clarification": False,
            "suggested_endpoint": None,
            "detected_intent": None
        }

        # Check for NetSuite request
        if cls.is_netsuite_request(prompt):
            result["is_netsuite"] = True
            result["needs_clarification"] = True
            result["suggested_endpoint"] = "/api/v1/netsuite/clarify"

            # Detect specific intent
            if any(word in prompt.lower() for word in ['create', 'make', 'generate']):
                result["detected_intent"] = "create_purchase_order"
            elif any(word in prompt.lower() for word in ['check', 'verify', 'status']):
                result["detected_intent"] = "check_order_status"
            elif any(word in prompt.lower() for word in ['inventory', 'stock']):
                result["detected_intent"] = "check_inventory"

        return result

    @classmethod
    def enhance_prompt_with_context(cls, prompt: str, analysis: Dict[str, Any]) -> str:
        """Enhance the prompt with contextual information."""

        if analysis["is_netsuite"]:
            enhanced = f"""NetSuite Request Detected:
Original: {prompt}

Suggested approach:
1. Use the NetSuite clarification endpoint first
2. The system will automatically:
   - Detect gender distinctions from item codes
   - Query live NetSuite data for available options
   - Check vendor history
   - Generate structured clarifications

Intent: {analysis.get('detected_intent', 'general_netsuite')}
"""
            return enhanced

        return prompt