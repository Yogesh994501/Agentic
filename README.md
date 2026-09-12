# SentinelFlow — Autonomous SOC Investigation & Response Agent

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://yogesh994501.github.io/Agentic/)
[![Python 3.13](https://img.shields.io/badge/python-3.13-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com/)
[![Pytest](https://img.shields.io/badge/Tests-18%2F18%20Passed-success.svg)](https://github.com/Yogesh994501/Agentic)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **"SentinelFlow does not blindly trust security alerts. It investigates. It decides what evidence it needs. It correlates multiple sources. It determines whether an attack actually succeeded. It takes a controlled response. It verifies the result. And when new evidence appears, it can change its mind."**

🌐 **Experience the Live Web Console**: [https://yogesh994501.github.io/Agentic/](https://yogesh994501.github.io/Agentic/)

---

## Visual Preview

### 1. SentinelFlow Command Console
![SentinelFlow SOC Dashboard](docs/screenshots/dashboard.png)
*Figure 1: Autonomous SOC console showing real-time agent status, 5 demonstration scenarios, multi-source evidence correlation, confidence gauge, and interactive controls.*

### 2. Autonomous Investigation, Containment & Verification
![Scenario 1 Contained](docs/screenshots/scenario1_contained.png)
*Figure 2: Correlating Apache Struts RCE on Server-07 resulting in 93% breach confidence, automated simulated firewall block on 198.51.100.23, and passed verification.*

---

## 1. Project Overview & Problem Statement

Modern Security Operations Centers (SOCs) face an alert fatigue crisis. NIDS, Suricata, and SIEM sensors generate tens of thousands of alerts daily. Over 80% of these alerts are false positives, harmless scans, or attacks dropped by perimeter controls.

Existing AI security solutions attempt a naive linear approach:
$$\text{Alert} \longrightarrow \text{LLM} \longrightarrow \text{Static Summary}$$

This approach fails because:
1. **Alert signatures are deceptive**: A signature labeled "HIGH" may have been rejected by the web server (HTTP 403), while a "LOW" ping sweep might secretly exploit an unpatched Redis instance.
2. **Context is fragmented**: Proving an intrusion requires correlating network packets, asset inventory, CVEs, application configs, and host execution logs.
3. **Linear scripts cannot adapt**: When new forensic evidence appears, static playbooks fail to re-evaluate prior conclusions.

**SentinelFlow** solves this through **autonomous, non-linear agentic reasoning**. It identifies evidence gaps, queries sandboxed tools dynamically, determines true breach success, executes simulated containment, verifies host state changes, and adapts its conclusions when contradictory evidence emerges.

---

## 2. Architecture & Agent Loop

```mermaid
graph TD
    A[Simulated NIDS / Suricata Alert] --> B[Agent Orchestrator]
    B --> C[Hypothesis Formulation]
    C --> D[Evidence-Gap Analysis]
    D -->|Select Next Tool| E[Safe Tool Registry]
    E -->|Fetch| F[Asset Inventory]
    E -->|Fetch| G[Vulnerabilities / CVE KB]
    E -->|Fetch| H[Packet Metadata & Fingerprint]
    E -->|Fetch| I[Server Logs & Syscalls]
    E -->|Fetch| J[Host Configuration]
    F & G & H & I & J --> K[Evidence Correlation & Scorer]
    K --> L{Is Evidence Sufficient?}
    L -->|No| D
    L -->|Yes| M[Decision Engine]
    M -->|ATTACK_SUCCEEDED >= 80%| N[Simulated Firewall Block]
    N --> O[Post-Action Environment Verification]
    M -->|ATTACK_FAILED / 403| P[Classify False Positive]
    M -->|Inconclusive Telemetry| Q[Refuse Binary Decision]
    R[Delayed / Contradictory Evidence] -->|inject_new_evidence| S[Reassessment Engine]
    S -->|Reopen & Update Conclusion| M
    T[Human Operator Override] -->|Approve/Reject/Force| N
```

### The Autonomous Investigation Loop
```
while incident_not_resolved:
    observe()
    assess_current_evidence()
    identify_missing_evidence()
    if evidence_is_sufficient:
        determine_attack_outcome()
    else:
        select_best_next_tool()
        execute_sandbox_tool()
        validate_tool_result()
        add_evidence()
        update_hypothesis()
    if response_is_justified:
        execute_simulated_response()
        verify_response()
        update_conclusion()
    if human_override_exists:
        apply_override()
    if new_evidence_arrives:
        reconsider_previous_conclusion()
```

---

## 3. Sandboxed Safe Tools

SentinelFlow tools **NEVER interact with real networks or host operating systems**. All actions operate on synthetic MongoDB collections and sandbox state:

- `get_alert(alert_id)`: Retrieves simulated alert telemetry.
- `get_packet_metadata(alert_id)`: Returns synthetic packet counts, payload fingerprints, and sizes.
- `get_asset(asset_id_or_ip)`: Resolves hostnames, OS, criticality, and network zone.
- `get_vulnerabilities(asset_id)`: Queries synthetic CVE database for matching vulnerabilities.
- `get_server_logs(asset_id)`: Retrieves access logs, system calls, and database query traces.
- `get_configuration(asset_id)`: Inspects WAF policies, exposed ports, and TLS configs.
- `block_ip_simulated(ip, reason)`: Safely updates the sandbox `firewall_rules` collection.
- `verify_block(ip)`: Verifies whether the simulated firewall currently drops traffic from the IP.
- `inject_new_evidence(incident_id, evidence)`: Developer/demo tool allowing the UI to simulate delayed asynchronous evidence arriving.

---

## 4. Five Demonstration Scenarios

| # | Scenario | Alert | Target | Expected Outcome | Demonstrates |
| :- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Confirmed Exploitation** | Apache Struts OGNL (HIGH) | Server-07 | `ATTACK_SUCCEEDED` (93%) | Multi-source correlation: vulnerable host + matching CVE + HTTP 200 execution $\rightarrow$ Simulated block & verification. |
| **2** | **False Positive** | SQL Injection in URI (HIGH) | Server-03 | `ATTACK_FAILED` (88%) | Dropped by WAF (HTTP 403); zero host compromise; prevents alert fatigue. |
| **3** | **Ambiguous Activity** | TLS Tunneling Probe (MED) | Server-09 | `INSUFFICIENT_EVIDENCE` (54%) | Refuses forced binary hallucination when data is inconclusive. |
| **4** | **Low Severity but Successful** | Routine Keepalive Probe (LOW) | Server-02 | `ATTACK_SUCCEEDED` (89%) | Demonstrates the agent does not blindly trust severity labels; detects Redis Lua RCE. |
| **5** | **Dynamic Adaptation** | Async Header Injection (MED) | Server-05 | Initial: `FAILED` (72%) $\rightarrow$ Updated: `SUCCEEDED` (91%) | **Centerpiece Demo**: Delayed worker log injected; agent reopens case, adapts hypothesis, and reverses conclusion. |

---

## 5. Resilience & Security

1. **Tool Allowlisting**: The `ToolRegistry` enforces an allowlist. Unknown or arbitrary tool calls generated by LLMs are strictly rejected.
2. **Tool Failure Resilience**: Toggle `get_server_logs` offline via the UI. The agent detects the failure, avoids hallucination, and pivots to host configuration and local policies.
3. **No External Code Execution**: The LLM outputs structured JSON schemas, never raw bash/python commands.
4. **Dual Database Architecture**: Real MongoDB support via `motor`, with an automated in-memory sandbox fallback if MongoDB is not installed locally.

---

## 6. Quick Start & Installation

### Option A: Live GitHub Pages Demo (Instant, Zero Install)
Open your browser to:
👉 **[https://yogesh994501.github.io/Agentic/](https://yogesh994501.github.io/Agentic/)**

*(Features an embedded client-side simulation engine so the entire interactive SOC console, scenarios, firewall rules, and adaptation work directly in your browser!)*

### Option B: 1-Click Startup (Windows)
Double-click `start.bat` in the project root:
```cmd
start.bat
```

### Option C: Docker Compose
```bash
docker compose up --build
```

### Option D: Manual Local Setup
#### 1. Backend Setup
```bash
cd backend
py -3.13 -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python -m app.simulation.seed
.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 7. Automated Test Suite

Run the full pytest suite (18 tests covering all scenarios, tools, adaptation, resilience, and API endpoints):
```bash
cd backend
.venv\Scripts\python -m pytest tests -v
```

```
============================= test session starts =============================
platform win32 -- Python 3.13.5, pytest-9.1.1
rootdir: C:\Users\yy003\.gemini\antigravity-ide\scratch\sentinelflow\backend
configfile: pytest.ini

tests/test_api.py::test_api_health PASSED                                [  5%]
tests/test_api.py::test_api_list_scenarios_and_launch PASSED             [ 11%]
tests/test_api.py::test_api_get_sandbox_state PASSED                     [ 16%]
tests/test_api.py::test_api_tools_list_and_failure_toggle PASSED         [ 22%]
tests/test_scenarios.py::test_scenario_1_confirmed_attack PASSED         [ 27%]
tests/test_scenarios.py::test_scenario_2_false_positive PASSED           [ 33%]
tests/test_scenarios.py::test_scenario_3_ambiguous PASSED                [ 38%]
tests/test_scenarios.py::test_scenario_4_low_severity_but_successful PASSED [ 44%]
tests/test_scenarios.py::test_scenario_5_dynamic_adaptation PASSED       [ 50%]
tests/test_scenarios.py::test_human_override_flow PASSED                 [ 55%]
tests/test_scenarios.py::test_tool_failure_resilience PASSED             [ 61%]
tests/test_tools.py::test_get_alert PASSED                               [ 66%]
tests/test_tools.py::test_get_asset PASSED                               [ 72%]
tests/test_tools.py::test_get_vulnerabilities PASSED                     [ 77%]
tests/test_tools.py::test_get_packet_metadata PASSED                     [ 83%]
tests/test_tools.py::test_get_server_logs PASSED                         [ 88%]
tests/test_tools.py::test_simulated_firewall_block_and_verify PASSED     [ 94%]
tests/test_tools.py::test_tool_registry_security_and_failure_toggle PASSED [100%]

============================= 18 passed in 45.28s =============================
```

---

## 8. Presentation & Documentation Guides
For judges, architects, and hackathon presentation:
- [docs/architecture.md](docs/architecture.md): Complete architecture specification and Mermaid diagram.
- [docs/demo-script.md](docs/demo-script.md): 3-minute presentation script demonstrating investigation, containment, and dynamic adaptation.
- [docs/technical-overview.md](docs/technical-overview.md): Mathematical correlation scoring model and API specs.

---

## 9. License & Disclaimer
This project is an educational and synthetic cybersecurity simulation. It contains **no real malware, no real exploit code, and performs no real network scanning or host firewall modification**. All actions are strictly contained inside the synthetic sandbox environment.
