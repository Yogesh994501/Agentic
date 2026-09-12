import json
import logging
import httpx
from typing import Dict, Any, List
from app.config import settings
from app.llm.base import LLMProvider, LLMStepDecision
from app.llm.mock import MockProvider

logger = logging.getLogger("sentinelflow.llm.gemini")

class GeminiProvider(LLMProvider):
    """Google Gemini LLM provider with structured JSON output and fallback to MockProvider."""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.fallback = MockProvider()

    async def decide_next_step(
        self,
        incident_id: str,
        alert_data: Dict[str, Any],
        accumulated_evidence: List[Dict[str, Any]],
        working_hypothesis: str,
        current_confidence: int,
        executed_tools: List[str],
        failed_tools: List[str]
    ) -> LLMStepDecision:
        if not self.api_key:
            logger.info("No Gemini API key provided. Using deterministic MockProvider.")
            return await self.fallback.decide_next_step(
                incident_id, alert_data, accumulated_evidence,
                working_hypothesis, current_confidence, executed_tools, failed_tools
            )

        prompt = f"""
You are SentinelFlow, an autonomous SOC agent.
Analyze the following security incident in our synthetic educational sandbox:

ALERT:
{json.dumps(alert_data, indent=2)}

WORKING HYPOTHESIS:
{working_hypothesis}

CURRENT CONFIDENCE: {current_confidence}%

ACCUMULATED EVIDENCE:
{json.dumps(accumulated_evidence, indent=2)}

EXECUTED TOOLS:
{json.dumps(executed_tools)}

FAILED TOOLS (UNAVAILABLE):
{json.dumps(failed_tools)}

Determine:
1. What evidence is still missing (evidence gap analysis)?
2. What sandbox tool should be called next, if any? Allowed tools: get_asset, get_vulnerabilities, get_packet_metadata, get_server_logs, get_configuration, block_ip_simulated, verify_block.
3. If evidence is sufficient, determine the outcome (success, failure, or uncertain) and numeric confidence (0-100).
4. If attack succeeded with confidence >= 80%, recommend response (response_recommended: true).

Respond ONLY with valid JSON matching this schema:
{{
  "assessment": "success" | "failure" | "uncertain" | "investigating",
  "confidence": <int between 0 and 100>,
  "reason": "<clear explanation>",
  "hypothesis": "<updated working hypothesis>",
  "evidence_ids": ["<EVD-xxx>", ...],
  "missing_evidence": ["<missing item>", ...],
  "next_tool": "<tool_name or null>",
  "next_tool_arguments": {{...}},
  "response_recommended": <boolean>,
  "recommended_target": "<IP or null>"
}}
"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"}
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()
                text_content = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text_content)
                return LLMStepDecision(**parsed)
        except Exception as e:
            logger.warning("Gemini API call failed (%s). Gracefully falling back to MockProvider.", e)
            return await self.fallback.decide_next_step(
                incident_id, alert_data, accumulated_evidence,
                working_hypothesis, current_confidence, executed_tools, failed_tools
            )
