import logging
from typing import Dict, Any, Optional
from app.config import settings
from app.models.domain import AttackOutcome, Incident, ResponseStatus
from app.tools.sandbox_tools import block_ip_simulated

logger = logging.getLogger("sentinelflow.response")

class ResponseManager:
    """Evaluates response policy and executes simulated containment inside the sandbox."""

    @staticmethod
    def is_response_justified(outcome: AttackOutcome, confidence: int, target_ip: str) -> bool:
        if outcome != AttackOutcome.ATTACK_SUCCEEDED:
            return False
        if confidence < settings.CONFIDENCE_THRESHOLD:
            return False
        if not target_ip:
            return False
        return True

    @staticmethod
    async def execute_containment(incident: Incident, source_ip: str, reason: str) -> Dict[str, Any]:
        """Executes simulated firewall block inside the sandbox."""
        logger.info("Executing simulated block on %s for incident %s", source_ip, incident.incident_id)
        result = await block_ip_simulated(
            ip=source_ip,
            reason=reason,
            incident_id=incident.incident_id
        )
        return result
