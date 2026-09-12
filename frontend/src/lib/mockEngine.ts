import { Incident, Alert, Asset, SandboxState, Scenario, AgentEvent, FirewallRule } from './types';

export const INITIAL_SCENARIOS: Record<string, Scenario> = {
  scenario_1: {
    scenario_id: 'scenario_1',
    name: 'Scenario 1 — Confirmed Exploitation',
    description: 'High severity alert on Server-07. Multi-source correlation reveals matching CVE, abnormal packet payload, and HTTP 200 server log with unauthorized DB access.',
    alert_id: 'ALT-1001',
    target_asset: 'Server-07',
    expected_outcome: 'ATTACK_SUCCEEDED',
    expected_confidence_min: 85,
    recommend_block: true,
    demonstrates: 'Multi-source evidence correlation confirming high-confidence breach and automated containment.'
  },
  scenario_2: {
    scenario_id: 'scenario_2',
    name: 'Scenario 2 — False Positive',
    description: 'Alert flags SQL Injection on Server-03. Investigation shows WAF blocked request (HTTP 403), no CVE exists, and database was uncontacted.',
    alert_id: 'ALT-1002',
    target_asset: 'Server-03',
    expected_outcome: 'ATTACK_FAILED',
    expected_confidence_min: 80,
    recommend_block: false,
    demonstrates: 'Preventing alert fatigue and false positives by verifying actual host-level impact.'
  },
  scenario_3: {
    scenario_id: 'scenario_3',
    name: 'Scenario 3 — Ambiguous / Insufficient Evidence',
    description: 'Anomalous connection detected on Server-09. Packet metadata shows encrypted payload and server logs show closed connection with zero state changes.',
    alert_id: 'ALT-1003',
    target_asset: 'Server-09',
    expected_outcome: 'INSUFFICIENT_EVIDENCE',
    expected_confidence_min: 50,
    recommend_block: false,
    demonstrates: 'Refusal to hallucinate binary verdicts when evidence is inconclusive.'
  },
  scenario_4: {
    scenario_id: 'scenario_4',
    name: 'Scenario 4 — Low Severity Alert but High Impact',
    description: 'Alert severity is marked LOW ("Routine Probe"). However, correlated asset has unpatched RCE vulnerability and server logs show successful privileged command execution.',
    alert_id: 'ALT-1004',
    target_asset: 'Server-02',
    expected_outcome: 'ATTACK_SUCCEEDED',
    expected_confidence_min: 85,
    recommend_block: true,
    demonstrates: 'Independent verification that exposes critical attacks masked by misleading low-priority labels.'
  },
  scenario_5: {
    scenario_id: 'scenario_5',
    name: 'Scenario 5 — Dynamic Adaptation via New Evidence',
    description: 'Initial logs show HTTP 404 (Attack Failed, 72%). Live injection of delayed asynchronous server-side worker log triggers autonomous re-evaluation, flipping verdict to SUCCEEDED (91%).',
    alert_id: 'ALT-1005',
    target_asset: 'Server-05',
    expected_outcome: 'ATTACK_SUCCEEDED',
    expected_confidence_min: 90,
    recommend_block: true,
    demonstrates: 'Non-linear agent adaptability: reopening closed assessments when conflicting evidence arrives.'
  }
};

