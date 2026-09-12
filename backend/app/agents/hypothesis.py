from typing import List, Dict, Any
from app.models.domain import EvidenceItem

class HypothesisManager:
    """Maintains and evolves working hypotheses based on accumulating evidence."""

    @staticmethod
    def initial_hypothesis(alert_signature: str, target_ip: str) -> str:
        return f"Suspicious activity ({alert_signature}) reported targeting {target_ip}. Alert label is unverified; investigating whether target was exposed, vulnerable, or breached."

    @staticmethod
    def refine_hypothesis(previous_hypothesis: str, new_evidence: EvidenceItem, current_confidence: int) -> str:
        finding = new_evidence.finding
        if new_evidence.supports_success:
            return f"{previous_hypothesis} [Updated]: Corroborated with positive indicator: {finding}"
        else:
            return f"{previous_hypothesis} [Updated]: Contradicted by protective indicator: {finding}"
