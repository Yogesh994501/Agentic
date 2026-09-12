import asyncio
import pytest
from app.simulation.seed import seed_database
from app.agents.orchestrator import orchestrator
from app.models.domain import AttackOutcome, IncidentStatus, ResponseStatus, VerificationStatus
from app.tools.registry import tool_registry
from app.database.repository import Repository

@pytest.fixture(autouse=True)
def setup_sandbox():
    asyncio.run(seed_database())

@pytest.mark.asyncio
async def test_scenario_1_confirmed_attack():
    """Scenario 1: High severity alert on Server-07 -> Confirmed Exploitation -> Block -> Verify."""
    incident = await orchestrator.create_incident("ALT-1001")
    assert incident.status == IncidentStatus.NEW

    resolved = await orchestrator.run_investigation(incident.incident_id)
    assert resolved.attack_outcome == AttackOutcome.ATTACK_SUCCEEDED
    assert resolved.confidence >= 85
    assert resolved.response_status == ResponseStatus.EXECUTED
    assert resolved.verification_status == VerificationStatus.PASSED
    assert resolved.status == IncidentStatus.CONTAINED
    assert len(resolved.evidence) >= 3

@pytest.mark.asyncio
async def test_scenario_2_false_positive():
    """Scenario 2: Alert flags SQLi on Server-03 -> WAF 403 dropped -> False Positive."""
    incident = await orchestrator.create_incident("ALT-1002")
    resolved = await orchestrator.run_investigation(incident.incident_id)
    assert resolved.attack_outcome == AttackOutcome.ATTACK_FAILED
    assert resolved.confidence >= 80
    assert resolved.status == IncidentStatus.FALSE_POSITIVE
    assert resolved.response_status == ResponseStatus.NONE

@pytest.mark.asyncio
async def test_scenario_3_ambiguous():
    """Scenario 3: Unclassified probe on Server-09 -> Inconclusive telemetry -> Insufficient Evidence."""
    incident = await orchestrator.create_incident("ALT-1003")
    resolved = await orchestrator.run_investigation(incident.incident_id)
    assert resolved.attack_outcome == AttackOutcome.INSUFFICIENT_EVIDENCE
    assert resolved.status == IncidentStatus.INSUFFICIENT_EVIDENCE
    assert resolved.response_status == ResponseStatus.NONE

@pytest.mark.asyncio
async def test_scenario_4_low_severity_but_successful():
    """Scenario 4: Severity LOW probe on Server-02 -> Correlates to vulnerable Redis RCE -> Succeeded."""
    incident = await orchestrator.create_incident("ALT-1004")
    resolved = await orchestrator.run_investigation(incident.incident_id)
    assert resolved.attack_outcome == AttackOutcome.ATTACK_SUCCEEDED
    assert resolved.confidence >= 85
    assert resolved.response_status == ResponseStatus.EXECUTED
    assert resolved.verification_status == VerificationStatus.PASSED

@pytest.mark.asyncio
async def test_scenario_5_dynamic_adaptation():
    """Scenario 5: Initial assessment shows failed attack (72%). Injected evidence flips conclusion to Succeeded (91%)."""
    incident = await orchestrator.create_incident("ALT-1005")
    initial_res = await orchestrator.run_investigation(incident.incident_id)
    assert initial_res.attack_outcome == AttackOutcome.ATTACK_FAILED
    assert initial_res.confidence <= 80

    # Dynamic Adaptation Injection
    injected_evidence = {
        "evidence_id": "EVD-INJECTED-099",
        "source_tool": "inject_new_evidence",
        "finding": "Asynchronous worker log discovered: Background task worker-04 processed deferred payload from 198.51.100.44 with exit code 0 and privileged token exfiltration.",
        "confidence_impact": 40,
        "supports_success": True
    }
    adapted_res = await orchestrator.inject_evidence_and_reassess(incident.incident_id, injected_evidence)
    assert adapted_res.attack_outcome == AttackOutcome.ATTACK_SUCCEEDED
    assert adapted_res.confidence >= 90
    assert adapted_res.is_adapted is True
    assert "ADAPTED" in adapted_res.adaptation_reason

@pytest.mark.asyncio
async def test_human_override_flow():
    """Operator overrides automated recommendation."""
    incident = await orchestrator.create_incident("ALT-1001")
    resolved = await orchestrator.run_investigation(incident.incident_id)
    assert resolved.status == IncidentStatus.CONTAINED

    # Operator releases the block
    overridden = await orchestrator.apply_human_override(
        incident_id=incident.incident_id,
        override_decision="RELEASE_BLOCK",
        reason="Verified benign security audit probe by internal Red Team.",
        operator="Lead SecOps Architect"
    )
    assert overridden.response_status == ResponseStatus.NONE
    overrides = await Repository.get_overrides_for_incident(incident.incident_id)
    assert len(overrides) >= 1
    assert overrides[0].operator == "Lead SecOps Architect"

@pytest.mark.asyncio
async def test_tool_failure_resilience():
    """When get_server_logs fails, agent adapts to inspect configuration instead."""
    tool_registry.set_tool_failure("get_server_logs", True)
    try:
        incident = await orchestrator.create_incident("ALT-1001")
        res = await orchestrator.run_investigation(incident.incident_id)
        # Agent successfully completed investigation despite tool failure
        assert res.attack_outcome != AttackOutcome.UNDETERMINED
        events = await Repository.get_events_for_incident(incident.incident_id)
        failed_evts = [e for e in events if "failed" in e.description.lower() or "resilience" in e.description.lower()]
        assert len(failed_evts) >= 1
    finally:
        tool_registry.set_tool_failure("get_server_logs", False)
