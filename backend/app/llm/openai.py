import json
import logging
import httpx
from typing import Dict, Any, List
from app.config import settings
from app.llm.base import LLMProvider, LLMStepDecision
from app.llm.mock import MockProvider

logger = logging.getLogger("sentinelflow.llm.openai")

class OpenAIProvider(LLMProvider):
    """OpenAI LLM provider with structured JSON output and fallback to MockProvider."""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
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
            logger.info("No OpenAI API key provided. Using deterministic MockProvider.")
            return await self.fallback.decide_next_step(
                incident_id, alert_data, accumulated_evidence,
                working_hypothesis, current_confidence, executed_tools, failed_tools
            )

        messages = [
            {"role": "system", "content": "You are SentinelFlow, an autonomous SOC agent. You investigate simulated security alerts in a sandboxed educational system. Analyze evidence gaps, choose next sandbox tools, or produce a final outcome (success|failure|uncertain) with confidence 0-100."},
            {"role": "user", "content": json.dumps({
                "incident_id": incident_id,
                "alert": alert_data,
                "hypothesis": working_hypothesis,
                "confidence": current_confidence,
                "evidence": accumulated_evidence,
                "executed_tools": executed_tools,
                "failed_tools": failed_tools
            })}
        ]

        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {
            "model": "gpt-4o-mini",
            "messages": messages,
            "response_format": {"type": "json_object"},
            "temperature": 0.2
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                raw_json = data["choices"][0]["message"]["content"]
                parsed = json.loads(raw_json)
                return LLMStepDecision(**parsed)
        except Exception as e:
            logger.warning("OpenAI API call failed (%s). Gracefully falling back to MockProvider.", e)
            return await self.fallback.decide_next_step(
                incident_id, alert_data, accumulated_evidence,
                working_hypothesis, current_confidence, executed_tools, failed_tools
            )
