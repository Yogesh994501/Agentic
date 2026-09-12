import logging
from typing import Dict, Any
from app.models.domain import Incident, VerificationStatus
from app.tools.sandbox_tools import verify_block

logger = logging.getLogger("sentinelflow.verification")

class VerificationManager:
    """Verifies that the simulated containment actually took effect in the sandbox environment."""

    @staticmethod
    async def verify_containment(incident: Incident, target_ip: str) -> Dict[str, Any]:
        logger.info("Verifying containment of %s in sandbox state", target_ip)
        result = await verify_block(target_ip)
        
        is_blocked = result.get("blocked", False)
        status = VerificationStatus.PASSED if is_blocked else VerificationStatus.FAILED
        
        return {
            "status": status,
            "blocked": is_blocked,
            "target_ip": target_ip,
            "details": result
        }
