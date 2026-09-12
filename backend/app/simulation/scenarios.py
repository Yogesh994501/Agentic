from typing import Dict, Any, List

SCENARIOS: Dict[str, Dict[str, Any]] = {
    "scenario_1": {
        "scenario_id": "scenario_1",
        "name": "Scenario 1 — Confirmed Exploitation",
        "description": "High severity alert on Server-07. Multi-source correlation reveals matching CVE, abnormal packet payload, and HTTP 200 server log with unauthorized DB access.",
        "alert_id": "ALT-1001",
        "target_asset": "Server-07",
        "expected_outcome": "ATTACK_SUCCEEDED",
        "expected_confidence_min": 85,
        "recommend_block": True,
        "demonstrates": "Multi-source evidence correlation confirming high-confidence breach and automated containment."
    },
    "scenario_2": {
        "scenario_id": "scenario_2",
        "name": "Scenario 2 — False Positive",
        "description": "Alert flags SQL Injection on Server-03. Investigation shows WAF blocked request (HTTP 403), no CVE exists, and database was uncontacted.",
        "alert_id": "ALT-1002",
        "target_asset": "Server-03",
        "expected_outcome": "ATTACK_FAILED",
        "expected_confidence_min": 80,
        "recommend_block": False,
        "demonstrates": "Preventing alert fatigue and false positives by verifying actual host-level impact."
    },
    "scenario_3": {
        "scenario_id": "scenario_3",
        "name": "Scenario 3 — Ambiguous / Insufficient Evidence",
        "description": "Anomalous connection detected on Server-09. Packet metadata shows encrypted payload and server logs show closed connection with zero state changes.",
        "alert_id": "ALT-1003",
        "target_asset": "Server-09",
        "expected_outcome": "INSUFFICIENT_EVIDENCE",
        "expected_confidence_min": 50,
        "recommend_block": False,
        "demonstrates": "Refusal to hallucinate binary verdicts when evidence is inconclusive."
    },
    "scenario_4": {
        "scenario_id": "scenario_4",
        "name": "Scenario 4 — Low Severity Alert but High Impact",
        "description": "Alert severity is marked LOW ('Routine Probe'). However, correlated asset has unpatched RCE vulnerability and server logs show successful privileged command execution.",
        "alert_id": "ALT-1004",
        "target_asset": "Server-02",
        "expected_outcome": "ATTACK_SUCCEEDED",
        "expected_confidence_min": 85,
        "recommend_block": True,
        "demonstrates": "Independent verification that exposes critical attacks masked by misleading low-priority labels."
    },
    "scenario_5": {
        "scenario_id": "scenario_5",
        "name": "Scenario 5 — Dynamic Adaptation via New Evidence",
        "description": "Initial logs show HTTP 404 (Attack Failed, 72%). Live injection of delayed asynchronous server-side worker log triggers autonomous re-evaluation, flipping verdict to SUCCEEDED (91%).",
        "alert_id": "ALT-1005",
        "target_asset": "Server-05",
        "expected_outcome": "ATTACK_SUCCEEDED",
        "expected_confidence_min": 90,
        "recommend_block": True,
        "adaptation_evidence": {
            "evidence_id": "EVD-INJECTED-099",
            "source_tool": "inject_new_evidence",
            "finding": "Asynchronous worker log discovered: Background task worker-04 processed deferred payload from 198.51.100.44 with exit code 0 and privileged token exfiltration.",
            "confidence_impact": 40,
            "supports_success": True
        },
        "demonstrates": "Non-linear agent adaptability: reopening closed assessments when conflicting evidence arrives."
    }
}
