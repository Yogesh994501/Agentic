import React, { useState, useEffect, useCallback } from 'react';
import { api } from './lib/api';
import { Incident, Alert, Asset, SandboxState, Scenario, AgentEvent, FirewallRule } from './lib/types';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { SimulationControl } from './components/SimulationControl';
import { LiveInvestigation } from './components/LiveInvestigation';
import { EvidenceGraph } from './components/EvidenceGraph';
import { AgentTimeline } from './components/AgentTimeline';
import { ReasoningPanel } from './components/ReasoningPanel';
import { ResponseCenter } from './components/ResponseCenter';
import { EvidenceInjectionModal } from './components/EvidenceInjectionModal';
import { HumanOverrideModal } from './components/HumanOverrideModal';

export const App: React.FC = () => {
  // Application Data State
  const [scenarios, setScenarios] = useState<Record<string, Scenario>>({});
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scenario_1');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [currentIncident, setCurrentIncident] = useState<Incident | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sandboxState, setSandboxState] = useState<SandboxState | null>(null);
  const [events, setEvents] = useState<AgentEvent[]>([]);

  // Agent State
  const [agentStatus, setAgentStatus] = useState<'IDLE' | 'INVESTIGATING' | 'RESPONDING'>('IDLE');
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [toolFailureActive, setToolFailureActive] = useState<boolean>(false);

  // Modals
  const [isInjectModalOpen, setIsInjectModalOpen] = useState<boolean>(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState<boolean>(false);

  // Initial Data Fetch
  const loadInitialData = useCallback(async () => {
    try {
      const [scList, incList, alList, sbState] = await Promise.all([
        api.listScenarios(),
        api.listIncidents(),
        api.listAlerts(),
        api.getSandboxState()
      ]);

      setScenarios(scList);
      setIncidents(incList);
      setAlerts(alList);
      setSandboxState(sbState);

      if (incList.length > 0) {
        const topInc = incList[0];
        setCurrentIncident(topInc);
        const incEvents = await api.getIncidentEvents(topInc.incident_id);
        setEvents(incEvents);
      }
    } catch (err) {
      console.error('Failed to load initial SOC telemetry:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Server-Sent Events (SSE) Live Stream Subscription
  useEffect(() => {
    const es = api.createEventSource((newEvent: AgentEvent) => {
      setEvents((prev) => [...prev, newEvent]);

      // Update agent state
      if (newEvent.event_type === 'ACTION') {
        setAgentStatus('RESPONDING');
      } else if (newEvent.event_type === 'DECISION' && newEvent.description.includes('concluded')) {
        setAgentStatus('IDLE');
      } else if (newEvent.event_type === 'OBSERVE' || newEvent.event_type === 'PLAN') {
        setAgentStatus('INVESTIGATING');
      }

      // Refresh incident state when decisions, evidence, or actions occur
      if (['EVIDENCE', 'DECISION', 'ACTION', 'VERIFY', 'ADAPT', 'OVERRIDE'].includes(newEvent.event_type)) {
        api.listIncidents().then((updatedList) => {
          setIncidents(updatedList);
          const matched = updatedList.find((i) => i.incident_id === newEvent.incident_id);
          if (matched) {
            setCurrentIncident(matched);
          }
        });
        api.getSandboxState().then(setSandboxState);
      }
    });

    return () => {
      es.close();
    };
  }, []);

  // Handlers
  const handleLaunchScenario = async (scenarioId: string) => {
    try {
      setAgentStatus('INVESTIGATING');
      setEvents([]);
      const res = await api.launchScenario(scenarioId);
      const inc = await api.getIncident(res.incident_id);
      setCurrentIncident(inc);
      setIncidents((prev) => [inc, ...prev.filter((i) => i.incident_id !== inc.incident_id)]);
    } catch (err) {
      console.error('Failed to launch scenario:', err);
      setAgentStatus('IDLE');
    }
  };

  const handleResetSandbox = async () => {
    setIsResetting(true);
    try {
      await api.resetSandbox();
      await loadInitialData();
      setEvents([]);
      setAgentStatus('IDLE');
    } catch (err) {
      console.error('Failed to reset sandbox:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleToggleToolFailure = async (toolName: string, shouldFail: boolean) => {
    try {
      await api.toggleToolFailure(toolName, shouldFail);
      setToolFailureActive(shouldFail);
    } catch (err) {
      console.error('Failed to toggle tool failure:', err);
    }
  };

  const handleInjectEvidence = async (finding: string, confidenceImpact: number) => {
    if (!currentIncident) return;
    try {
      setAgentStatus('INVESTIGATING');
      await api.injectEvidence(currentIncident.incident_id, finding, confidenceImpact);
    } catch (err) {
      console.error('Failed to inject evidence:', err);
    }
  };

  const handleApplyOverride = async (decision: string, reason: string, operator: string) => {
    if (!currentIncident) return;
    try {
      await api.applyOverride(currentIncident.incident_id, decision, reason, operator);
      const updated = await api.getIncident(currentIncident.incident_id);
      setCurrentIncident(updated);
      const sbState = await api.getSandboxState();
      setSandboxState(sbState);
    } catch (err) {
      console.error('Failed to apply override:', err);
    }
  };

  const handleExecuteBlock = async () => {
    if (!currentIncident) return;
    try {
      await api.executeResponse(currentIncident.incident_id);
      const updated = await api.getIncident(currentIncident.incident_id);
      setCurrentIncident(updated);
      const sbState = await api.getSandboxState();
      setSandboxState(sbState);
    } catch (err) {
      console.error('Failed to execute block:', err);
    }
  };

  const handleRejectResponse = async () => {
    if (!currentIncident) return;
    await handleApplyOverride('REJECT_RESPONSE', 'Analyst rejected automated block action.', 'SOC Analyst');
  };

  const handleReleaseBlock = async (ip: string) => {
    if (!currentIncident) return;
    await handleApplyOverride('RELEASE_BLOCK', `Manual release of simulated block on IP ${ip}`, 'SOC Analyst');
  };

  // Associated Alert
  const currentAlert = alerts.find((a) => a.alert_id === currentIncident?.alert_id) || null;
  const avgConfidence = incidents.length > 0
    ? Math.round(incidents.reduce((acc, i) => acc + (i.confidence || 0), 0) / incidents.length)
    : 85;

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 cyber-grid flex flex-col">
      {/* Top Header */}
      <Header
        sandboxState={sandboxState}
        agentStatus={agentStatus}
        onReset={handleResetSandbox}
        isResetting={isResetting}
      />

      <main className="flex-1 p-4 lg:p-6 space-y-4 max-w-[1700px] w-full mx-auto">
        {/* KPI Metrics */}
        <KpiCards incidents={incidents} avgConfidence={avgConfidence} />

        {/* Simulation Scenario Controls */}
        <SimulationControl
          scenarios={scenarios}
          selectedScenarioId={selectedScenarioId}
          onSelectScenario={setSelectedScenarioId}
          onLaunchScenario={handleLaunchScenario}
          onOpenInjectModal={() => setIsInjectModalOpen(true)}
          onOpenOverrideModal={() => setIsOverrideModalOpen(true)}
          onToggleToolFailure={handleToggleToolFailure}
          toolFailureActive={toolFailureActive}
          isInvestigating={agentStatus === 'INVESTIGATING'}
        />

        {/* Live Investigation Telemetry Panel */}
        <LiveInvestigation
          incident={currentIncident}
          alert={currentAlert}
          isInvestigating={agentStatus === 'INVESTIGATING'}
        />

        {/* Visual Multi-Source Evidence Correlation Graph */}
        <EvidenceGraph incident={currentIncident} alert={currentAlert} />

        {/* Two-Column Split: Left = Live Event Stream, Right = Reasoning & Response Center */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column (7 cols): Real-Time Agent Execution Timeline */}
          <div className="lg:col-span-7">
            <AgentTimeline events={events} />
          </div>

          {/* Right Column (5 cols): Reasoning Decision Trace & Response Center */}
          <div className="lg:col-span-5 space-y-4">
            <ReasoningPanel incident={currentIncident} />
            <ResponseCenter
              incident={currentIncident}
              alert={currentAlert}
              firewallRules={sandboxState?.active_firewall_blocks || []}
              onExecuteBlock={handleExecuteBlock}
              onRejectResponse={handleRejectResponse}
              onReleaseBlock={handleReleaseBlock}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      {currentIncident && (
        <>
          <EvidenceInjectionModal
            isOpen={isInjectModalOpen}
            onClose={() => setIsInjectModalOpen(false)}
            onInject={handleInjectEvidence}
            incidentId={currentIncident.incident_id}
          />
          <HumanOverrideModal
            isOpen={isOverrideModalOpen}
            onClose={() => setIsOverrideModalOpen(false)}
            onApplyOverride={handleApplyOverride}
            incidentId={currentIncident.incident_id}
          />
        </>
      )}
    </div>
  );
};

export default App;