export const INITIAL_ALERTS: Alert[] = [
  {
    alert_id: 'ALT-1001',
    source: 'SURICATA',
    timestamp: new Date().toISOString(),
    signature: 'ET EXPLOIT Apache Struts RCE (CVE-2023-50164) Multipart OGNL Injection',
    severity: 'HIGH',
    source_ip: '198.51.100.23',
    destination_ip: '10.0.10.15',
    destination_port: 443,
    protocol: 'HTTPS',
    metadata: { category: 'Web Application Attack' }
  },
  {
    alert_id: 'ALT-1002',
    source: 'SURICATA',
    timestamp: new Date().toISOString(),
    signature: 'ET WEB_SERVER Possible SQL Injection Attempt UNION SELECT in URI',
    severity: 'HIGH',
    source_ip: '203.0.113.88',
    destination_ip: '10.0.10.11',
    destination_port: 443,
    protocol: 'HTTPS',
    metadata: { category: 'Web Application Attack' }
  },
  {
    alert_id: 'ALT-1003',
    source: 'SNORT',
    timestamp: new Date().toISOString(),
    signature: 'SNORT-COMM Potential TLS Tunneling / Unclassified High Port Beaconing',
    severity: 'MEDIUM',
    source_ip: '192.0.2.140',
    destination_ip: '10.0.10.19',
    destination_port: 9090,
    protocol: 'TCP',
    metadata: { category: 'Network Anomaly' }
  },
  {
    alert_id: 'ALT-1004',
    source: 'SURICATA',
    timestamp: new Date().toISOString(),
    signature: 'GPL SCAN Low Priority Suspicious Port Probe / Keepalive Scan',
    severity: 'LOW',
    source_ip: '185.220.101.5',
    destination_ip: '10.0.10.10',
    destination_port: 6379,
    protocol: 'TCP',
    metadata: { category: 'Network Reconnaissance' }
  },
  {
    alert_id: 'ALT-1005',
    source: 'SURICATA',
    timestamp: new Date().toISOString(),
    signature: 'ET WEB_SPECIFIC Potential Deserialization Header Injection / Async Exec',
    severity: 'MEDIUM',
    source_ip: '198.51.100.44',
    destination_ip: '10.0.10.13',
    destination_port: 8000,
    protocol: 'HTTP',
    metadata: { category: 'Exploit Attempt' }
  }
];

class ClientSimulationEngine {
  private listeners: ((event: AgentEvent) => void)[] = [];
  public incidents: Incident[] = [];
  public events: AgentEvent[] = [];
  public firewallRules: FirewallRule[] = [];
  public toolFailures: Record<string, boolean> = {};

  constructor() {
    this.reset();
  }

