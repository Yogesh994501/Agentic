import React, { useState, useEffect, useCallback } from 'react';
import { api } from './lib/api';
import type { Incident, Alert, SandboxState, Scenario, AgentEvent } from './lib/types';
import { Header } from './components/Header';
import { NavigationDrawer } from './components/NavigationDrawer';
import { FloatingAgentStatus } from './components/FloatingAgentStatus';
import { BackToTop } from './components/BackToTop';
import { KpiCards } from './components/KpiCards';
import { SimulationControl } from './components/SimulationControl';
import { LiveAgentState } from './components/LiveAgentState';
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

  // Navigation & Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('command-center');

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
        api.getSandboxState(),
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
      } else if (
        newEvent.event_type === 'DECISION' &&
        (newEvent.description.includes('concluded') || newEvent.description.includes('Assessment:'))
      ) {
        // Allow brief interval to reflect completion
        setTimeout(() => setAgentStatus('IDLE'), 1800);
      } else if (
        newEvent.event_type === 'OBSERVE' ||
        newEvent.event_type === 'PLAN' ||
        newEvent.event_type === 'TOOL_CALL'
      ) {
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

  // Smooth Scroll Helper
  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // IntersectionObserver for Automatic Active Section Highlighting
  useEffect(() => {
    const sectionIds = ['command-center', 'simulation', 'investigation', 'evidence', 'agent-trace'];

    const handleIntersect: IntersectionObserverCallback = (entries) => {
      const visibleEntries = entries.filter((e) => e.isIntersecting);
      if (visibleEntries.length > 0) {
        // Sort by intersection ratio descending
        visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        setActiveSection(visibleEntries[0].target.id);
      }
    };

    const observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: '-80px 0px -40% 0px',
      threshold: [0.15, 0.35, 0.6],
    });

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
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
      // Auto-scroll into investigation section to watch live execution
      scrollToSection('investigation');
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
  const avgConfidence =
    incidents.length > 0
      ? Math.round(incidents.reduce((acc, i) => acc + (i.confidence || 0), 0) / incidents.length)
      : 85;

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 cyber-grid flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Left-Side Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeSection={activeSection}
        onNavigate={scrollToSection}
        agentStatus={agentStatus}
      />

      {/* Sticky Operational Header with Navigation */}
      <Header
        sandboxState={sandboxState}
        agentStatus={agentStatus}
        onReset={handleResetSandbox}
        isResetting={isResetting}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        activeSection={activeSection}
        onNavigate={scrollToSection}
      />

      <main className="flex-1 p-4 lg:p-6 space-y-6 sm:space-y-7 max-w-[1680px] w-full mx-auto">
        {/* 1. Command Center / KPI Row */}
        <section id="command-center" className="scroll-mt-20">
          <KpiCards
            incidents={incidents}
            avgConfidence={avgConfidence}
            isInvestigating={agentStatus === 'INVESTIGATING'}
          />
        </section>

        {/* 2. Simulation Scenario Controls */}
        <section id="simulation" className="scroll-mt-20">
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
        </section>

        {/* 3. Live Autonomous Investigation Pipeline & Hypothesis */}
        <section id="investigation" className="scroll-mt-20 space-y-5 sm:space-y-6">
          <LiveAgentState
            incident={currentIncident}
            events={events}
            isInvestigating={agentStatus === 'INVESTIGATING'}
          />

          <LiveInvestigation
            incident={currentIncident}
            alert={currentAlert}
            isInvestigating={agentStatus === 'INVESTIGATING'}
          />
        </section>

        {/* 4. Multi-Source Evidence Correlation Graph */}
        <section id="evidence" className="scroll-mt-20">
          <EvidenceGraph incident={currentIncident} alert={currentAlert} />
        </section>

        {/* 5. Agent Trace: Live Telemetry Stream & Reasoning Center */}
        <section id="agent-trace" className="scroll-mt-20 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column (7 cols): Real-Time Agent Execution Timeline */}
          <div className="lg:col-span-7">
            <AgentTimeline events={events} />
          </div>

          {/* Right Column (5 cols): Reasoning Decision Trace & Response Center */}
          <div className="lg:col-span-5 space-y-4">
            <div id="decision-trace" className="scroll-mt-20">
              <ReasoningPanel incident={currentIncident} />
            </div>
            <ResponseCenter
              incident={currentIncident}
              alert={currentAlert}
              firewallRules={sandboxState?.active_firewall_blocks || []}
              onExecuteBlock={handleExecuteBlock}
              onRejectResponse={handleRejectResponse}
              onReleaseBlock={handleReleaseBlock}
            />
          </div>
        </section>
      </main>

      {/* Floating Persistent Agent Status Pill (Fixed Bottom Right) */}
      <FloatingAgentStatus
        agentStatus={agentStatus}
        currentIncident={currentIncident}
        onClick={() => scrollToSection('investigation')}
      />

      {/* Back to Top Floating Button (Visible after ~450px scroll) */}
      <BackToTop />

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
