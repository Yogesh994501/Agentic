import logging
from typing import Dict, Any, List
from app.llm.base import LLMProvider, LLMStepDecision

logger = logging.getLogger("sentinelflow.llm.mock")

class MockProvider(LLMProvider):
    """Deterministic, genuinely agentic SOC reasoning engine for bulletproof demo & offline execution."""

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
        alert_id = alert_data.get("alert_id", "")
        dest_ip = alert_data.get("destination_ip", "")
        src_ip = alert_data.get("source_ip", "")
        severity = alert_data.get("severity", "MEDIUM")

        # Map destination IP or alert to asset ID
        asset_map = {
            "10.0.10.15": "Server-07",
            "10.0.10.11": "Server-03",
            "10.0.10.19": "Server-09",
            "10.0.10.10": "Server-02",
            "10.0.10.13": "Server-05",
            "10.0.10.9": "Server-01",
            "10.0.10.14": "Server-06"
        }
        target_asset_id = asset_map.get(dest_ip, "Server-07")
        evidence_ids = [e.get("evidence_id") for e in accumulated_evidence if e.get("evidence_id")]

        # Check for newly injected adaptation evidence (Scenario 5)
        injected_ev = [e for e in accumulated_evidence if e.get("source_tool") == "inject_new_evidence" or "EVD-INJECTED" in str(e.get("evidence_id"))]
        if injected_ev:
            inj = injected_ev[0]
            return LLMStepDecision(
                assessment="success",
                confidence=91,
                reason="ADAPTATION TRIGGERED: Injected delayed worker log proves remote payload executed in background with exit code 0 and privileged token exfiltration. Reversing previous assessment.",
                hypothesis="Attack initially appeared ineffective due to 404 on sync probe, but deferred asynchronous worker successfully executed exploit.",
                evidence_ids=evidence_ids,
                missing_evidence=[],
                next_tool=None,
                next_tool_arguments={},
                response_recommended=True,
                recommended_target=src_ip
            )

        # 1. Evidence Gap: Asset Inventory
        if "get_asset" not in executed_tools:
            return LLMStepDecision(
                assessment="investigating",
                confidence=25,
                reason=f"Alert label alone is untrusted. Identified evidence gap: Target asset inventory and network posture for IP {dest_ip}.",
                hypothesis=f"Initial hypothesis: Incoming traffic targeting {dest_ip} requires asset context to verify exposure.",
                evidence_ids=evidence_ids,
                missing_evidence=["Asset hostname, OS, exposure status, and software versions"],
                next_tool="get_asset",
                next_tool_arguments={"asset_id_or_ip": target_asset_id},
                response_recommended=False
            )

        # 2. Evidence Gap: Vulnerability Matching
        if "get_vulnerabilities" not in executed_tools:
            return LLMStepDecision(
                assessment="investigating",
                confidence=45,
                reason=f"Asset identified as {target_asset_id}. Identified evidence gap: Checking synthetic vulnerability database for known CVEs affecting {target_asset_id}.",
                hypothesis=f"Hypothesis updated: Verifying if {target_asset_id} runs software vulnerable to the signature pattern.",
                evidence_ids=evidence_ids,
                missing_evidence=["Known CVEs and exploitability scores for host services"],
                next_tool="get_vulnerabilities",
                next_tool_arguments={"asset_id": target_asset_id},
                response_recommended=False
            )

        # 3. Evidence Gap: Packet Metadata
        if "get_packet_metadata" not in executed_tools:
            return LLMStepDecision(
                assessment="investigating",
                confidence=60,
                reason="Identified evidence gap: Raw alert signature requires payload fingerprint and network flow attributes.",
                hypothesis=f"Hypothesis updated: Analyzing request size, payload fingerprint, and flags to confirm delivery of exploit payload.",
                evidence_ids=evidence_ids,
                missing_evidence=["Packet count, payload fingerprint, TLS ciphers, and connection duration"],
                next_tool="get_packet_metadata",
                next_tool_arguments={"alert_id": alert_id},
                response_recommended=False
            )

        # 4. Evidence Gap: Server Logs (Handling Tool Failure Resilience)
        if "get_server_logs" not in executed_tools:
            if "get_server_logs" in failed_tools:
                # Tool failure resilience! Choose alternative evidence source
                if "get_configuration" not in executed_tools:
                    return LLMStepDecision(
                        assessment="investigating",
                        confidence=65,
                        reason="RESILIENCE ACTIVE: get_server_logs is currently unavailable in sandbox. Pivoting to host security configuration and WAF policy state.",
                        hypothesis="Primary server log source failed. Adapting investigation to inspect host configuration and local firewall rules.",
                        evidence_ids=evidence_ids,
                        missing_evidence=["Security configuration and active firewall state"],
                        next_tool="get_configuration",
                        next_tool_arguments={"asset_id": target_asset_id},
                        response_recommended=False
                    )
            else:
                return LLMStepDecision(
                    assessment="investigating",
                    confidence=70,
                    reason="Identified evidence gap: Determining actual host-level impact via server access and system execution logs.",
                    hypothesis=f"Hypothesis updated: Inspecting HTTP status codes and child process invocations on {target_asset_id}.",
                    evidence_ids=evidence_ids,
                    missing_evidence=["Server HTTP response codes, process execution logs, and DB query traces"],
                    next_tool="get_server_logs",
                    next_tool_arguments={"asset_id": target_asset_id},
                    response_recommended=False
                )

        # 5. Core Decision Engine: Correlate All Gathered Evidence
        findings_text = " ".join([e.get("finding", "") for e in accumulated_evidence]).lower()

        # Check Scenario 1: Confirmed Attack (Server-07 / Apache Struts / HTTP 200 / unauthorized DB)
        if "cve-2023-50164" in findings_text or "upload accepted" in findings_text or ("server-07" in target_asset_id.lower() and "status_code 200" in findings_text):
            return LLMStepDecision(
                assessment="success",
                confidence=93,
                reason="ATTACK SUCCEEDED: Multi-source correlation confirms critical CVE-2023-50164 on Server-07, multipart OGNL payload in packet metadata, and server logs confirming HTTP 200 response with unauthorized DB access. Immediate containment required.",
                hypothesis="Adversary successfully exploited Apache Struts RCE on Server-07 and executed commands as root.",
                evidence_ids=evidence_ids,
                missing_evidence=[],
                next_tool=None,
                next_tool_arguments={},
                response_recommended=True,
                recommended_target=src_ip
            )

        # Check Scenario 2: False Positive (Server-03 / WAF 403 / No CVE)
        if "server-03" in target_asset_id.lower() or "status_code 403" in findings_text or "access denied" in findings_text:
            return LLMStepDecision(
                assessment="failure",
                confidence=88,
                reason="ATTACK FAILED / FALSE POSITIVE: Investigation reveals ModSecurity WAF intercepted and dropped the SQLi payload with HTTP 403. Prisma ORM strictly parameterizes queries, and no anomalous DB calls occurred.",
                hypothesis="Exploit attempt was blocked at the perimeter WAF before reaching backend application layer.",
                evidence_ids=evidence_ids,
                missing_evidence=[],
                next_tool=None,
                next_tool_arguments={},
                response_recommended=False
            )

        # Check Scenario 4: Low Severity but Successful (Server-02 / Redis Command Injection)
        if "server-02" in target_asset_id.lower() or "cve-2023-38035" in findings_text or "lua script executed" in findings_text or "eval" in findings_text:
            return LLMStepDecision(
                assessment="success",
                confidence=89,
                reason="ATTACK SUCCEEDED DESPITE LOW SEVERITY: Alert was classified as LOW priority probe, but correlated host inspection discovered vulnerable Redis instance allowing Lua sandbox escape. Logs confirm privileged token leak.",
                hypothesis="Adversary disguised command injection within keepalive scan traffic and obtained administrative tokens.",
                evidence_ids=evidence_ids,
                missing_evidence=[],
                next_tool=None,
                next_tool_arguments={},
                response_recommended=True,
                recommended_target=src_ip
            )

        # Check Scenario 5 (Before Adaptation): Initially Failed
        if "server-05" in target_asset_id.lower() and not injected_ev:
            return LLMStepDecision(
                assessment="failure",
                confidence=72,
                reason="ATTACK FAILED (PRELIMINARY): Synchronous endpoint probe returned HTTP 404 / 400 Bad Request. Initial telemetry indicates payload was rejected by parameter validation.",
                hypothesis="Exploitation probe appears rejected by input validator; no host-level compromise currently observable.",
                evidence_ids=evidence_ids,
                missing_evidence=["Asynchronous background task logs"],
                next_tool=None,
                next_tool_arguments={},
                response_recommended=False
            )

        # Check Scenario 3: Ambiguous / Insufficient Evidence (Server-09)
        if "server-09" in target_asset_id.lower() or "mtls handshake incomplete" in findings_text:
            return LLMStepDecision(
                assessment="uncertain",
                confidence=54,
                reason="INSUFFICIENT EVIDENCE: Packet telemetry indicates an encrypted TLS 1.3 handshake with no decrypted payload available. Server logs reflect a dropped connection due to missing client certificate with zero persistence or state mutation.",
                hypothesis="Activity is inconclusive; possibly an external misconfigured metric scraper rather than an active exploit.",
                evidence_ids=evidence_ids,
                missing_evidence=["Decrypted application layer stream", "Host process telemetry"],
                next_tool=None,
                next_tool_arguments={},
                response_recommended=False
            )

        # Default fallback
        return LLMStepDecision(
            assessment="uncertain",
            confidence=50,
            reason="Investigation completed available telemetry sources without decisive confirmation.",
            hypothesis="Evidence is balanced between benign anomaly and unconfirmed probe.",
            evidence_ids=evidence_ids,
            missing_evidence=[],
            next_tool=None,
            next_tool_arguments={},
            response_recommended=False
        )