  reset() {
    this.events = [];
    this.firewallRules = [];
    this.toolFailures = {};
    const baseAlert = INITIAL_ALERTS[0];
    this.incidents = [
      {
        incident_id: 'INC-1001',
        alert_id: baseAlert.alert_id,
        status: 'NEW',
        severity: baseAlert.severity,
        current_hypothesis: `Suspicious activity (${baseAlert.signature}) reported targeting 10.0.10.15. Ingesting host posture.`,
        attack_outcome: 'UNDETERMINED',
        confidence: 10,
        evidence: [],
        reasoning_summary: 'Incident initialized. Ready for autonomous multi-source correlation.',
        recommended_action: undefined,
        response_status: 'NONE',
        verification_status: 'NOT_VERIFIED',
        is_adapted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  onEvent(cb: (event: AgentEvent) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private emit(event: AgentEvent) {
    this.events.push(event);
    this.listeners.forEach((cb) => cb(event));
  }

  async runScenario(scenarioId: string): Promise<string> {
    const sc = INITIAL_SCENARIOS[scenarioId] || INITIAL_SCENARIOS.scenario_1;
    const alert = INITIAL_ALERTS.find((a) => a.alert_id === sc.alert_id) || INITIAL_ALERTS[0];
    const incId = `INC-${alert.alert_id.replace('ALT-', '')}`;

    let inc = this.incidents.find((i) => i.incident_id === incId);
    if (!inc) {
      inc = {
        incident_id: incId,
        alert_id: alert.alert_id,
        status: 'NEW',
        severity: alert.severity,
        current_hypothesis: `Alert signature: ${alert.signature}. Analyzing target ${alert.destination_ip}.`,
        attack_outcome: 'UNDETERMINED',
        confidence: 15,
        evidence: [],
        reasoning_summary: 'Commencing investigation.',
        response_status: 'NONE',
        verification_status: 'NOT_VERIFIED',
        is_adapted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.incidents.unshift(inc);
    }

    inc.status = 'INVESTIGATING';
    inc.evidence = [];

    // Step 1: OBSERVE
    this.emit({
      event_id: `EVT-${Date.now()}-1`,
      timestamp: new Date().toISOString(),
      incident_id: incId,
      event_type: 'OBSERVE',
      description: `Alert ingested: ${alert.signature} (${alert.severity}) from ${alert.source_ip} to ${alert.destination_ip}:${alert.destination_port}`,
      confidence: 15,
      source: 'SentinelFlowAgent'
    });

    await new Promise((r) => setTimeout(r, 400));

    // Step 2: PLAN
    this.emit({
      event_id: `EVT-${Date.now()}-2`,
      timestamp: new Date().toISOString(),
      incident_id: incId,
      event_type: 'PLAN',
      description: `Evidence gap detected: Asset inventory and exposure posture for ${alert.destination_ip}. Selecting tool 'get_asset'.`,
      tool: 'get_asset',
      confidence: 25,
      source: 'SentinelFlowAgent'
    });

    await new Promise((r) => setTimeout(r, 400));

    // Step 3: TOOL_CALL & EVIDENCE (get_asset)
    const evAsset = {
      evidence_id: 'EVD-001',
      source_tool: 'get_asset',
      timestamp: new Date().toISOString(),
      finding: `Host '${sc.target_asset}' is externally exposed in DMZ running vulnerable services.`,
      data: { asset_id: sc.target_asset, ip: alert.destination_ip },
      confidence_impact: 15,
      supports_success: true
    };
    inc.evidence.push(evAsset);
    this.emit({
      event_id: `EVT-${Date.now()}-3`,
      timestamp: new Date().toISOString(),
      incident_id: incId,
      event_type: 'EVIDENCE',
      description: `Evidence retrieved [${evAsset.evidence_id}]: ${evAsset.finding} (+15 confidence)`,
      tool: 'get_asset',
      confidence: 40,
      source: 'SentinelFlowAgent'
    });

    await new Promise((r) => setTimeout(r, 400));

    // Step 4: Vulnerabilities
    if (sc.scenario_id !== 'scenario_2' && sc.scenario_id !== 'scenario_3') {
      const cveId = sc.scenario_id === 'scenario_4' ? 'CVE-2023-38035' : 'CVE-2023-50164';
      const evVuln = {
        evidence_id: 'EVD-002',
        source_tool: 'get_vulnerabilities',
        timestamp: new Date().toISOString(),
        finding: `Found known CVE (${cveId}) matching host software stack. High exploitability.`,
        data: { cve_id: cveId },
        confidence_impact: 20,
        supports_success: true
      };
      inc.evidence.push(evVuln);
      this.emit({
        event_id: `EVT-${Date.now()}-4`,
        timestamp: new Date().toISOString(),
        incident_id: incId,
        event_type: 'EVIDENCE',
        description: `Evidence retrieved [${evVuln.evidence_id}]: ${evVuln.finding} (+20 confidence)`,
        tool: 'get_vulnerabilities',
        confidence: 60,
        source: 'SentinelFlowAgent'
      });
      await new Promise((r) => setTimeout(r, 400));
    }

    // Step 5: Server Logs & Impact
    if (this.toolFailures['get_server_logs']) {
      // Tool Failure Simulation
      this.emit({
        event_id: `EVT-${Date.now()}-fail`,
        timestamp: new Date().toISOString(),
        incident_id: incId,
        event_type: 'TOOL_RESULT',
        description: `Tool 'get_server_logs' failed: Simulated sandbox disruption. Agent pivoting to host configuration policy.`,
        tool: 'get_server_logs',
        confidence: 60,
        source: 'SentinelFlowAgent'
      });
      await new Promise((r) => setTimeout(r, 400));
    } else {
      let logFinding = 'Server logs confirm HTTP 200 response with root process execution and unauthorized DB access.';
      let isSuccess = true;
      let impact = 35;

      if (sc.scenario_id === 'scenario_2') {
        logFinding = 'Server logs show ModSecurity WAF dropped request with HTTP 403 Forbidden. No backend DB access.';
        isSuccess = false;
        impact = -35;
      } else if (sc.scenario_id === 'scenario_3') {
        logFinding = 'Server logs show incomplete mTLS handshake; connection reset by peer with zero persistence.';
        isSuccess = false;
        impact = -10;
      } else if (sc.scenario_id === 'scenario_5') {
        logFinding = 'Initial synchronous probe returned HTTP 404 / 400. Preliminary analysis shows payload dropped.';
        isSuccess = false;
        impact = -20;
      }

      const evLog = {
        evidence_id: 'EVD-003',
        source_tool: 'get_server_logs',
        timestamp: new Date().toISOString(),
        finding: logFinding,
        data: {},
        confidence_impact: impact,
        supports_success: isSuccess
      };
      inc.evidence.push(evLog);
      this.emit({
        event_id: `EVT-${Date.now()}-5`,
        timestamp: new Date().toISOString(),
        incident_id: incId,
        event_type: 'EVIDENCE',
        description: `Evidence retrieved [${evLog.evidence_id}]: ${evLog.finding}`,
        tool: 'get_server_logs',
        confidence: isSuccess ? 85 : 70,
        source: 'SentinelFlowAgent'
      });
      await new Promise((r) => setTimeout(r, 400));
    }

    // Step 6: Final Outcome
    if (sc.scenario_id === 'scenario_1' || sc.scenario_id === 'scenario_4') {
      inc.attack_outcome = 'ATTACK_SUCCEEDED';
      inc.confidence = sc.scenario_id === 'scenario_1' ? 93 : 89;
      inc.status = 'CONTAINED';
      inc.reasoning_summary = `ATTACK SUCCEEDED: Multi-source correlation confirms matching CVE, payload fingerprint, and host-level execution on ${sc.target_asset}.`;
      inc.recommended_action = `Simulate firewall block on ${alert.source_ip}`;
      inc.response_status = 'EXECUTED';
      inc.verification_status = 'PASSED';

      this.emit({
        event_id: `EVT-${Date.now()}-6`,
        timestamp: new Date().toISOString(),
        incident_id: incId,
        event_type: 'DECISION',
        description: `Assessment: ATTACK SUCCEEDED (${inc.confidence}%). Immediate simulated containment justified.`,
        confidence: inc.confidence,
        source: 'SentinelFlowAgent'
      });

      // Add firewall rule
      this.firewallRules.push({
        rule_id: `RULE-${Math.floor(Math.random() * 90000 + 10000)}`,
        ip: alert.source_ip,
        action: 'BLOCK',
        enabled: true,
        reason: inc.reasoning_summary,
        created_at: new Date().toISOString()
      });

      await new Promise((r) => setTimeout(r, 300));

      this.emit({
        event_id: `EVT-${Date.now()}-7`,
        timestamp: new Date().toISOString(),
        incident_id: incId,
        event_type: 'ACTION',
        description: `Simulated firewall block applied to attacker source IP ${alert.source_ip}.`,
        tool: 'block_ip_simulated',
        confidence: inc.confidence,
        source: 'SentinelFlowAgent'
      });

      this.emit({
        event_id: `EVT-${Date.now()}-8`,
        timestamp: new Date().toISOString(),
        incident_id: incId,
        event_type: 'VERIFY',
        description: `Sandbox state verified: Traffic from ${alert.source_ip} is BLOCKED. Status: PASSED.`,
        tool: 'verify_block',
        confidence: inc.confidence,
        source: 'SentinelFlowAgent'
      });
    } else if (sc.scenario_id === 'scenario_2') {
      inc.attack_outcome = 'ATTACK_FAILED';
      inc.confidence = 88;
      inc.status = 'FALSE_POSITIVE';
      inc.reasoning_summary = 'ATTACK FAILED / FALSE POSITIVE: WAF perimeter defense intercepted SQLi attempt before reaching backend.';
      inc.response_status = 'NONE';
      this.emit({
        event_id: `EVT-${Date.now()}-dec`,
        timestamp: new Date().toISOString(),
        incident_id: incId,
        event_type: 'DECISION',
        description: `Classified as False Positive. Host defended by perimeter filter. No containment needed.`,
        confidence: inc.confidence,
        source: 'SentinelFlowAgent'
      });
    } else if (sc.scenario_id === 'scenario_3') {
      inc.attack_outcome = 'INSUFFICIENT_EVIDENCE';
      inc.confidence = 54;
      inc.status = 'INSUFFICIENT_EVIDENCE';
      inc.reasoning_summary = 'INSUFFICIENT EVIDENCE: Encrypted telemetry without host-level execution proof. Refusing binary classification.';
      inc.response_status = 'NONE';
      this.emit({
        event_id: `EVT-${Date.now()}-dec`,
        timestamp: new Date().toISOString(),
        incident_id: incId,
        event_type: 'DECISION',
        description: `Concluded with Insufficient Evidence. Refusing automated containment without host proof.`,
        confidence: inc.confidence,
        source: 'SentinelFlowAgent'
      });
    } else if (sc.scenario_id === 'scenario_5') {
      // Scenario 5 initially failed
      inc.attack_outcome = 'ATTACK_FAILED';
      inc.confidence = 72;
      inc.status = 'FALSE_POSITIVE';
      inc.reasoning_summary = 'ATTACK FAILED (PRELIMINARY): Synchronous endpoint probe returned 404; payload dropped.';
      inc.response_status = 'NONE';
      this.emit({
        event_id: `EVT-${Date.now()}-dec`,
        timestamp: new Date().toISOString(),
        incident_id: incId,
        event_type: 'DECISION',
        description: `Preliminary verdict: ATTACK FAILED (72%). Awaiting possible delayed telemetry.`,
        confidence: inc.confidence,
        source: 'SentinelFlowAgent'
      });
    }

    return incId;
  }

  async injectEvidence(incidentId: string, finding: string, confidenceImpact: number) {
    const inc = this.incidents.find((i) => i.incident_id === incidentId);
    if (!inc) return;

    this.emit({
      event_id: `EVT-${Date.now()}-adapt-1`,
      timestamp: new Date().toISOString(),
      incident_id: incidentId,
      event_type: 'ADAPT',
      description: `NEW EVIDENCE ARRIVED: ${finding}. Reopening incident for dynamic reassessment.`,
      confidence: inc.confidence,
      source: 'SentinelFlowAgent'
    });

    await new Promise((r) => setTimeout(r, 600));

    const evInj = {
      evidence_id: 'EVD-INJECTED-099',
      source_tool: 'inject_new_evidence',
      timestamp: new Date().toISOString(),
      finding,
      data: {},
      confidence_impact: confidenceImpact,
      supports_success: true
    };
    inc.evidence.push(evInj);

    inc.attack_outcome = 'ATTACK_SUCCEEDED';
    inc.confidence = 91;
    inc.is_adapted = true;
    inc.status = 'CONTAINED';
    inc.adaptation_reason = 'DECISION ADAPTED: Outcome flipped from ATTACK_FAILED (72%) to ATTACK_SUCCEEDED (91%) because newly injected delayed worker execution proved remote compromise.';
    inc.reasoning_summary = inc.adaptation_reason;
    inc.response_status = 'EXECUTED';
    inc.verification_status = 'PASSED';

    const alert = INITIAL_ALERTS.find((a) => a.alert_id === inc.alert_id) || INITIAL_ALERTS[0];
    this.firewallRules.push({
      rule_id: `RULE-${Math.floor(Math.random() * 90000 + 10000)}`,
      ip: alert.source_ip,
      action: 'BLOCK',
      enabled: true,
      reason: inc.adaptation_reason,
      created_at: new Date().toISOString()
    });

    this.emit({
      event_id: `EVT-${Date.now()}-adapt-2`,
      timestamp: new Date().toISOString(),
      incident_id: incidentId,
      event_type: 'ADAPT',
      description: inc.adaptation_reason,
      confidence: 91,
      source: 'SentinelFlowAgent'
    });

    this.emit({
      event_id: `EVT-${Date.now()}-adapt-3`,
      timestamp: new Date().toISOString(),
      incident_id: incidentId,
      event_type: 'ACTION',
      description: `Automated response policy executed: Simulated firewall block on ${alert.source_ip}.`,
      tool: 'block_ip_simulated',
      confidence: 91,
      source: 'SentinelFlowAgent'
    });

    this.emit({
      event_id: `EVT-${Date.now()}-adapt-4`,
      timestamp: new Date().toISOString(),
      incident_id: incidentId,
      event_type: 'VERIFY',
      description: `Post-action verification: Rule active in sandbox firewall table. Result: PASSED.`,
      tool: 'verify_block',
      confidence: 91,
      source: 'SentinelFlowAgent'
    });
  }

  applyOverride(incidentId: string, decision: string, reason: string) {
    const inc = this.incidents.find((i) => i.incident_id === incidentId);
    if (!inc) return;

    if (decision === 'FORCE_BLOCK' || decision === 'APPROVE_RESPONSE') {
      inc.response_status = 'EXECUTED';
      inc.verification_status = 'PASSED';
      inc.status = 'CONTAINED';
    } else if (decision === 'REJECT_RESPONSE') {
      inc.response_status = 'REJECTED';
    } else if (decision === 'RELEASE_BLOCK') {
      this.firewallRules = [];
      inc.response_status = 'NONE';
      inc.verification_status = 'NOT_VERIFIED';
    }

    this.emit({
      event_id: `EVT-${Date.now()}-ovr`,
      timestamp: new Date().toISOString(),
      incident_id: incidentId,
      event_type: 'OVERRIDE',
      description: `HUMAN OVERRIDE: ${decision} applied by analyst. Reason: ${reason}`,
      confidence: inc.confidence,
      source: 'SentinelFlowAgent'
    });
  }
}

export const mockEngine = new ClientSimulationEngine();
