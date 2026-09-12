import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.database.repository import Repository
from app.models.domain import FirewallRule, ResponseAction, ResponseStatus, VerificationStatus

async def get_alert(alert_id: str) -> Dict[str, Any]:
    """Retrieve simulated alert details by alert_id."""
    alert = await Repository.get_alert(alert_id)
    if not alert:
        return {"error": f"Alert {alert_id} not found in sandbox telemetry."}
    return alert.model_dump()

async def get_packet_metadata(alert_id: str) -> Dict[str, Any]:
    """Retrieve synthetic packet metadata corresponding to an alert (payload fingerprint, sizes, ports, protocol)."""
    meta = await Repository.get_packet_metadata(alert_id)
    if not meta:
        return {"error": f"No packet metadata found for alert {alert_id}."}
    return meta.model_dump()

async def get_asset(asset_id_or_ip: str) -> Dict[str, Any]:
    """Retrieve asset inventory information by asset_id (e.g. Server-07) or IP (e.g. 10.0.10.15)."""
    asset = await Repository.get_asset(asset_id_or_ip)
    if not asset:
        return {"error": f"Asset {asset_id_or_ip} not found in corporate inventory."}
    return asset.model_dump()

async def get_vulnerabilities(asset_id: str) -> Dict[str, Any]:
    """Retrieve synthetic CVE matches for an asset."""
    vulns = await Repository.get_vulnerabilities_for_asset(asset_id)
    return {
        "asset_id": asset_id,
        "vulnerabilities": [v.model_dump() for v in vulns],
        "count": len(vulns)
    }

async def get_server_logs(asset_id: str, time_window: Optional[str] = None) -> Dict[str, Any]:
    """Retrieve recent synthetic server access and system logs for an asset."""
    logs = await Repository.get_logs_for_asset(asset_id, limit=20)
    return {
        "asset_id": asset_id,
        "logs": [l.model_dump() for l in logs],
        "count": len(logs)
    }

async def get_configuration(asset_id: str) -> Dict[str, Any]:
    """Retrieve exposed services, auth state, firewall, and application security config for an asset."""
    cfg = await Repository.get_configuration(asset_id)
    if not cfg:
        return {
            "asset_id": asset_id,
            "exposed_services": ["Standard Ports"],
            "authentication_state": "Default",
            "security_configuration": {},
            "simulated_firewall_state": {},
            "application_configuration": {}
        }
    return cfg.model_dump()

async def get_previous_responses(asset_id: str) -> Dict[str, Any]:
    """Retrieve previous simulated containment actions for an asset."""
    actions = await Repository.get_response_actions()
    relevant = [a.model_dump() for a in actions if a.details.get("asset_id") == asset_id]
    return {
        "asset_id": asset_id,
        "previous_responses": relevant,
        "count": len(relevant)
    }

async def block_ip_simulated(ip: str, reason: str, incident_id: Optional[str] = None) -> Dict[str, Any]:
    """Simulates adding an active firewall block rule for an IP in the sandbox database."""
    rule_id = f"RULE-{uuid.uuid4().hex[:8].upper()}"
    action_id = f"ACT-{uuid.uuid4().hex[:8].upper()}"
    
    rule = FirewallRule(
        rule_id=rule_id,
        ip=ip,
        action="BLOCK",
        enabled=True,
        reason=reason
    )
    await Repository.add_firewall_rule(rule)
    
    # Record response action in database
    action = ResponseAction(
        action_id=action_id,
        incident_id=incident_id or "INC-SANDBOX",
        action_type="FIREWALL_BLOCK_IP",
        target=ip,
        reason=reason,
        simulated=True,
        status=ResponseStatus.EXECUTED,
        verification=VerificationStatus.PASSED,
        details={"rule_id": rule_id, "ip": ip}
    )
    await Repository.record_response_action(action)
    
    # Audit log
    await Repository.log_audit(
        category="RESPONSE",
        action="BLOCK_IP_SIMULATED",
        actor="SentinelFlowAgent",
        details={"ip": ip, "reason": reason, "rule_id": rule_id, "action_id": action_id}
    )

    return {
        "success": True,
        "simulated": True,
        "action_id": action_id,
        "rule_id": rule_id,
        "target_ip": ip,
        "status": "RULE_APPLIED_IN_SANDBOX",
        "message": f"Simulated firewall rule applied: Inbound traffic from {ip} is now blocked."
    }

async def verify_block(ip: str) -> Dict[str, Any]:
    """Verifies whether an IP is currently blocked by querying the simulated sandbox firewall state."""
    rule = await Repository.get_firewall_rule(ip)
    is_blocked = (rule is not None and rule.enabled)
    
    return {
        "target_ip": ip,
        "blocked": is_blocked,
        "status": "VERIFICATION_PASSED" if is_blocked else "VERIFICATION_FAILED",
        "rule_details": rule.model_dump() if rule else None,
        "message": f"Sandbox verification confirms traffic from {ip} is {'BLOCKED' if is_blocked else 'ALLOWED'}."
    }

async def get_environment_state() -> Dict[str, Any]:
    """Return the entire simulated sandbox state."""
    from app.sandbox.state import SandboxManager
    return await SandboxManager.get_state()

async def inject_new_evidence(incident_id: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
    """Developer/demo tool: Injects new or delayed evidence into an existing incident to test agent adaptation."""
    from app.models.domain import EvidenceItem
    incident = await Repository.get_incident(incident_id)
    if not incident:
        return {"error": f"Incident {incident_id} not found."}
        
    ev_item = EvidenceItem(
        evidence_id=evidence.get("evidence_id", f"EVD-INJ-{uuid.uuid4().hex[:6]}"),
        source_tool=evidence.get("source_tool", "inject_new_evidence"),
        finding=evidence.get("finding", "Injected telemetric evidence."),
        data=evidence.get("data", {}),
        confidence_impact=evidence.get("confidence_impact", 20),
        supports_success=evidence.get("supports_success", True)
    )
    incident.evidence.append(ev_item)
    await Repository.save_incident(incident)
    return {
        "success": True,
        "incident_id": incident_id,
        "injected_evidence": ev_item.model_dump(),
        "message": "New evidence successfully registered in sandbox incident store."
    }
