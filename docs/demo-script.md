# SentinelFlow — 3-Minute Hackathon Demo Script

## The Hook (15 Seconds)
> "In a traditional SOC, analysts are overwhelmed by thousands of alert labels. Most security tools simply take an alert, send it to an LLM, and output a summary. But SentinelFlow doesn't blindly trust alert labels. It investigates, retrieves proof, tests host impact, takes a safe containment action, verifies the outcome, and — most importantly — changes its mind when new evidence emerges."

---

## Step 1: Ingest & Correlate Confirmed Attack (Scenario 1) — 45 Seconds
1. In the **Simulation Control Center**, point out the 5 pre-configured scenarios.
2. Click **Scenario 1 — Confirmed Exploitation**.
3. Point out the live agent timeline as it pulses:
   - `OBSERVE`: Alert `ALT-1001` reports Apache Struts RCE targeting `Server-07`.
   - `PLAN`: Agent notices it lacks asset exposure data.
   - `TOOL`: Calls `get_asset("Server-07")` -> Discovers host is externally reachable in the DMZ.
   - `TOOL`: Calls `get_vulnerabilities("Server-07")` -> Correlates matching CVE-2023-50164.
   - `TOOL`: Calls `get_packet_metadata("ALT-1001")` -> Discovers OGNL injection payload fingerprint.
   - `TOOL`: Calls `get_server_logs("Server-07")` -> Finds HTTP 200 execution and unauthorized DB access.
   - `DECIDE`: Verdict updates to **ATTACK SUCCEEDED (93%)**.
   - `ACTION`: Executes simulated firewall block on attacker IP `198.51.100.23`.
   - `VERIFY`: Verifies sandbox state -> **VERIFICATION: PASSED**.

---

## Step 2: Show Why Severity Labels Lie (Scenario 4 or Scenario 2) — 30 Seconds
1. Click **Scenario 4 — Low Severity but Successful**.
2. Click **START INVESTIGATION**.
3. Note to judges:
   - "Notice the alert severity is marked **LOW** ('Routine Probe'). Many SIEMs would ignore this."
   - "SentinelFlow inspects the asset, finds a Redis Lua sandbox escape vulnerability, and identifies that administrative tokens were leaked in the logs."
   - "The agent elevates the outcome to **ATTACK SUCCEEDED (89%)** and enforces containment. It never trusts the label alone."

---

## Step 3: Dynamic Adaptation (Scenario 5) — The Highlight (45 Seconds)
1. Click **Scenario 5 — Dynamic Adaptation via New Evidence**.
2. Click **START INVESTIGATION**.
3. The initial probe returns HTTP 404.
   - Initial Assessment: **ATTACK FAILED / FALSE POSITIVE (72%)**.
4. Now click **INJECT EVIDENCE**.
   - In the modal, select the preset: *"Asynchronous worker log discovered: Background task worker-04 processed deferred payload from 198.51.100.44 with exit code 0 and privileged token exfiltration."*
   - Click **INJECT & TRIGGER REASSESSMENT**.
5. Watch the screen update:
   - Purple **Autonomous Dynamic Adaptation Triggered** banner appears.
   - The timeline logs: `NEW EVIDENCE ARRIVED` -> `ADAPT` -> Re-evaluating.
   - The verdict flips in real-time from **FAILED (72%)** to **SUCCEEDED (91%)**.
   - The agent automatically triggers containment and verifies the block.

---

## Step 4: Tool Failure Resilience & Human Override — 30 Seconds
1. Toggle **Tool Failure Resilience** in the control center (`get_server_logs OFFLINE`).
2. Run an investigation: demonstrate that the agent gracefully handles the `TOOL_UNAVAILABLE` error and pivots to host configuration rather than crashing or hallucinating.
3. Click **HUMAN OVERRIDE**: demonstrate that an operator can approve, reject, or release blocks, and that the override is preserved in the audit log.

---

## Concluding Statement (15 Seconds)
> "SentinelFlow demonstrates true agentic autonomy: hypothesis formulation, multi-source evidence correlation, closed-loop simulated response, post-action verification, and non-linear dynamic adaptation."
