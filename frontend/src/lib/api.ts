import { Incident, Alert, Asset, SandboxState, Scenario, AgentEvent } from './types';

const API_BASE = 'http://localhost:8000/api';

export const api = {
  // Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Incidents
  async listIncidents(): Promise<Incident[]> {
    const res = await fetch(`${API_BASE}/incidents`);
    return res.json();
  },

  async getIncident(id: string): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents/${id}`);
    if (!res.ok) throw new Error(`Incident ${id} not found`);
    return res.json();
  },

  async createIncident(alertId: string): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alert_id: alertId })
    });
    return res.json();
  },

  async startInvestigation(incidentId: string, maxSteps = 8) {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/investigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ max_steps: maxSteps })
    });
    return res.json();
  },

  async getIncidentEvents(incidentId: string): Promise<AgentEvent[]> {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/events`);
    return res.json();
  },

  async getIncidentEvidence(incidentId: string) {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/evidence`);
    return res.json();
  },

  // Overrides & Responses
  async executeResponse(incidentId: string) {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/response`, {
      method: 'POST'
    });
    return res.json();
  },

  async applyOverride(incidentId: string, overrideDecision: string, reason: string, operator = 'SOC Lead') {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        override_decision: overrideDecision,
        reason,
        operator
      })
    });
    return res.json();
  },

  async injectEvidence(incidentId: string, finding: string, confidenceImpact = 35) {
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
  },

  // Sandbox & Simulation
  async getSandboxState(): Promise<SandboxState> {
    const res = await fetch(`${API_BASE}/sandbox/state`);
    return res.json();
  },

  async resetSandbox() {
    const res = await fetch(`${API_BASE}/sandbox/reset`, { method: 'POST' });
    return res.json();
  },

  async listScenarios(): Promise<Record<string, Scenario>> {
    const res = await fetch(`${API_BASE}/sandbox/scenarios`);
    return res.json();
  },

  async launchScenario(scenarioId: string) {
    const res = await fetch(`${API_BASE}/sandbox/scenario/${scenarioId}`, {
      method: 'POST'
    });
    return res.json();
  },

  async toggleToolFailure(toolName: string, shouldFail: boolean) {
    const res = await fetch(`${API_BASE}/sandbox/tool-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_name: toolName, should_fail: shouldFail })
    });
    return res.json();
  },

  // Catalogs
  async listTools() {
    const res = await fetch(`${API_BASE}/tools`);
    return res.json();
  },

  async listAlerts(): Promise<Alert[]> {
    const res = await fetch(`${API_BASE}/alerts`);
    return res.json();
  },

  async listAssets(): Promise<Asset[]> {
    const res = await fetch(`${API_BASE}/assets`);
    return res.json();
  },

  // SSE Stream helper
  createEventSource(onEvent: (event: AgentEvent) => void): EventSource {
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
  }
};
