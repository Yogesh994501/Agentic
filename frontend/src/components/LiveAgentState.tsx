import React from 'react';
import { CheckCircle2, Activity, Layers } from 'lucide-react';
import type { Incident, AgentEvent } from '../lib/types';

interface LiveAgentStateProps {
  incident: Incident | null;
  events: AgentEvent[];
  isInvestigating: boolean;
}

export const LiveAgentState: React.FC<LiveAgentStateProps> = ({
  incident,
  events,
  isInvestigating
}) => {
  if (!incident) return null;

  const latestEvent = events.length > 0 ? events[events.length - 1] : null;
  const isComplete = !isInvestigating && incident.attack_outcome !== 'UNDETERMINED';
  const outcome = incident.attack_outcome;

  // Pipeline phases
  const phases = [
    { id: 'OBSERVE', label: 'Observe Alert' },
    { id: 'PLAN', label: 'Analyze Gaps' },
    { id: 'RETRIEVE', label: 'Retrieve Evidence' },
    { id: 'CORRELATE', label: 'Correlate' },
    { id: 'DECIDE', label: 'Decide Outcome' },
    { id: 'RESPOND', label: 'Simulate Action' },
    { id: 'VERIFY', label: 'Verify State' },
  ];

  // Determine current active phase based on recent events
  const getActivePhaseIndex = () => {
    if (isComplete) return phases.length;
    if (!latestEvent) return 0;
    const type = latestEvent.event_type;
    if (type === 'OBSERVE') return 0;
    if (type === 'PLAN') return 1;
    if (type === 'TOOL_CALL' || type === 'TOOL_RESULT') return 2;
    if (type === 'EVIDENCE' || type === 'HYPOTHESIS_UPDATE') return 3;
    if (type === 'DECISION') return 4;
    if (type === 'ACTION') return 5;
    if (type === 'VERIFY') return 6;
    return 2;
  };

  const currentPhaseIndex = getActivePhaseIndex();

  return (
    <div className={`p-5 sm:p-6 rounded-xl border transition-all ${
      isInvestigating
        ? 'bg-gradient-to-r from-amber-950/40 via-cyan-950/30 to-slate-900/60 border-cyan-500/40 shadow-[0_0_25px_rgba(0,240,255,0.15)]'
        : isComplete
        ? 'bg-slate-900/90 border-slate-800'
        : 'bg-slate-900/60 border-slate-800'
    }`}>
      {/* Top Header: Phase State & Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          {isInvestigating ? (
            <div className="flex items-center space-x-2.5 text-amber-300 font-mono text-sm sm:text-base font-bold uppercase tracking-wider">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <span>Autonomous Agent In Progress — {incident.incident_id}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2.5 text-emerald-400 font-mono text-sm sm:text-base font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-5 h-5" />
              <span>Investigation Cycle Complete — {incident.incident_id}</span>
            </div>
          )}
        </div>

        {/* Live Metrics Summary: 12-14px */}
        <div className="flex items-center space-x-3.5 text-xs sm:text-sm font-mono">
          <span className="text-slate-300">
            Evidence: <strong className="text-cyan-400 font-bold">{incident.evidence.length} Artifacts</strong>
          </span>
          <span className="text-slate-600 font-bold">|</span>
          <span className="text-slate-300">
            Confidence: <strong className="text-purple-400 font-bold">{incident.confidence}%</strong>
          </span>
        </div>
      </div>

      {/* Horizontal Agentic Pipeline Stepper */}
      <div className="flex items-center justify-between gap-2 py-4 overflow-x-auto font-mono text-xs">
        {phases.map((phase, idx) => {
          const isPassed = currentPhaseIndex > idx;
          const isCurrent = currentPhaseIndex === idx;

          return (
            <React.Fragment key={phase.id}>
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                isCurrent
                  ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200 shadow-glow-cyan font-bold'
                  : isPassed
                  ? 'text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 font-medium'
                  : 'text-slate-500 bg-slate-900/40'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  isCurrent ? 'bg-cyan-400 animate-ping' :
                  isPassed ? 'bg-emerald-400' : 'bg-slate-700'
                }`} />
                <span>{phase.label}</span>
              </div>
              {idx < phases.length - 1 && (
                <span className={`text-xs ${isPassed ? 'text-emerald-500' : 'text-slate-700'}`}>→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Bottom Row: Current Action & Live Hypothesis */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2 font-mono">
        {/* Current Agent Action: 13-14px body text */}
        <div className="md:col-span-6 bg-slate-950/70 p-3.5 sm:p-4 rounded-xl border border-slate-800 flex items-start space-x-3">
          <Activity className={`w-4 h-4 mt-1 shrink-0 ${isInvestigating ? 'text-cyan-400 animate-spin' : 'text-slate-400'}`} />
          <div className="flex-1">
            <span className="text-xs text-slate-400 uppercase font-semibold block">
              {isInvestigating ? 'Current Autonomous Action' : 'Final Outcome Reached'}
            </span>
            <p className="text-sm text-slate-100 mt-1.5 leading-relaxed">
              {isInvestigating
                ? (latestEvent?.description || 'Agent evaluating evidence gaps and picking next sandbox tool...')
                : `${incident.attack_outcome.replace('ATTACK_', '')} (${incident.confidence}% confidence) — ${
                    outcome === 'ATTACK_SUCCEEDED' ? 'Simulated firewall containment verified active.' :
                    outcome === 'ATTACK_FAILED' ? 'Perimeter defended host; no containment required.' :
                    'Telemetry inconclusive; refusing binary forced action.'
                  }`}
            </p>
          </div>
        </div>

        {/* Working Hypothesis: 13-14px body text */}
        <div className="md:col-span-6 bg-slate-950/70 p-3.5 sm:p-4 rounded-xl border border-slate-800 flex items-start space-x-3">
          <Layers className="w-4 h-4 text-amber-400 mt-1 shrink-0" />
          <div className="flex-1">
            <span className="text-xs text-slate-400 uppercase font-semibold block">
              Working Hypothesis
            </span>
            <p className="text-sm text-slate-200 mt-1.5 leading-relaxed italic">
              "{incident.current_hypothesis}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
