from typing import List, Dict, Any, Tuple
from app.models.domain import EvidenceItem, AttackOutcome

class DecisionEngine:
    """Evaluates accumulated evidence, weights conflicting findings, and computes final attack outcome."""

    @staticmethod
    def evaluate(evidence_list: List[EvidenceItem]) -> Tuple[AttackOutcome, int, str]:
        if not evidence_list:
            return AttackOutcome.INSUFFICIENT_EVIDENCE, 0, "No evidence retrieved."

        success_weight = 0
        failure_weight = 0
        findings_summary = []

        for ev in evidence_list:
            impact = abs(ev.confidence_impact)
            findings_summary.append(f"• {ev.finding}")
            if ev.supports_success:
                success_weight += impact
            else:
                failure_weight += impact

        # Correlate
        net_score = success_weight - failure_weight
        total_weight = success_weight + failure_weight
        
        # Conflict detection
        has_conflict = (success_weight > 25 and failure_weight > 25)

        if success_weight >= 60 and success_weight > failure_weight * 1.5:
            confidence = min(98, 70 + int((success_weight / max(total_weight, 1)) * 28))
            reason = "ATTACK SUCCEEDED: High-confidence correlation confirms vulnerability presence, payload delivery, and host-level execution."
            if has_conflict:
                reason += " (Note: Conflicting indicators reconciled against primary server execution proof)."
            return AttackOutcome.ATTACK_SUCCEEDED, confidence, reason

        elif failure_weight >= 40 and failure_weight > success_weight * 1.5:
            confidence = min(95, 65 + int((failure_weight / max(total_weight, 1)) * 30))
            reason = "ATTACK FAILED / FALSE POSITIVE: Host-level evidence confirms traffic was dropped or rejected by perimeter controls without backend compromise."
            return AttackOutcome.ATTACK_FAILED, confidence, reason

        else:
            confidence = min(60, max(30, int(abs(net_score))))
            reason = "INSUFFICIENT EVIDENCE: Available telemetry contains conflicting or incomplete signals. Refusing forced binary classification."
            return AttackOutcome.INSUFFICIENT_EVIDENCE, confidence, reason
