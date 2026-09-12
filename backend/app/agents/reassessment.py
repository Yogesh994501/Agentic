import logging
from typing import Dict, Any, Tuple
from app.models.domain import Incident, AttackOutcome, IncidentStatus

logger = logging.getLogger("sentinelflow.reassessment")

class ReassessmentManager:
    """Detects outcome contradictions and adapts incident status upon receiving new evidence or overrides."""

    @staticmethod
    def detect_outcome_change(
        incident: Incident,
        new_outcome: AttackOutcome,
        new_confidence: int,
        reason: str
    ) -> Tuple[bool, str]:
        old_outcome = incident.attack_outcome
        if old_outcome != AttackOutcome.UNDETERMINED and old_outcome != new_outcome:
            msg = (
                f"DECISION ADAPTED: Outcome flipped from {old_outcome.value} ({incident.confidence}%) "
                f"to {new_outcome.value} ({new_confidence}%) because new contradictory evidence emerged: {reason}"
            )
            logger.warning(msg)
            return True, msg
        return False, ""
