import { Incident, Alert, Asset, SandboxState, Scenario, AgentEvent } from './types';
import { mockEngine, INITIAL_SCENARIOS, INITIAL_ALERTS } from './mockEngine';

const API_BASE = 'http://localhost:8000/api';

// Detect if we are running in static hosting (e.g. GitHub Pages)
const isStaticHost = typeof window !== 'undefined' && (
  window.location.hostname.endsWith('github.io') ||
  window.location.protocol === 'file:'
);

let backendAvailable: boolean | null = null;

async function checkBackend(): Promise<boolean> {
  if (isStaticHost) return false;
  if (backendAvailable !== null) return backendAvailable;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    backendAvailable = res.ok;
    return res.ok;
  } catch {
    backendAvailable = false;
    return false;
  }
}

export const api = {
  // Health
  async getHealth() {
    if (await checkBackend()) {
      const res = await fetch(`${API_BASE}/health`);
      return res.json();
    }
    return {
      status: 'healthy',
      application: 'SentinelFlow',
      environment: 'CLIENT_SIDE_STATIC_SANDBOX (GitHub Pages)',
      demo_mode: true
    };
  },

  // Incidents
  async listIncidents(): Promise<Incident[]> {
    if (await checkBackend()) {
      const res = await fetch(`${API_BASE}/incidents`);
      return res.json();
    }
    return mockEngine.incidents;
  },

  async getIncident(id: string): Promise<Incident> {
    if (await checkBackend()) {
      const res = await fetch(`${API_BASE}/incidents/${id}`);
      if (!res.ok) throw new Error(`Incident ${id} not found`);
      return res.json();
    }
    const inc = mockEngine.incidents.find((i) => i.incident_id === id);
    if (!inc) throw new Error(`Incident ${id} not found`);
    return inc;
  },

  async createIncident(alertId: string): Promise<Incident> {
    if (await checkBackend()) {
      const res = await fetch(`${API_BASE}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: alertId })
      });
      return res.json();
    }
    return mockEngine.incidents[0];
  },

  async startInvestigation(incidentId: string, maxSteps = 8) {
    if (await checkBackend()) {
      const res = await fetch(`${API_BASE}/incidents/${incidentId}/investigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ max_steps: maxSteps })
      });
      return res.json();
    }
    return { status: 'INVESTIGATION_STARTED', incident_id: incidentId };
  },

  async getIncidentEvents(incidentId: string): Promise<AgentEvent[]> {
    if (await checkBackend()) {
      const res = await fetch(`${API_BASE}/incidents/${incidentId}/events`);
      return res.json();
    }
    return mockEngine.events.filter((e) => e.incident_id === incidentId);
  },

  async getIncidentEvidence(incidentId: string) {
    if (await checkBackend()) {
      const res = await fetch(`${API_BASE}/incidents/${incidentId}/evidence`);
      return res.json();
    }
    const inc = mockEngine.incidents.find((i) => i.incident_id === incidentId);
    return inc?.evidence || [];
  },

  // Overrides & Responses
  async executeResponse(incidentId: string) {
    if (await checkBackend()) {
      const res = await fetch(`${API_BASE}/incidents/${incidentId}/response`, { method: 'POST' });
      return res.json();
    }
    mockEngine.applyOverride(incidentId, 'FORCE_BLOCK', 'Operator simulated containment');
    return { success: true };
  },

  async applyOverride(incidentId: string, overrideDecision: string, reason: string, operator = 'SOC Lead') {
    if (await checkBackend()) {
      const res = await fetch(`${API_BASE}/incidents/${incidentId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ override_decision: overrideDecision, reason, operator })
      });
      return res.json();
    }
    mockEngine.applyOverride(incidentId, overrideDecision, reason);
    return { success: true };
  },

  async injectEvidence(incidentId: string, finding: string, confidenceImpact = 35) {
    if (await checkBackend()) {
      const res = await fetch(`${API_BASE}/incidents/${incidentId}/inject-evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finding,
          confidence_impact: confidenceImpact,
          supports_success: true
        })
      });
      return res.json();
    }
    await mockEngine.injectEvidence(incidentId, finding, confidenceImpact);
    return { status: 'EVIDENCE_INJECTED', incident_id: incidentId };
  },

  // Sandbox & Simulation
  async getSandboxState(): Promise<SandboxState> {
    if (await checkBackend()) {
      const res = await fetch(`${API_BASE}/sandbox/state`);
      return res.json();
    }
    return {
      sandbox_status: 'ACTIVE_ISOLATED (Client Simulation)',
      active_firewall_blocks: mockEngine.firewallRules,
      monitored_assets_count: 15,
      recent_alerts_count: INITIAL_ALERTS.length,
      active_incidents_count: mockEngine.incidents.length,
      timestamp: new Date().toISOString(),
      safety_guarantee: 'All actions strictly contained in sandbox.'
    };
  },

  async resetSandbox() {
    if (await checkBackend()) {
      const res = await fetch(`${API_BASE}/sandbox/reset`, { method: 'POST' });
      return res.json();
    }
    mockEngine.reset();
    return { status: 'RESET_SUCCESSFUL' };
  },

  async listScenarios(): Promise<Record<string, Scenario>> {
    if (await checkBackend()) {
      const res = await fetch(`${API_BASE}/sandbox/scenarios`);
      return res.json();
    }
    return INITIAL_SCENARIOS;
  },

  async launchScenario(scenarioId: string) {
    if (await checkBackend()) {
      const res = await fetch(`${API_BASE}/sandbox/scenario/${scenarioId}`, { method: 'POST' });
      return res.json();
    }
    const incidentId = await mockEngine.runScenario(scenarioId);
    return { status: 'SCENARIO_LAUNCHED', incident_id: incidentId };
  },

  async toggleToolFailure(toolName: string, shouldFail: boolean) {
    if (await checkBackend()) {
      const res = await fetch(`${API_BASE}/sandbox/tool-failure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_name: toolName, should_fail: shouldFail })
      });
      return res.json();
    }
    mockEngine.toolFailures[toolName] = shouldFail;
    return { tool_name: toolName, is_failing_simulated: shouldFail };
  },

  // Catalogs
  async listTools() {
    if (await checkBackend()) {
      const res = await fetch(`${API_BASE}/tools`);
      return res.json();
    }
    return [
      { name: 'get_alert' },
      { name: 'get_asset' },
      { name: 'get_vulnerabilities' },
      { name: 'get_packet_metadata' },
      { name: 'get_server_logs' },
      { name: 'block_ip_simulated' },
      { name: 'verify_block' }
    ];
  },

  async listAlerts(): Promise<Alert[]> {
    if (await checkBackend()) {
      const res = await fetch(`${API_BASE}/alerts`);
      return res.json();
    }
    return INITIAL_ALERTS;
  },

  async listAssets(): Promise<Asset[]> {
    if (await checkBackend()) {
      const res = await fetch(`${API_BASE}/assets`);
      return res.json();
    }
    return [];
  },

  // SSE Stream helper
  createEventSource(onEvent: (event: AgentEvent) => void): { close: () => void } {
    if (!isStaticHost) {
      try {
        const es = new EventSource(`${API_BASE}/events/stream`);
        es.addEventListener('agent_event', (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            onEvent(parsed);
          } catch (err) {
            console.error('Failed to parse SSE payload:', err);
          }
        });
        return es;
      } catch {
        // Fall back to mockEngine event listener
      }
    }
    const unsubscribe = mockEngine.onEvent(onEvent);
    return { close: unsubscribe };
  }
};
