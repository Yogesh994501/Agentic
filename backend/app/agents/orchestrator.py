import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.config import settings
from app.database.repository import Repository
from app.models.domain import (
    Incident, IncidentStatus, AttackOutcome, ResponseStatus,
    VerificationStatus, AgentEvent, EvidenceItem, HumanOverride
)
from app.tools.registry import tool_registry
from app.llm import get_llm_provider
from app.agents.hypothesis import HypothesisManager
from app.agents.evidence_manager import EvidenceManager
from app.agents.decision_engine import DecisionEngine
from app.agents.response_manager import ResponseManager
from app.agents.verification_manager import VerificationManager
from app.agents.reassessment import ReassessmentManager
from app.api.sse import event_bus

logger = logging.getLogger("sentinelflow.orchestrator")

class AgentOrchestrator:
    """The Autonomous SOC Investigation & Response Agent Orchestrator."""

    def __init__(self):
        self.llm = get_llm_provider()

    async def emit_event(
        self,
        incident_id: str,
        event_type: str,
        description: str,
        tool: Optional[str] = None,
        input_data: Optional[Dict[str, Any]] = None,
        output_data: Optional[Dict[str, Any]] = None,
        confidence: Optional[int] = None
    ) -> AgentEvent:
        evt = AgentEvent(
            incident_id=incident_id,
            event_type=event_type,
            description=description,
            tool=tool,
            input=input_data,
            output=output_data,
            confidence=confidence,
            source="SentinelFlowAgent"
        )
        await Repository.record_event(evt)
        await event_bus.broadcast(evt)
        return evt

    async def create_incident(self, alert_id: str) -> Incident:
        alert = await Repository.get_alert(alert_id)
        if not alert:
            raise ValueError(f"Alert {alert_id} not found.")

        incident_id = f"INC-{alert_id.replace('ALT-', '')}"
        existing = await Repository.get_incident(incident_id)
        if existing:
            return existing

        initial_hyp = HypothesisManager.initial_hypothesis(alert.signature, alert.destination_ip)
        incident = Incident(
            incident_id=incident_id,
            alert_id=alert_id,
            status=IncidentStatus.NEW,
            severity=alert.severity,
            current_hypothesis=initial_hyp,
            attack_outcome=AttackOutcome.UNDETERMINED,
            confidence=10,
            evidence=[],
            reasoning_summary=f"Incident opened for alert {alert_id} ({alert.signature}). Commencing autonomous investigation.",
            created_at=datetime.utcnow().isoformat(),
            updated_at=datetime.utcnow().isoformat()
        )
        await Repository.save_incident(incident)

        # Initial events
        await self.emit_event(
            incident_id=incident_id,
            event_type="OBSERVE",
            description=f"Alert ingested: {alert.signature} ({alert.severity.value}) from {alert.source_ip} to {alert.destination_ip}:{alert.destination_port}",
            input_data=alert.model_dump(),
            confidence=10
        )

        await self.emit_event(
            incident_id=incident_id,
            event_type="PLAN",
            description=f"Initial hypothesis formed: {initial_hyp}. Commencing evidence-gap analysis.",
            confidence=10
        )

        return incident

    async def run_investigation(self, incident_id: str, max_steps: Optional[int] = None) -> Incident:
        incident = await Repository.get_incident(incident_id)
        if not incident:
            raise ValueError(f"Incident {incident_id} not found.")

        alert = await Repository.get_alert(incident.alert_id)
        if not alert:
            raise ValueError(f"Alert {incident.alert_id} not found.")

        max_steps = max_steps or settings.MAX_INVESTIGATION_STEPS
        incident.status = IncidentStatus.INVESTIGATING
        await Repository.save_incident(incident)

        executed_tools: List[str] = []
        failed_tools: List[str] = []

        step = 0
        while step < max_steps:
            step += 1
            await asyncio.sleep(0.3)  # Brief cadence for visual telemetry pacing

            # 1. Ask Agentic LLM / Mock Engine to assess evidence gaps and pick next tool
            decision = await self.llm.decide_next_step(
                incident_id=incident_id,
                alert_data=alert.model_dump(),
                accumulated_evidence=[e.model_dump() for e in incident.evidence],
                working_hypothesis=incident.current_hypothesis,
                current_confidence=incident.confidence,
                executed_tools=executed_tools,
                failed_tools=failed_tools
            )

            # Update hypothesis & confidence
            if decision.hypothesis:
                incident.current_hypothesis = decision.hypothesis
            incident.confidence = decision.confidence

            # 2. Check if agent decided evidence is sufficient
            if not decision.next_tool or decision.assessment in ["success", "failure", "uncertain"]:
                # If there are no more tools or decisive verdict reached
                if decision.next_tool is None:
                    break

            tool_name = decision.next_tool
            tool_args = decision.next_tool_arguments

            # 3. Log PLAN & TOOL_CALL
            gaps_str = ", ".join(decision.missing_evidence) if decision.missing_evidence else "None"
            await self.emit_event(
                incident_id=incident_id,
                event_type="PLAN",
                description=f"Evidence gap detected: [{gaps_str}]. Selecting tool '{tool_name}'.",
                tool=tool_name,
                input_data=tool_args,
                confidence=incident.confidence
            )

            await self.emit_event(
                incident_id=incident_id,
                event_type="TOOL_CALL",
                description=f"Invoking sandbox tool: {tool_name}({tool_args})",
                tool=tool_name,
                input_data=tool_args,
                confidence=incident.confidence
            )

            # 4. Execute Sandbox Tool
            execution_res = await tool_registry.execute(tool_name, tool_args)
            executed_tools.append(tool_name)

            # Check for tool failure (simulated or runtime)
            if not execution_res.get("success"):
                failed_tools.append(tool_name)
                err_msg = execution_res.get("error", "Unknown tool error")
                await self.emit_event(
                    incident_id=incident_id,
                    event_type="TOOL_RESULT",
                    description=f"Tool '{tool_name}' failed: {err_msg}. Agent will adjust strategy.",
                    tool=tool_name,
                    output_data=execution_res,
                    confidence=incident.confidence
                )
                continue

            # 5. Extract Evidence
            ev_item = EvidenceManager.extract_evidence_from_result(tool_name, execution_res)
            if ev_item:
                incident.evidence.append(ev_item)
                await self.emit_event(
                    incident_id=incident_id,
                    event_type="EVIDENCE",
                    description=f"Evidence retrieved [{ev_item.evidence_id}]: {ev_item.finding} (Confidence impact: {ev_item.confidence_impact:+d})",
                    tool=tool_name,
                    output_data=ev_item.model_dump(),
                    confidence=incident.confidence
                )

                # Update hypothesis
                incident.current_hypothesis = HypothesisManager.refine_hypothesis(
                    incident.current_hypothesis, ev_item, incident.confidence
                )
                await self.emit_event(
                    incident_id=incident_id,
                    event_type="HYPOTHESIS_UPDATE",
                    description=f"Updated hypothesis: {incident.current_hypothesis}",
                    confidence=incident.confidence
                )

            await Repository.save_incident(incident)

        # Final Correlated Evaluation
        final_decision = await self.llm.decide_next_step(
            incident_id=incident_id,
            alert_data=alert.model_dump(),
            accumulated_evidence=[e.model_dump() for e in incident.evidence],
            working_hypothesis=incident.current_hypothesis,
            current_confidence=incident.confidence,
            executed_tools=executed_tools,
            failed_tools=failed_tools
        )

        # Map to AttackOutcome
        outcome_map = {
            "success": AttackOutcome.ATTACK_SUCCEEDED,
            "failure": AttackOutcome.ATTACK_FAILED,
            "uncertain": AttackOutcome.INSUFFICIENT_EVIDENCE
        }
        outcome = outcome_map.get(final_decision.assessment, AttackOutcome.INSUFFICIENT_EVIDENCE)
        incident.attack_outcome = outcome
        incident.confidence = final_decision.confidence
        incident.reasoning_summary = final_decision.reason
        incident.recommended_action = f"Simulate firewall block on {alert.source_ip}" if final_decision.response_recommended else "None"

        await self.emit_event(
            incident_id=incident_id,
            event_type="DECISION",
            description=f"Final Assessment: {outcome.value} (Confidence: {incident.confidence}%). {incident.reasoning_summary}",
            confidence=incident.confidence,
            output_data={"outcome": outcome.value, "confidence": incident.confidence, "reason": incident.reasoning_summary}
        )

        # Response Decision & Execution
        if ResponseManager.is_response_justified(outcome, incident.confidence, alert.source_ip):
            await self.emit_event(
                incident_id=incident_id,
                event_type="ACTION",
                description=f"Autonomous response policy satisfied. Executing simulated firewall block on source IP {alert.source_ip}.",
                tool="block_ip_simulated",
                input_data={"ip": alert.source_ip, "reason": incident.reasoning_summary},
                confidence=incident.confidence
            )

            # Execute simulated block
            resp_result = await ResponseManager.execute_containment(
                incident=incident,
                source_ip=alert.source_ip,
                reason=incident.reasoning_summary
            )
            incident.response_status = ResponseStatus.EXECUTED

            # Verification
            verify_res = await VerificationManager.verify_containment(incident, alert.source_ip)
            incident.verification_status = verify_res["status"]

            await self.emit_event(
                incident_id=incident_id,
                event_type="VERIFY",
                description=f"Post-action verification: {verify_res['details'].get('message', 'Rule active')}. Result: {verify_res['status'].value}.",
                tool="verify_block",
                output_data=verify_res,
                confidence=incident.confidence
            )

            incident.status = IncidentStatus.CONTAINED
            await self.emit_event(
                incident_id=incident_id,
                event_type="DECISION",
                description=f"Incident {incident_id} successfully contained in sandbox environment.",
                confidence=incident.confidence
            )

        elif outcome == AttackOutcome.ATTACK_FAILED:
            incident.status = IncidentStatus.FALSE_POSITIVE
            incident.response_status = ResponseStatus.NONE
            await self.emit_event(
                incident_id=incident_id,
                event_type="DECISION",
                description=f"Incident {incident_id} classified as False Positive / Failed Attack. No containment required.",
                confidence=incident.confidence
            )

        else:
            incident.status = IncidentStatus.INSUFFICIENT_EVIDENCE
            incident.response_status = ResponseStatus.NONE
            await self.emit_event(
                incident_id=incident_id,
                event_type="DECISION",
                description=f"Incident {incident_id} concluded with insufficient evidence. Refusing dangerous action.",
                confidence=incident.confidence
            )

        incident.updated_at = datetime.utcnow().isoformat()
        await Repository.save_incident(incident)
        return incident

    async def inject_evidence_and_reassess(self, incident_id: str, evidence_data: Dict[str, Any]) -> Incident:
        """Dynamic Adaptation: Injects new evidence and re-evaluates the incident."""
        incident = await Repository.get_incident(incident_id)
        if not incident:
            raise ValueError(f"Incident {incident_id} not found.")

        old_outcome = incident.attack_outcome
        old_conf = incident.confidence

        # Register injected evidence
        from app.tools.sandbox_tools import inject_new_evidence
        await inject_new_evidence(incident_id, evidence_data)

        # Refresh incident
        incident = await Repository.get_incident(incident_id)

        await self.emit_event(
            incident_id=incident_id,
            event_type="ADAPT",
            description=f"NEW EVIDENCE ARRIVED: {evidence_data.get('finding', 'Supplemental log detected')}. Reopening incident for dynamic reassessment.",
            input_data=evidence_data,
            confidence=incident.confidence
        )

        incident.status = IncidentStatus.REOPENED
        await Repository.save_incident(incident)

        # Re-run investigation with new evidence in context
        updated_incident = await self.run_investigation(incident_id, max_steps=5)

        # Check if decision changed
        has_changed, msg = ReassessmentManager.detect_outcome_change(
            incident, updated_incident.attack_outcome, updated_incident.confidence, evidence_data.get("finding", "")
        )
        if has_changed:
            updated_incident.is_adapted = True
            updated_incident.adaptation_reason = msg
            await self.emit_event(
                incident_id=incident_id,
                event_type="ADAPT",
                description=msg,
                confidence=updated_incident.confidence
            )
            await Repository.save_incident(updated_incident)

        return updated_incident

    async def apply_human_override(
        self,
        incident_id: str,
        override_decision: str,  # "APPROVE_RESPONSE" | "REJECT_RESPONSE" | "FORCE_BLOCK" | "RELEASE_BLOCK" | "MARK_FALSE_POSITIVE" | "REOPEN"
        reason: str,
        operator: str = "SOC Lead"
    ) -> Incident:
        incident = await Repository.get_incident(incident_id)
        if not incident:
            raise ValueError(f"Incident {incident_id} not found.")

        alert = await Repository.get_alert(incident.alert_id)
        src_ip = alert.source_ip if alert else "unknown"

        override_record = HumanOverride(
            incident_id=incident_id,
            previous_decision=incident.attack_outcome,
            override_decision=AttackOutcome.ATTACK_SUCCEEDED if "BLOCK" in override_decision else AttackOutcome.ATTACK_FAILED,
            reason=f"[{override_decision}] {reason}",
            operator=operator
        )
        await Repository.record_human_override(override_record)

        if override_decision == "APPROVE_RESPONSE" or override_decision == "FORCE_BLOCK":
            await ResponseManager.execute_containment(incident, src_ip, f"Human override: {reason}")
            verify_res = await VerificationManager.verify_containment(incident, src_ip)
            incident.response_status = ResponseStatus.EXECUTED
            incident.verification_status = verify_res["status"]
            incident.status = IncidentStatus.CONTAINED
            incident.attack_outcome = AttackOutcome.ATTACK_SUCCEEDED

        elif override_decision == "REJECT_RESPONSE":
            incident.response_status = ResponseStatus.REJECTED
            incident.status = IncidentStatus.CLOSED

        elif override_decision == "RELEASE_BLOCK":
            await Repository.remove_firewall_rule(src_ip)
            incident.response_status = ResponseStatus.NONE
            incident.verification_status = VerificationStatus.NOT_VERIFIED

        elif override_decision == "MARK_FALSE_POSITIVE":
            incident.attack_outcome = AttackOutcome.ATTACK_FAILED
            incident.status = IncidentStatus.FALSE_POSITIVE

        elif override_decision == "REOPEN":
            incident.status = IncidentStatus.REOPENED

        incident.updated_at = datetime.utcnow().isoformat()
        await Repository.save_incident(incident)

        await self.emit_event(
            incident_id=incident_id,
            event_type="OVERRIDE",
            description=f"HUMAN OVERRIDE applied by {operator}: {override_decision}. Reason: {reason}",
            confidence=incident.confidence,
            output_data={"override_decision": override_decision, "operator": operator, "reason": reason}
        )

        return incident

orchestrator = AgentOrchestrator()
